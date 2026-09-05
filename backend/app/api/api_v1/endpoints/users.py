from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdateProfile, UserUpdatePassword, UserUpdateReference
from app.api import deps
from app.core import security
from app.models.classroom import ClassRoom
from app.models.session import Session
from app.models.attendance_record import AttendanceRecord, AttendanceStatusEnum

router = APIRouter()

@router.get("/me/profile")
async def get_my_profile(current_user: User = Depends(deps.get_current_user)):
    """
    Get the current user's profile and aggregated statistics.
    """
    stats = {}
    
    if current_user.is_teacher():
        # Get teacher stats
        classes = await ClassRoom.find(ClassRoom.teacher.id == current_user.id).to_list()
        total_classes = len(classes)
        total_students = sum(c.total_students_count for c in classes)
        
        # Get total sessions
        total_sessions = 0
        for c in classes:
            sessions_count = await Session.find(Session.class_room.id == c.id).count()
            total_sessions += sessions_count
            
        stats = {
            "total_classes": total_classes,
            "total_students": total_students,
            "total_sessions": total_sessions
        }
        
    elif current_user.is_student():
        # Get student stats
        all_classes = await ClassRoom.find_all(fetch_links=True).to_list()
        enrolled_classes = []
        for c in all_classes:
            if (c.course == current_user.course and 
                c.branch == current_user.branch and 
                c.section == current_user.section):
                enrolled_classes.append(c)
        
        # Calculate overall attendance
        total_attended = 0
        total_missed = 0
        
        for c in enrolled_classes:
            sessions = await Session.find(Session.class_room.id == c.id).to_list()
            for s in sessions:
                record = await AttendanceRecord.find_one(
                    AttendanceRecord.session.id == s.id,
                    AttendanceRecord.student.id == current_user.id
                )
                if record and record.status == AttendanceStatusEnum.PRESENT:
                    total_attended += 1
                else:
                    total_missed += 1
                    
        total_possible = total_attended + total_missed
        overall_percentage = (total_attended / total_possible * 100) if total_possible > 0 else 0
        
        stats = {
            "total_attended": total_attended,
            "total_missed": total_missed,
            "overall_percentage": round(overall_percentage, 1)
        }
        
    return {
        "user": UserResponse(
            id=str(current_user.id),
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            role=current_user.role,
            phone_number=current_user.phone_number,
            department=current_user.department,
            student_id=current_user.student_id,
            roll_number=current_user.roll_number,
            semester=current_user.semester,
            section=current_user.section,
            academic_year=current_user.academic_year,
            employee_id=current_user.employee_id,
            designation=current_user.designation,
            subjects_taught=current_user.subjects_taught
        ),
        "stats": stats
    }

@router.put("/me/profile", response_model=UserResponse)
async def update_my_profile(
    profile_in: UserUpdateProfile,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update the current user's editable profile fields.
    """
    update_data = profile_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if hasattr(current_user, field):
            # Only teachers can update designation and subjects_taught
            if field in ["designation", "subjects_taught"] and not current_user.is_teacher():
                continue
            setattr(current_user, field, value)
            
    await current_user.save()
    
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        phone_number=current_user.phone_number,
        department=current_user.department,
        student_id=current_user.student_id,
        roll_number=current_user.roll_number,
        semester=current_user.semester,
        section=current_user.section,
        academic_year=current_user.academic_year,
        employee_id=current_user.employee_id,
        designation=current_user.designation,
        subjects_taught=current_user.subjects_taught
    )

@router.put("/me/password")
async def update_my_password(
    password_in: UserUpdatePassword,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update the current user's password.
    """
    # Verify current password
    if not security.verify_password(password_in.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
        
    # Hash and set new password
    hashed_password = security.get_password_hash(password_in.new_password)
    current_user.hashed_password = hashed_password
    await current_user.save()
    
    return {"message": "Password updated successfully"}

@router.put("/me/reference-picture")
async def update_my_reference_picture(
    ref_in: UserUpdateReference,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update the current user's reference picture for face recognition.
    """
    current_user.reference_image_base64 = ref_in.reference_image_base64
    await current_user.save()
    
    return {"message": "Reference picture updated successfully"}

