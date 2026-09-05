from enum import Enum
from datetime import date
from typing import Optional
from beanie import Document, Link
from app.models.user import User

class LeaveStatusEnum(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class LeaveRequest(Document):
    """
    Leave Request model for students or teachers applying for leave.
    """
    # Link to the user requesting the leave
    user: Link[User]
    
    start_date: date
    end_date: date
    reason: str
    status: LeaveStatusEnum = LeaveStatusEnum.PENDING
    
    # Optional URL to an uploaded medical certificate/proof (e.g., S3 or Cloudinary URL)
    medical_certificate_url: Optional[str] = None
    
    # Reviewer could be a Teacher or Admin
    reviewed_by: Optional[Link[User]] = None

    class Settings:
        name = "leave_requests"
