import pytest
from app.models.user import User

def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Class Attendance System API"}

@pytest.mark.asyncio
async def test_register_user(client):
    payload = {
        "email": "student@example.com",
        "password": "strongpassword",
        "first_name": "Test",
        "last_name": "Student",
        "role": "Student"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    
    data = response.json()
    assert data["email"] == "student@example.com"
    assert "id" in data
    
    # Verify in DB
    user = await User.find_one(User.email == "student@example.com")
    assert user is not None
    assert user.first_name == "Test"

@pytest.mark.asyncio
async def test_login_user(client):
    # Register a teacher for login
    payload = {
        "email": "teacher@example.com",
        "password": "teacherpassword",
        "first_name": "Test",
        "last_name": "Teacher",
        "role": "Teacher"
    }
    client.post("/api/v1/auth/register", json=payload)
    
    # Now try to login
    login_data = {
        "username": "teacher@example.com",
        "password": "teacherpassword"
    }
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    # Test the /me endpoint with the token
    token = data["access_token"]
    me_response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "teacher@example.com"
