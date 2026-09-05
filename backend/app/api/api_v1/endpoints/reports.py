from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import io
import csv
from app.models.user import User
from app.models.attendance_record import AttendanceRecord
from app.api import deps

router = APIRouter()

@router.get("/attendance", response_class=StreamingResponse)
async def export_attendance_csv(
    current_user: User = Depends(deps.get_current_active_admin)
):
    """
    Export attendance records as a CSV file. Admin only.
    """
    # Fetch all records. In a real scenario, you'd add query parameters for date filtering.
    records = await AttendanceRecord.find_all(fetch_links=True).to_list()
    
    # Create an in-memory string buffer for the CSV
    stream = io.StringIO()
    csv_writer = csv.writer(stream)
    
    # Write header
    csv_writer.writerow(["Record ID", "Student Email", "Session ID", "ClassRoom Name", "Status", "Check-in Method", "Check-in Time", "Distance (m)"])
    
    # Write rows
    for r in records:
        student_email = r.student.email if r.student else "Unknown"
        session_id = str(r.session.id) if r.session else "Unknown"
        classroom_name = r.class_room.name if r.class_room else "Unknown"
        
        csv_writer.writerow([
            str(r.id),
            student_email,
            session_id,
            classroom_name,
            r.status.value,
            r.check_in_method.value if r.check_in_method else "N/A",
            r.check_in_time.isoformat() if r.check_in_time else "N/A",
            r.distance_from_classroom_meters if r.distance_from_classroom_meters is not None else "N/A"
        ])
        
    # Reset stream position to beginning
    stream.seek(0)
    
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=attendance_report.csv"
    return response
