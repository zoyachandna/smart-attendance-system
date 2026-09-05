from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, leaves, reports, classes, sessions, users, admin_students, admin, admin_teachers

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(leaves.router, prefix="/leaves", tags=["leaves"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(admin_students.router, prefix="/admin/students", tags=["admin_students"])
api_router.include_router(admin_teachers.router, prefix="/admin/teachers", tags=["admin_teachers"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
