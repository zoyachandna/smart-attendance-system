from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.session import Session, SessionStatusEnum
from app.models.classroom import ClassRoom
from app.models.user import User
from app.schemas.session import SessionCreate, SessionResponse, CheckInRequest
from app.api import deps
from beanie import PydanticObjectId
from app.models.attendance_record import AttendanceRecord, AttendanceStatusEnum, CheckInMethodEnum
from app.core.vision import verify_face_from_base64
from app.core.geo import is_within_radius
from datetime import datetime, timedelta
import random
import string

router = APIRouter()

@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_in: SessionCreate,
    current_user: User = Depends(deps.get_current_user)
):
    if not current_user.is_teacher():
        raise HTTPException(status_code=403, detail="Only teachers can start a session")
        
    classroom = await ClassRoom.get(PydanticObjectId(session_in.class_room_id))
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
        
    start_time = datetime.utcnow()
    end_time = start_time + timedelta(minutes=60)
    
    # Generate 6-char code
    session_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    expires_at = start_time + timedelta(minutes=session_in.attendance_window_minutes)
        
    new_session = Session(
        class_room=classroom,
        teacher=current_user,
        start_time=start_time,
        end_time=end_time,
        status=SessionStatusEnum.IN_PROGRESS,
        session_code=session_code,
        attendance_window_minutes=session_in.attendance_window_minutes,
        expires_at=expires_at,
        latitude=session_in.latitude,
        longitude=session_in.longitude,
        allowed_radius_meters=session_in.allowed_radius_meters
    )
    await new_session.insert()
    
    return SessionResponse(
        id=str(new_session.id),
        class_room_id=str(classroom.id),
        teacher_id=str(current_user.id),
        start_time=new_session.start_time,
        end_time=new_session.end_time,
        status=new_session.status,
        session_code=new_session.session_code,
        expires_at=new_session.expires_at,
        attendance_window_minutes=new_session.attendance_window_minutes
    )

@router.get("/", response_model=List[SessionResponse])
async def get_sessions(current_user: User = Depends(deps.get_current_user)):
    sessions = await Session.find_all(fetch_links=True).to_list()
        
    result = []
    for s in sessions:
        result.append(SessionResponse(
            id=str(s.id),
            class_room_id=str(s.class_room.id) if s.class_room else "",
            teacher_id=str(s.teacher.id) if s.teacher else "",
            start_time=s.start_time,
            end_time=s.end_time,
            status=s.status
        ))
    return result

@router.post("/code/{session_code}/checkin", status_code=status.HTTP_200_OK)
async def checkin_session(
    session_code: str,
    checkin_data: CheckInRequest,
    current_user: User = Depends(deps.get_current_user)
):
    if not current_user.is_student():
        raise HTTPException(status_code=403, detail="Only students can check in")
        
    session = await Session.find_one(Session.session_code == session_code, fetch_links=True)
    if not session:
        raise HTTPException(status_code=404, detail="Invalid Session Code")
        
    if session.status != SessionStatusEnum.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Session is not currently active")
        
    if session.expires_at and datetime.utcnow() > session.expires_at:
        raise HTTPException(status_code=400, detail="The attendance window has closed. Session code expired.")
        
    classroom = session.class_room
    
    # Use session location if available, fallback to classroom location
    target_lat = session.latitude if session.latitude is not None else classroom.latitude
    target_lon = session.longitude if session.longitude is not None else classroom.longitude
    radius = session.allowed_radius_meters if session.allowed_radius_meters else classroom.allowed_radius_meters

    if target_lat is None or target_lon is None:
        # If no location is set on session or classroom, skip geo check or allow it
        is_valid_geo = True
        distance = 0.0
    else:
        # Check Geolocation
        is_valid_geo, distance = is_within_radius(
            user_lat=checkin_data.latitude, 
            user_lon=checkin_data.longitude,
            class_lat=target_lat,
            class_lon=target_lon,
            radius_meters=radius
        )
        if not is_valid_geo:
            raise HTTPException(
                status_code=400, 
                detail=f"You are not physically in the classroom bounds. You are {distance:.2f} meters away (Allowed: {radius}m)."
            )
        
    # Check Face
    if not current_user.reference_image_base64:
        raise HTTPException(status_code=400, detail="You do not have a reference photo configured. Please update your profile.")
        
    import asyncio
    is_match, face_error = await asyncio.to_thread(
        verify_face_from_base64,
        current_user.reference_image_base64,
        checkin_data.image_base64
    )
    
    if not is_match:
        raise HTTPException(status_code=401, detail=f"Facial recognition failed: {face_error}")
        
    # Mark Attendance
    record = await AttendanceRecord.find_one(
        AttendanceRecord.session.id == session.id,
        AttendanceRecord.student.id == current_user.id
    )
    
    if record:
        record.status = AttendanceStatusEnum.PRESENT
        record.check_in_time = datetime.utcnow()
        record.check_in_method = CheckInMethodEnum.FACE_RECOGNITION
        record.distance_from_classroom_meters = distance
        await record.save()
    else:
        new_record = AttendanceRecord(
            session=session,
            student=current_user,
            class_room=session.class_room,
            status=AttendanceStatusEnum.PRESENT,
            check_in_time=datetime.utcnow(),
            check_in_method=CheckInMethodEnum.FACE_RECOGNITION,
            distance_from_classroom_meters=distance
        )
        await new_record.insert()
        
    return {"message": "Check-in successful!"}

@router.get("/{session_id}/attendance")
async def get_session_attendance(
    session_id: str,
    current_user: User = Depends(deps.get_current_user)
):
    try:
        obj_id = PydanticObjectId(session_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID format")
        
    session = await Session.get(obj_id, fetch_links=True)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    classroom = session.class_room
    # Fetch all records for this session
    records = await AttendanceRecord.find(AttendanceRecord.session.id == session.id, fetch_links=True).to_list()
    
    # Create a map of student ID to record
    record_map = {str(r.student.id): r for r in records if r.student}
    
    # Build detailed list for all enrolled students
    from app.models.student_record import StudentRecord
    students = await StudentRecord.find(
        StudentRecord.course == classroom.course,
        StudentRecord.branch == classroom.branch,
        StudentRecord.section == classroom.section
    ).to_list()
    
    details = []
    for student in students:
        s_id = student.student_id
        if s_id in record_map:
            r = record_map[s_id]
            details.append({
                "student_id": s_id,
                "first_name": student.full_name.split()[0],
                "last_name": student.full_name.split()[1] if len(student.full_name.split()) > 1 else "",
                "email": r.student.email if r.student else "",
                "status": r.status,
                "check_in_time": r.check_in_time.isoformat() if r.check_in_time else None,
                "method": r.check_in_method
            })
        else:
            details.append({
                "student_id": s_id,
                "first_name": student.full_name.split()[0],
                "last_name": student.full_name.split()[1] if len(student.full_name.split()) > 1 else "",
                "email": "",
                "status": "Absent",
                "check_in_time": None,
                "method": None
            })
            
    return details
