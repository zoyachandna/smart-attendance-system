import pytest
from datetime import date, timedelta

@pytest.fixture
async def auth_student(client):
    """Register a student and return their token headers."""
    email = "leavestudent@example.com"
    client.post("/api/v1/auth/register", json={
        "email": email, "password": "pwd", "first_name": "L", "last_name": "S", "role": "Student"
    })
    res = client.post("/api/v1/auth/login", data={"username": email, "password": "pwd"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def auth_teacher(client):
    """Register a teacher and return their token headers."""
    email = "leaveteacher@example.com"
    client.post("/api/v1/auth/register", json={
        "email": email, "password": "pwd", "first_name": "L", "last_name": "T", "role": "Teacher"
    })
    res = client.post("/api/v1/auth/login", data={"username": email, "password": "pwd"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_create_leave_request(client, auth_student):
    headers = await auth_student
    payload = {
        "start_date": str(date.today()),
        "end_date": str(date.today() + timedelta(days=2)),
        "reason": "Sick leave"
    }
    
    response = client.post("/api/v1/leaves/", json=payload, headers=headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["reason"] == "Sick leave"
    assert data["status"] == "Pending"
    assert "id" in data

@pytest.mark.asyncio
async def test_teacher_approve_leave(client, auth_student, auth_teacher):
    student_headers = await auth_student
    teacher_headers = await auth_teacher
    
    # Student creates a leave
    payload = {
        "start_date": str(date.today()),
        "end_date": str(date.today() + timedelta(days=2)),
        "reason": "Family emergency"
    }
    create_res = client.post("/api/v1/leaves/", json=payload, headers=student_headers)
    leave_id = create_res.json()["id"]
    
    # Teacher approves it
    update_res = client.put(
        f"/api/v1/leaves/{leave_id}/status",
        json={"status": "Approved"},
        headers=teacher_headers
    )
    assert update_res.status_code == 200
    
    data = update_res.json()
    assert data["status"] == "Approved"
    assert data["reviewed_by_id"] is not None
