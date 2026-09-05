from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.models.user import User, RoleEnum
from app.api import deps
from app.core import security
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter()

class TeacherCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    employee_id: str
    department: str
    subjects_taught: str

class TeacherUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    subjects_taught: Optional[str] = None

@router.get("/")
async def get_all_teachers(current_user: User = Depends(deps.get_current_user)):
    """
    Get all teachers.
    """
    if not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    teachers = await User.find(User.role == RoleEnum.TEACHER).to_list()
    
    return [{
        "id": str(t.id),
        "first_name": t.first_name,
        "last_name": t.last_name,
        "email": t.email,
        "employee_id": t.employee_id,
        "department": t.department,
        "subjects_taught": t.subjects_taught,
        "phone_number": t.phone_number
    } for t in teachers]

@router.post("/")
async def add_teacher(
    teacher_in: TeacherCreate,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Admin explicitly creates a teacher account.
    """
    if not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    clean_email = teacher_in.email.strip().lower()
    
    existing = await User.find_one({"email": clean_email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    # Default password as requested
    hashed_password = security.get_password_hash("Welcome@123")
    
    new_teacher = User(
        email=clean_email,
        hashed_password=hashed_password,
        first_name=teacher_in.first_name,
        last_name=teacher_in.last_name,
        role=RoleEnum.TEACHER,
        employee_id=teacher_in.employee_id,
        department=teacher_in.department,
        subjects_taught=teacher_in.subjects_taught
    )
    
    await new_teacher.insert()
    return {"message": "Teacher created successfully. Default password is 'Welcome@123'"}

@router.put("/{teacher_id}")
async def update_teacher(
    teacher_id: str,
    teacher_in: TeacherUpdate,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update teacher details.
    """
    if not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    from beanie import PydanticObjectId
    try:
        obj_id = PydanticObjectId(teacher_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid teacher ID")
        
    teacher = await User.get(obj_id)
    if not teacher or teacher.role != RoleEnum.TEACHER:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    update_data = teacher_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(teacher, k, v)
        
    await teacher.save()
    return {"message": "Teacher updated successfully"}

@router.delete("/{teacher_id}")
async def delete_teacher(
    teacher_id: str,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Delete a teacher account.
    """
    if not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    from beanie import PydanticObjectId
    try:
        obj_id = PydanticObjectId(teacher_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid teacher ID")
        
    teacher = await User.get(obj_id)
    if not teacher or teacher.role != RoleEnum.TEACHER:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    await teacher.delete()
    return {"message": "Teacher deleted successfully"}
