from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import RoleEnum

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: RoleEnum
    parent_email: Optional[EmailStr] = None
    reference_image_base64: Optional[str] = None
    student_id: Optional[str] = None

class UserUpdateProfile(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    department: Optional[str] = None
    # Editable by teachers
    designation: Optional[str] = None
    subjects_taught: Optional[str] = None

class UserUpdatePassword(BaseModel):
    current_password: str
    new_password: str

class UserUpdateReference(BaseModel):
    reference_image_base64: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: RoleEnum
    phone_number: Optional[str] = None
    department: Optional[str] = None
    student_id: Optional[str] = None
    roll_number: Optional[str] = None
    semester: Optional[str] = None
    section: Optional[str] = None
    academic_year: Optional[str] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    subjects_taught: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
