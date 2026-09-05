from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.session import SessionStatusEnum

class SessionCreate(BaseModel):
    class_room_id: str
    attendance_window_minutes: int = 5
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    allowed_radius_meters: float = 50.0

class CheckInRequest(BaseModel):
    image_base64: str
    latitude: float
    longitude: float

class SessionResponse(BaseModel):
    id: str
    class_room_id: str
    teacher_id: str
    start_time: datetime
    end_time: datetime
    status: SessionStatusEnum
    session_code: Optional[str] = None
    expires_at: Optional[datetime] = None
    attendance_window_minutes: Optional[int] = None
    
    class Config:
        from_attributes = True
