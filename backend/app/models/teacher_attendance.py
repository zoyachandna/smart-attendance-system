from enum import Enum
from datetime import date
from beanie import Document, Link
from app.models.user import User

class TeacherAttendanceStatus(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LEAVE = "Leave"

class TeacherAttendanceRecord(Document):
    """
    Daily attendance record for teachers, typically marked by the Admin.
    """
    teacher: Link[User]
    marked_by_admin: Link[User]
    
    date: date
    status: TeacherAttendanceStatus

    class Settings:
        name = "teacher_attendance_records"
