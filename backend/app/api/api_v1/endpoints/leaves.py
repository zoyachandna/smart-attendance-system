from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId
from app.models.user import User
from app.models.leave_request import LeaveRequest, LeaveStatusEnum
from app.schemas.leave_request import LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse
from app.api import deps

router = APIRouter()

@router.post("/", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_leave_request(
    leave_in: LeaveRequestCreate,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Create a new leave request. Usually done by a Student.
    """
    if leave_in.end_date < leave_in.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")
        
    new_leave = LeaveRequest(
        user=current_user,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        reason=leave_in.reason,
        medical_certificate_url=leave_in.medical_certificate_url
    )
    await new_leave.insert()
    
    return LeaveRequestResponse(
        id=str(new_leave.id),
        user_id=str(current_user.id),
        student_name=f"{current_user.first_name} {current_user.last_name}",
        student_id=current_user.student_id or "",
        course=current_user.course or "",
        branch=current_user.branch or "",
        section=current_user.section or "",
        start_date=new_leave.start_date,
        end_date=new_leave.end_date,
        reason=new_leave.reason,
        status=new_leave.status,
        medical_certificate_url=new_leave.medical_certificate_url
    )

@router.get("/", response_model=List[LeaveRequestResponse])
async def get_leave_requests(
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get leave requests.
    If Student: returns only their own leave requests.
    If Admin/Teacher: returns all pending leave requests (or all).
    """
    if current_user.is_student():
        # Requires fetch_links=True since `user` is a linked document
        leaves = await LeaveRequest.find(LeaveRequest.user.id == current_user.id, fetch_links=True).to_list()
    else:
        # Teacher or Admin sees all leaves (could be filtered by class in the future)
        leaves = await LeaveRequest.find_all(fetch_links=True).to_list()
        
    return [
        LeaveRequestResponse(
            id=str(l.id),
            user_id=str(l.user.id),
            student_name=f"{l.user.first_name} {l.user.last_name}",
            student_id=l.user.student_id or "",
            course=l.user.course or "",
            branch=l.user.branch or "",
            section=l.user.section or "",
            start_date=l.start_date,
            end_date=l.end_date,
            reason=l.reason,
            status=l.status,
            medical_certificate_url=l.medical_certificate_url,
            reviewed_by_id=str(l.reviewed_by.id) if l.reviewed_by else None
        ) for l in leaves
    ]

@router.put("/{leave_id}/status", response_model=LeaveRequestResponse)
async def update_leave_status(
    leave_id: str,
    status_update: LeaveRequestUpdate,
    current_user: User = Depends(deps.get_current_active_admin) # Only Admins can approve
):
    """
    Approve or reject a leave request.
    """
    try:
        obj_id = PydanticObjectId(leave_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid leave request ID format")

    leave = await LeaveRequest.get(obj_id, fetch_links=True)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    leave.status = status_update.status
    leave.reviewed_by = current_user
    await leave.save()
    
    # NOTE: In Phase 4, we would trigger the SendGrid email notification here.
    
    return LeaveRequestResponse(
        id=str(leave.id),
        user_id=str(leave.user.id),
        student_name=f"{leave.user.first_name} {leave.user.last_name}",
        student_id=leave.user.student_id or "",
        course=leave.user.course or "",
        branch=leave.user.branch or "",
        section=leave.user.section or "",
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status=leave.status,
        medical_certificate_url=leave.medical_certificate_url,
        reviewed_by_id=str(current_user.id)
    )
