from pydantic import BaseModel, Field
from typing import Optional, List

class ClassRoomCreate(BaseModel):
    name: str
    subject: str
    course: str
    branch: str
    section: str
    room_number: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    allowed_radius_meters: float = 50.0
    total_students_count: int
    teacher_id: Optional[str] = None
    teacher_display_name: Optional[str] = None

class ClassRoomUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    course: Optional[str] = None
    branch: Optional[str] = None
    section: Optional[str] = None
    room_number: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    allowed_radius_meters: Optional[float] = None
    total_students_count: Optional[int] = None
    teacher_id: Optional[str] = None
    teacher_display_name: Optional[str] = None

class ClassRoomResponse(BaseModel):
    id: str
    name: str
    subject: str
    course: str
    branch: str
    section: str
    room_number: Optional[str] = None
    description: Optional[str] = None
    teacher_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    allowed_radius_meters: float
    total_students_count: int
    teacher_display_name: Optional[str] = None
    
    # Aggregated Stats
    total_enrolled: Optional[int] = None
    latest_session_date: Optional[str] = None
    latest_session_present: Optional[int] = None
    
    class Config:
        from_attributes = True
