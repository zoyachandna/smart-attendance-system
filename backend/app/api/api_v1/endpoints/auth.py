from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import User, RoleEnum
from app.models.student_record import StudentRecord
from app.schemas.user import UserCreate, UserResponse, Token
from app.core import security
from datetime import timedelta
from app.core.config import settings
from app.api import deps

import re

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    """
    Register a new user.
    """
    # Clean email
    clean_email = user_in.email.strip().lower()
    user_in.email = clean_email
    
    # Check if a user with this email already exists
    user = await User.find_one({"email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}})
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    
    # Hash the password before saving
    hashed_password = security.get_password_hash(user_in.password)
    
    student_record = None
    if user_in.role == RoleEnum.STUDENT:
        if not user_in.student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student ID is required for registration.",
            )
        student_record = await StudentRecord.find_one({"student_id": user_in.student_id})
        if not student_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student ID not found in administrative records. Please contact your administrator.",
            )
        if student_record.is_registered:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This Student ID has already been registered.",
            )
            
    # Create the new user document
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role=user_in.role,
        parent_email=user_in.parent_email,
        reference_image_base64=user_in.reference_image_base64,
        student_id=user_in.student_id
    )
    
    # Copy academic details if student
    if student_record:
        new_user.roll_number = student_record.roll_number
        new_user.department = student_record.department
        new_user.course = student_record.course
        new_user.branch = student_record.branch
        new_user.semester = student_record.semester
        new_user.section = student_record.section
        new_user.academic_year = student_record.academic_year
        
        # Mark student record as registered
        student_record.is_registered = True
        await student_record.save()

    
    await new_user.insert()
    
    # Return response adhering to UserResponse schema
    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        role=new_user.role,
        student_id=new_user.student_id
    )

@router.post("/login", response_model=Token)
async def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    clean_username = form_data.username.strip()
    user = await User.find_one({"email": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}})
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(deps.get_current_user)):
    """
    Get current user details using the provided JWT token.
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        phone_number=current_user.phone_number,
        department=current_user.department,
        student_id=current_user.student_id,
        roll_number=current_user.roll_number,
        semester=current_user.semester,
        section=current_user.section,
        academic_year=current_user.academic_year,
        employee_id=current_user.employee_id,
        designation=current_user.designation,
        subjects_taught=current_user.subjects_taught
    )
