"""Session DTOs"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.domain.chat.entities import MessageEmbed


class SessionCreateDTO(BaseModel):
    """DTO for creating a session"""

    session_id: str
    browser_id: str
    title: str = "새 채팅"
    pinned: bool = False


class SessionUpdateDTO(BaseModel):
    """DTO for updating a session"""

    title: Optional[str] = None
    pinned: Optional[bool] = None


class SessionResponseDTO(BaseModel):
    """DTO for session responses"""

    session_id: str
    browser_id: str
    title: str
    pinned: bool
    created_at: datetime
    updated_at: datetime
    messages: Optional[list[MessageEmbed]] = None

    class Config:
        from_attributes = True
