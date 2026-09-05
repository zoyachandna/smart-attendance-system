from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

# Import models here to initialize Beanie
from app.models.user import User
from app.models.leave_request import LeaveRequest
from app.models.session import Session
from app.models.teacher_attendance import TeacherAttendanceRecord
from app.models.classroom import ClassRoom
from app.models.attendance_record import AttendanceRecord
from app.models.student_record import StudentRecord

async def init_db():
    """
    Initialize the MongoDB connection and Beanie ODM.
    This registers all the models with the database.
    """
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.DATABASE_NAME]
    
    await init_beanie(
        database=database,
        document_models=[
            User,
            LeaveRequest,
            Session,
            TeacherAttendanceRecord,
            ClassRoom,
            AttendanceRecord,
            StudentRecord
        ]
    )
