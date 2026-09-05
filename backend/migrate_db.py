import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Update all classes that don't have total_students_count to have 0
    result = await db.class_rooms.update_many(
        {"total_students_count": {"$exists": False}},
        {"$set": {"total_students_count": 0}}
    )
    print(f"Updated {result.modified_count} old classes.")

if __name__ == "__main__":
    asyncio.run(main())
