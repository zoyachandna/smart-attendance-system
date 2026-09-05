from typing import List, Optional
from beanie import Document, Link
from pydantic import Field
from app.models.user import User

class ClassRoom(Document):
    """
    Represents a Class or Course in the system (e.g., 'CS101 - Introduction to Programming').
    Typically created by an Admin who assigns a Teacher to it.
    """
    name: str = Field(..., description="Name of the class/course (e.g. Computer Networks)")
    subject: str = Field(..., description="Subject being taught")
    course: str = Field(..., description="Course name (e.g. B.Tech)")
    branch: str = Field(..., description="Branch name (e.g. IT)")
    section: str = Field(..., description="Section of the class (e.g. A)")
    room_number: Optional[str] = Field(None, description="Physical room number (e.g. 101, Lab-3)")
    description: Optional[str] = None
    
    # Required field for total expected students
    total_students_count: int
    
    # Optional display name for the teacher (e.g. "Prof. Smith")
    teacher_display_name: Optional[str] = None
    
    # The teacher assigned to this class by the Admin
    teacher: Link[User]
    
    # Geolocation for physical classroom boundary check-ins
    # These represent the exact coordinates of the classroom
    latitude: Optional[float] = Field(None, description="Latitude of the physical classroom")
    longitude: Optional[float] = Field(None, description="Longitude of the physical classroom")
    allowed_radius_meters: float = Field(50.0, description="Allowed radius in meters for geolocation check-in")

    class Settings:
        name = "class_rooms"
