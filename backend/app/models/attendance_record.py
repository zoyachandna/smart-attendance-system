from enum import Enum
from datetime import datetime
from typing import Optional
from beanie import Document, Link
from pydantic import Field
from app.models.user import User
from app.models.session import Session
from app.models.classroom import ClassRoom

class AttendanceStatusEnum(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LATE = "Late"
    EXCUSED = "Excused"  # Used when a LeaveRequest is approved

class CheckInMethodEnum(str, Enum):
    MANUAL = "Manual"
    QR_CODE = "QR Code"
    FACE_RECOGNITION = "Face Recognition"

class AttendanceRecord(Document):
    """
    Records a student's attendance for a specific session of a class.
    """
    student: Link[User]
    session: Link[Session]
    class_room: Link[ClassRoom]
    
    status: AttendanceStatusEnum = AttendanceStatusEnum.ABSENT
    
    # The time the student successfully checked in
    check_in_time: Optional[datetime] = None
    
    # How the student checked in
    check_in_method: Optional[CheckInMethodEnum] = None

    # If Geolocation was used, record the distance from the classroom in meters
    distance_from_classroom_meters: Optional[float] = None

    class Settings:
        name = "attendance_records"
