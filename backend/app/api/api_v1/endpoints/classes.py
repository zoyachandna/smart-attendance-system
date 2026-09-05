from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel
from app.models.classroom import ClassRoom
from app.models.user import User
from app.schemas.classroom import ClassRoomCreate, ClassRoomResponse, ClassRoomUpdate
from app.api import deps
from beanie import PydanticObjectId
from app.models.session import Session
from app.models.attendance_record import AttendanceRecord, AttendanceStatusEnum
from app.models.student_record import StudentRecord
from app.schemas.user import UserResponse

router = APIRouter()

@router.post("/", response_model=ClassRoomResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    class_in: ClassRoomCreate,
    current_user: User = Depends(deps.get_current_user)
):
    if not current_user.is_teacher() and not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Only teachers and admins can create classes")
        
    teacher_user = current_user
    if current_user.is_admin() and class_in.teacher_id:
        try:
            t_obj_id = PydanticObjectId(class_in.teacher_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid teacher ID")
        teacher_user = await User.get(t_obj_id)
        if not teacher_user or not teacher_user.is_teacher():
            raise HTTPException(status_code=404, detail="Assigned teacher not found")
        
    new_class = ClassRoom(
        name=class_in.name,
        subject=class_in.subject,
        course=class_in.course,
        branch=class_in.branch,
        section=class_in.section,
        room_number=class_in.room_number,
        description=class_in.description,
        teacher=teacher_user,
        latitude=class_in.latitude,
        longitude=class_in.longitude,
        allowed_radius_meters=class_in.allowed_radius_meters,
        total_students_count=class_in.total_students_count,
        teacher_display_name=class_in.teacher_display_name
    )
    await new_class.insert()
    
    return ClassRoomResponse(
        id=str(new_class.id),
        name=new_class.name,
        subject=new_class.subject,
        course=new_class.course,
        branch=new_class.branch,
        section=new_class.section,
        room_number=new_class.room_number,
        description=new_class.description,
        teacher_id=str(teacher_user.id),
        latitude=new_class.latitude,
        longitude=new_class.longitude,
        allowed_radius_meters=new_class.allowed_radius_meters,
        total_students_count=new_class.total_students_count,
        teacher_display_name=new_class.teacher_display_name
    )

@router.get("/", response_model=List[ClassRoomResponse])
async def get_classes(current_user: User = Depends(deps.get_current_user)):
    if current_user.is_teacher():
        classes = await ClassRoom.find(ClassRoom.teacher.id == current_user.id, fetch_links=True).to_list()
    elif current_user.is_admin():
        classes = await ClassRoom.find_all(fetch_links=True).to_list()
    else:
        # For students, return only classes matching their cohort
        all_classes = await ClassRoom.find_all(fetch_links=True).to_list()
        classes = []
        for c in all_classes:
            if (c.course == current_user.course and 
                c.branch == current_user.branch and 
                c.section == current_user.section):
                classes.append(c)
                    
    result = []
    for c in classes:
        # Get latest session for stats
        latest_session = await Session.find(Session.class_room.id == c.id).sort("-start_time").first_or_none()
        latest_date = None
        latest_present = None
        
        total_enrolled = await User.find(
            User.role == "Student",
            User.course == c.course,
            User.branch == c.branch,
            User.section == c.section
        ).count()
        
        if latest_session:
            latest_date = latest_session.start_time.isoformat() if latest_session.start_time else None
            records = await AttendanceRecord.find(AttendanceRecord.session.id == latest_session.id).to_list()
            latest_present = sum(1 for r in records if r.status == AttendanceStatusEnum.PRESENT)
            
        result.append(ClassRoomResponse(
            id=str(c.id),
            name=c.name,
            subject=c.subject,
            course=c.course,
            branch=c.branch,
            section=c.section,
            room_number=c.room_number,
            description=c.description,
            teacher_id=str(c.teacher.id) if c.teacher else "",
            latitude=c.latitude,
            longitude=c.longitude,
            allowed_radius_meters=c.allowed_radius_meters,
            total_students_count=c.total_students_count,
            teacher_display_name=c.teacher_display_name,
            total_enrolled=total_enrolled,
            latest_session_date=latest_date,
            latest_session_present=latest_present
        ))
    return result


@router.get("/{class_id}", response_model=ClassRoomResponse)
async def get_class_detail(class_id: str, current_user: User = Depends(deps.get_current_user)):
    try:
        obj_id = PydanticObjectId(class_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid class ID")
        
    classroom = await ClassRoom.get(obj_id, fetch_links=True)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
        
    total_enrolled = await User.find(
        User.role == "Student",
        User.course == classroom.course,
        User.branch == classroom.branch,
        User.section == classroom.section
    ).count()

    return ClassRoomResponse(
        id=str(classroom.id),
        name=classroom.name,
        subject=classroom.subject,
        course=classroom.course,
        branch=classroom.branch,
        section=classroom.section,
        room_number=classroom.room_number,
        description=classroom.description,
        teacher_id=str(classroom.teacher.id) if classroom.teacher else "",
        latitude=classroom.latitude,
        longitude=classroom.longitude,
        allowed_radius_meters=classroom.allowed_radius_meters,
        total_students_count=classroom.total_students_count,
        teacher_display_name=classroom.teacher_display_name,
        total_enrolled=total_enrolled
    )

@router.put("/{class_id}", response_model=ClassRoomResponse)
async def update_class(
    class_id: str,
    class_in: ClassRoomUpdate,
    current_user: User = Depends(deps.get_current_user)
):
    try:
        obj_id = PydanticObjectId(class_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid class ID")
        
    classroom = await ClassRoom.get(obj_id, fetch_links=True)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
        
    if current_user.is_teacher() and classroom.teacher.id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this class")
        
    update_data = class_in.model_dump(exclude_unset=True)
    
    if "teacher_id" in update_data and current_user.is_admin():
        tid = update_data.pop("teacher_id")
        if tid:
            try:
                t_obj_id = PydanticObjectId(tid)
            except:
                raise HTTPException(status_code=400, detail="Invalid teacher ID")
            t_user = await User.get(t_obj_id)
            if not t_user or not t_user.is_teacher():
                raise HTTPException(status_code=404, detail="Assigned teacher not found")
            classroom.teacher = t_user
            
    for key, value in update_data.items():
        setattr(classroom, key, value)
        
    await classroom.save()
    
    total_enrolled = await User.find(
        User.role == "Student",
        User.course == classroom.course,
        User.branch == classroom.branch,
        User.section == classroom.section
    ).count()
    
    return ClassRoomResponse(
        id=str(classroom.id),
        name=classroom.name,
        subject=classroom.subject,
        course=classroom.course,
        branch=classroom.branch,
        section=classroom.section,
        room_number=classroom.room_number,
        description=classroom.description,
        teacher_id=str(classroom.teacher.id) if classroom.teacher else "",
        latitude=classroom.latitude,
        longitude=classroom.longitude,
        allowed_radius_meters=classroom.allowed_radius_meters,
        total_students_count=classroom.total_students_count,
        teacher_display_name=classroom.teacher_display_name,
        total_enrolled=total_enrolled
    )

@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(class_id: str, current_user: User = Depends(deps.get_current_user)):
    try:
        obj_id = PydanticObjectId(class_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid class ID")
        
    classroom = await ClassRoom.get(obj_id, fetch_links=True)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
        
    if current_user.is_teacher() and classroom.teacher.id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this class")
        
    # Cascading delete
    sessions = await Session.find(Session.class_room.id == classroom.id).to_list()
    for session in sessions:
        await AttendanceRecord.find(AttendanceRecord.session.id == session.id).delete()
        await session.delete()
        
    await classroom.delete()
    return

@router.get("/{class_id}/roster")
async def get_class_roster(class_id: str, current_user: User = Depends(deps.get_current_user)):
    from app.models.leave_request import LeaveRequest, LeaveStatusEnum
    from datetime import date
    
    try:
        obj_id = PydanticObjectId(class_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid class ID")
        
    classroom = await ClassRoom.get(obj_id, fetch_links=True)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
        
    students = await StudentRecord.find(
        StudentRecord.course == classroom.course,
        StudentRecord.branch == classroom.branch,
        StudentRecord.section == classroom.section
    ).to_list()
    
    # Check for approved leaves today
    today = date.today()
    approved_leaves = await LeaveRequest.find(
        LeaveRequest.status == LeaveStatusEnum.APPROVED,
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= today,
        fetch_links=True
    ).to_list()
    
    on_leave_student_ids = set()
    for l in approved_leaves:
        if l.user and l.user.student_id:
            on_leave_student_ids.add(l.user.student_id)
    
    return [
        {
            "id": str(s.id),
            "email": s.student_id + "@clg.edu",
            "first_name": s.full_name.split()[0],
            "last_name": s.full_name.split()[1] if len(s.full_name.split()) > 1 else "",
            "role": "Student",
            "student_id": s.student_id,
            "roll_number": s.roll_number,
            "is_on_leave_today": s.student_id in on_leave_student_ids
        } for s in students
    ]

@router.get("/{class_id}/sessions")
async def get_class_sessions(class_id: str, current_user: User = Depends(deps.get_current_user)):
    try:
        obj_id = PydanticObjectId(class_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid class ID")
        
    classroom = await ClassRoom.get(obj_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
        
    sessions = await Session.find(Session.class_room.id == obj_id, fetch_links=True).sort("-start_time").to_list()
    
    result = []
    for s in sessions:
        records = await AttendanceRecord.find(AttendanceRecord.session.id == s.id).to_list()
        present = sum(1 for r in records if r.status == AttendanceStatusEnum.PRESENT)
        
        result.append({
            "id": str(s.id),
            "start_time": s.start_time.isoformat() if s.start_time else None,
            "end_time": s.end_time.isoformat() if s.end_time else None,
            "status": s.status,
            "present_count": present,
            "absent_count": classroom.total_students_count - present
        })
        
    return result

@router.get("/{class_id}/student-attendance")
async def get_student_class_attendance(class_id: str, current_user: User = Depends(deps.get_current_user)):
    if not current_user.is_student():
        raise HTTPException(status_code=403, detail="Only students can view their detailed class attendance")
        
    try:
        obj_id = PydanticObjectId(class_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid class ID")
        
    classroom = await ClassRoom.get(obj_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
        
    sessions = await Session.find(Session.class_room.id == obj_id, fetch_links=True).sort("-start_time").to_list()
    
    attended_count = 0
    sessions_history = []
    
    for s in sessions:
        record = await AttendanceRecord.find_one(
            AttendanceRecord.session.id == s.id,
            AttendanceRecord.student.id == current_user.id
        )
        status_str = record.status if record else "Absent"
        if status_str == AttendanceStatusEnum.PRESENT:
            attended_count += 1
            
        sessions_history.append({
            "session_id": str(s.id),
            "date": s.start_time.isoformat() if s.start_time else None,
            "status": status_str
        })
        
    return {
        "total_sessions": len(sessions),
        "attended_sessions": attended_count,
        "history": sessions_history
    }
