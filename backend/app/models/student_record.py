from typing import Optional
from beanie import Document, Indexed

class StudentRecord(Document):
    """
    Model for centrally managing pre-registered student academic records.
    Populated via Admin Bulk Import or Manual entry.
    """
    student_id: Indexed(str, unique=True)
    full_name: str
    roll_number: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[str] = None
    section: Optional[str] = None
    academic_year: Optional[str] = None
    
    is_registered: bool = False

    class Settings:
        name = "student_records"
