from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from app.models.leave_request import LeaveStatusEnum

class LeaveRequestCreate(BaseModel):
    start_date: date
    end_date: date
    reason: str
    medical_certificate_url: Optional[str] = None

class LeaveRequestUpdate(BaseModel):
    status: LeaveStatusEnum

class LeaveRequestResponse(BaseModel):
    id: str
    user_id: str
    student_name: str
    student_id: str
    course: str
    branch: str
    section: str
    start_date: date
    end_date: date
    reason: str
    status: LeaveStatusEnum
    medical_certificate_url: Optional[str] = None
    reviewed_by_id: Optional[str] = None
