"""MongoDB connection using Motor and Beanie"""

import os

from app.config import settings


async def init_db():
    """Initialize MongoDB connection and Beanie ODM

    Skips initialization if MONGODB_URI is not set (e.g. during initial deploy).
    """
    mongodb_uri = os.environ.get("MONGODB_URI", settings.mongodb_uri)

    if mongodb_uri == "mongodb://localhost:27017" and not os.environ.get("MONGODB_URI"):
        print("WARNING: MONGODB_URI not set, skipping database initialization")
        return

    from beanie import init_beanie
    from motor.motor_asyncio import AsyncIOMotorClient

    from app.infrastructure.session.document import SessionDocument

    client = AsyncIOMotorClient(mongodb_uri)
    await init_beanie(
        database=client[settings.mongodb_database_name],
        document_models=[SessionDocument],
    )
