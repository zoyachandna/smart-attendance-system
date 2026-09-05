from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import csv
import io
from app.models.user import User, RoleEnum
from app.models.student_record import StudentRecord
from app.models.classroom import ClassRoom
from app.models.attendance_record import AttendanceRecord
from app.api import deps

router = APIRouter()

@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(deps.get_current_user)):
    """
    Get overview statistics for the Admin Dashboard.
    """
    if not current_user.is_admin():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    total_students = await StudentRecord.find_all().count()
    total_teachers = await User.find(User.role == RoleEnum.TEACHER).count()
    total_classes = await ClassRoom.find_all().count()
    
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_classes": total_classes
    }

@router.get("/export/attendance")
async def export_attendance(current_user: User = Depends(deps.get_current_active_admin)):
    """
    Export all attendance records as a summary CSV file.
    """
    from app.models.session import Session
    from app.models.attendance_record import AttendanceRecord, AttendanceStatusEnum
    
    classes = await ClassRoom.find_all(fetch_links=True).to_list()
    all_sessions = await Session.find_all(fetch_links=True).to_list()
    all_records = await AttendanceRecord.find_all(fetch_links=True).to_list()
    all_users = await User.find(User.role == RoleEnum.STUDENT).to_list()
    
    # Map user id to student id
    user_id_to_student_id = {str(u.id): u.student_id for u in all_users if u.student_id}
    
    # Map class_id to total sessions
    class_total_sessions = {}
    for s in all_sessions:
        c_id = str(s.class_room.id) if s.class_room else None
        if c_id:
            class_total_sessions[c_id] = class_total_sessions.get(c_id, 0) + 1
            
    # Count attendance per student per class
    # structure: student_id -> class_id -> attended_count
    attendance_counts = {}
    for r in all_records:
        if r.student and r.status == AttendanceStatusEnum.PRESENT:
            s_id = str(r.student.id)
            c_id = str(r.class_room.id) if r.class_room else None
            if s_id and c_id:
                student_id = user_id_to_student_id.get(s_id)
                if student_id:
                    if student_id not in attendance_counts:
                        attendance_counts[student_id] = {}
                    attendance_counts[student_id][c_id] = attendance_counts[student_id].get(c_id, 0) + 1

    stream = io.StringIO()
    writer = csv.writer(stream)
    
    writer.writerow([
        "Class Name", 
        "Student ID", 
        "Student Name", 
        "Course",
        "Branch",
        "Section",
        "Sessions Attended", 
        "Total Sessions", 
        "Attendance (%)"
    ])
    
    students = await StudentRecord.find_all().to_list()
    
    # Map class cohort to a list of classes
    cohort_to_classes = {}
    for c in classes:
        cohort_key = (c.course, c.branch, c.section)
        if cohort_key not in cohort_to_classes:
            cohort_to_classes[cohort_key] = []
        cohort_to_classes[cohort_key].append(c)
        
    for student in students:
        cohort_key = (student.course, student.branch, student.section)
        matched_classes = cohort_to_classes.get(cohort_key, [])
        
        if not matched_classes:
            writer.writerow([
                "N/A",
                student.student_id,
                student.full_name,
                student.course,
                student.branch,
                student.section,
                0,
                0,
                "0%"
            ])
        else:
            for c in matched_classes:
                c_id = str(c.id)
                total_sessions = class_total_sessions.get(c_id, 0)
                attended = 0
                if student.student_id in attendance_counts:
                    attended = attendance_counts[student.student_id].get(c_id, 0)
                    
                percentage = round((attended / total_sessions * 100), 2) if total_sessions > 0 else 0
                
                writer.writerow([
                    c.name,
                    student.student_id,
                    student.full_name,
                    student.course,
                    student.branch,
                    student.section,
                    attended,
                    total_sessions,
                    f"{percentage}%"
                ])
            
    stream.seek(0)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=attendance_summary.csv"
    return response
