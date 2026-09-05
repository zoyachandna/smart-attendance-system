from enum import Enum
from typing import Optional, List
from pydantic import EmailStr, Field
from beanie import Document, Indexed

class RoleEnum(str, Enum):
    """Enumeration for user roles to ensure data integrity."""
    ADMIN = "Admin"
    TEACHER = "Teacher"
    STUDENT = "Student"

class User(Document):
    """
    User model representing Admins, Teachers, and Students.
    Inherits from Beanie's Document for MongoDB interaction.
    """
    email: Indexed(EmailStr, unique=True) # Ensure emails are unique and indexed
    hashed_password: str
    first_name: str
    last_name: str
    role: RoleEnum
    
    # Shared profile fields
    phone_number: Optional[str] = None
    department: Optional[str] = None

    # Optional fields specific to Students
    parent_email: Optional[EmailStr] = None
    student_id: Optional[str] = None
    roll_number: Optional[str] = None
    course: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[str] = None
    section: Optional[str] = None
    academic_year: Optional[str] = None
    
    # Optional fields specific to Teachers
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    subjects_taught: Optional[str] = None
    
    # Store face encodings directly here.
    # Representing the 128-d or 512-d embeddings from OpenCV/dlib/face_recognition
    # as a list of floats. We might store multiple encodings per student for accuracy.
    face_encodings: Optional[List[List[float]]] = None
    
    # Raw reference image for OpenCV/DeepFace verification
    reference_image_base64: Optional[str] = None

    class Settings:
        name = "users" # MongoDB collection name

    def is_student(self) -> bool:
        return self.role == RoleEnum.STUDENT

    def is_teacher(self) -> bool:
        return self.role == RoleEnum.TEACHER

    def is_admin(self) -> bool:
        return self.role == RoleEnum.ADMIN
