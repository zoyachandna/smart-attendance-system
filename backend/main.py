from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.db.database import init_db
from app.api.api_v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database
    print(f"Starting {settings.PROJECT_NAME}...")
    await init_db()
    print("Database initialized successfully.")
    yield
    # Shutdown: Clean up resources if needed
    print("Shutting down...")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Class Attendance System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to the Class Attendance System API"}

@app.get("/debug_face")
async def debug_face():
    from app.core.vision import verify_face_from_base64
    dummy_b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    is_match, msg = verify_face_from_base64(dummy_b64, dummy_b64)
    return {"match": is_match, "msg": msg}

# Example of how to run the server:
# uvicorn main:app --reload
