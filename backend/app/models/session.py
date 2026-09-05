from enum import Enum
from datetime import datetime
from typing import Optional
from beanie import Document, Link
from app.models.user import User
from app.models.classroom import ClassRoom

class SessionStatusEnum(str, Enum):
    SCHEDULED = "Scheduled"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class Session(Document):
    """
    Represents a single instance of a class happening on a specific day.
    """
    class_room: Link[ClassRoom]
    teacher: Link[User]
    
    start_time: datetime
    end_time: datetime
    
    status: SessionStatusEnum = SessionStatusEnum.SCHEDULED
    
    # The unique, short alphanumeric code for this session
    session_code: Optional[str] = None
    attendance_window_minutes: int = 5
    expires_at: Optional[datetime] = None
    
    # Geolocation captured when the teacher starts the session
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    allowed_radius_meters: float = 50.0

    class Settings:
        name = "sessions"
