"""Message value object - pure domain model"""

from datetime import datetime
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class MessageEmbed(BaseModel):
    """Message value object embedded within a session"""

    id: str = Field(default_factory=lambda: str(uuid4()))
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    model: Optional[str] = None
