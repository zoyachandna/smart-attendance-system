from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Dict, Any
from app.models.user import User, RoleEnum
from app.models.student_record import StudentRecord
from app.models.attendance_record import AttendanceRecord, AttendanceStatusEnum
from app.api import deps
import pandas as pd
import io

router = APIRouter()

@router.get("/classes")
async def get_student_classes(current_user: User = Depends(deps.get_current_user)):
    """
    Retrieve aggregated class folders (course + branch + section) for students.
    """
    if not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    pipeline = [
        {
            "$group": {
                "_id": {
                    "course": "$course",
                    "branch": "$branch",
                    "section": "$section"
                },
                "student_count": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "course": "$_id.course",
                "branch": "$_id.branch",
                "section": "$_id.section",
                "student_count": 1
            }
        },
        {
            "$sort": {
                "course": 1,
                "branch": 1,
                "section": 1
            }
        }
    ]
    
    # Run aggregation
    classes = await StudentRecord.aggregate(pipeline).to_list()
    return classes

@router.get("/")
async def get_student_records(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    course: str = None,
    branch: str = None,
    section: str = None,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve all student records (Admin only).
    """
    if not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not authorized")
    query = {}
    if course:
        query["course"] = course
    if branch:
        query["branch"] = branch
    if section:
        query["section"] = section
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"student_id": {"$regex": search, "$options": "i"}}
        ]
        
    records = await StudentRecord.find(query).skip(skip).limit(limit).to_list()
    total = await StudentRecord.find(query).count()
    
    # Calculate attendance efficiently
    # 1. Get student_ids from current page records
    student_ids = [r.student_id for r in records if r.is_registered]
    
    # 2. Find corresponding User ObjectIDs
    users = await User.find({"student_id": {"$in": student_ids}, "role": RoleEnum.STUDENT}).to_list()
    user_id_map = {str(u.id): u.student_id for u in users}
    user_ids = [u.id for u in users]
    
    # 3. Aggregate AttendanceRecords for these Users
    attendance_map = {}
    if user_ids:
        pipeline = [
            {"$match": {"student.$id": {"$in": user_ids}}},
            {"$group": {
                "_id": "$student.$id",
                "total": {"$sum": 1},
                "attended": {
                    "$sum": {"$cond": [{"$eq": ["$status", AttendanceStatusEnum.PRESENT]}, 1, 0]}
                }
            }}
        ]
        agg_results = await AttendanceRecord.aggregate(pipeline).to_list()
        
        for res in agg_results:
            u_id = str(res["_id"])
            if u_id in user_id_map:
                s_id = user_id_map[u_id]
                total_sess = res["total"]
                attended_sess = res["attended"]
                perc = (attended_sess / total_sess * 100) if total_sess > 0 else 0
                attendance_map[s_id] = round(perc, 1)

    # 4. Attach to response
    records_out = []
    for r in records:
        r_dict = r.model_dump()
        r_dict["attendance_percentage"] = attendance_map.get(r.student_id, None)
        records_out.append(r_dict)
    
    return {
        "total": total,
        "records": records_out
    }

@router.post("/")
async def add_student_record(
    record_data: dict,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Manually add or update a single student record.
    """
    if not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    student_id = record_data.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id is required")
        
    existing_record = await StudentRecord.find_one({"student_id": student_id})
    
    if existing_record:
        # Update existing record
        for key, value in record_data.items():
            if hasattr(existing_record, key) and key != "student_id":
                setattr(existing_record, key, value)
        await existing_record.save()
        
        # Propagate to User if registered
        if existing_record.is_registered:
            user = await User.find_one({"student_id": student_id, "role": RoleEnum.STUDENT})
            if user:
                user.roll_number = existing_record.roll_number
                user.department = existing_record.department
                user.course = existing_record.course
                user.branch = existing_record.branch
                user.semester = existing_record.semester
                user.section = existing_record.section
                user.academic_year = existing_record.academic_year
                await user.save()
                
        return {"message": "Record updated successfully", "status": "updated"}
    else:
        # Create new record
        new_record = StudentRecord(**record_data)
        await new_record.insert()
        return {"message": "Record created successfully", "status": "created"}

@router.post("/import")
async def bulk_import_students(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Bulk import students via CSV or Excel file.
    """
    if not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx')):
        raise HTTPException(status_code=400, detail="Only .csv and .xlsx files are supported")
        
    contents = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
        # Clean column names (lowercase, strip whitespace, replace spaces with underscores)
        df.columns = [str(c).strip().lower().replace(' ', '_') for c in df.columns]
        
        if 'student_id' not in df.columns:
            raise HTTPException(status_code=400, detail="File must contain a 'student_id' column")
            
        df = df.fillna('')
        
        added_count = 0
        updated_count = 0
        
        # Iterate and save
        for _, row in df.iterrows():
            student_id = str(row['student_id']).strip()
            if not student_id:
                continue
                
            record_data = {
                "student_id": student_id,
                "full_name": str(row.get('full_name', '')).strip(),
                "roll_number": str(row.get('roll_number', '')).strip() or None,
                "department": str(row.get('department', '')).strip() or None,
                "course": str(row.get('course', '')).strip() or None,
                "branch": str(row.get('branch', '')).strip() or None,
                "semester": str(row.get('semester', '')).strip() or None,
                "section": str(row.get('section', '')).strip() or None,
                "academic_year": str(row.get('academic_year', '')).strip() or None,
            }
            
            existing = await StudentRecord.find_one({"student_id": student_id})
            if existing:
                # Update existing
                for k, v in record_data.items():
                    if k != 'student_id' and v is not None:
                        setattr(existing, k, v)
                await existing.save()
                updated_count += 1
                
                # Propagate if registered
                if existing.is_registered:
                    user = await User.find_one({"student_id": student_id, "role": RoleEnum.STUDENT})
                    if user:
                        for k, v in record_data.items():
                            if k not in ['student_id', 'full_name'] and v is not None:
                                setattr(user, k, v)
                        await user.save()
            else:
                # Insert new
                if not record_data['full_name']:
                    record_data['full_name'] = "Unknown" # fallback
                new_record = StudentRecord(**record_data)
                await new_record.insert()
                added_count += 1
                
        return {
            "message": "Import completed successfully",
            "added": added_count,
            "updated": updated_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

@router.delete("/{student_id}")
async def delete_student_record(
    student_id: str,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Delete a student record.
    """
    if not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    existing = await StudentRecord.find_one({"student_id": student_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Student record not found")
        
    await existing.delete()
    return {"message": "Student record deleted successfully"}
