"""Beanie Document models for MongoDB"""

from datetime import datetime

from beanie import Document, Indexed
from pydantic import Field

from app.domain.chat.entities import MessageEmbed


class SessionDocument(Document):
    """MongoDB Session document using Beanie ODM"""

    session_id: Indexed(str, unique=True)
    browser_id: Indexed(str)
    title: str = "새 채팅"
    messages: list[MessageEmbed] = []
    pinned: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        """Beanie settings"""

        name = "sessions"
