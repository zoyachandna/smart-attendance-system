import pytest
import asyncio
from unittest.mock import patch
from fastapi.testclient import TestClient
from beanie import init_beanie
from mongomock_motor import AsyncMongoMockClient

from app.models.user import User
from app.models.leave_request import LeaveRequest
from app.models.session import Session
from app.models.timetable import TimetableEntry
from app.models.teacher_attendance import TeacherAttendanceRecord
from app.models.classroom import ClassRoom
from app.models.attendance_record import AttendanceRecord

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(autouse=True, scope="session")
async def mock_init_db():
    """
    Initialize a mocked MongoDB database using mongomock_motor and Beanie.
    """
    client = AsyncMongoMockClient()
    database = client.get_database("test_db")
    await init_beanie(
        database=database,
        document_models=[
            User, LeaveRequest, Session, TimetableEntry, 
            TeacherAttendanceRecord, ClassRoom, AttendanceRecord
        ]
    )
    
    # Patch the real init_db so the app doesn't try to connect to localhost during testing
    with patch("app.main.init_db", return_value=None):
        yield

@pytest.fixture()
def client():
    """
    Returns a TestClient instance for the FastAPI application.
    """
    from app.main import app
    with TestClient(app) as test_client:
        yield test_client
