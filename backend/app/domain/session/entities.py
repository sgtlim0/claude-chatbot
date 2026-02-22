"""Session entity - pure domain model"""

from datetime import datetime

from pydantic import BaseModel, Field

from ..chat.entities import MessageEmbed


class Session(BaseModel):
    """Session entity with pure domain logic"""

    session_id: str
    browser_id: str
    title: str = "새 채팅"
    messages: list[MessageEmbed] = Field(default_factory=list)
    pinned: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def add_message(self, message: MessageEmbed) -> None:
        """Add a message to the session"""
        self.messages.append(message)
        self.updated_at = datetime.utcnow()

    def update_title(self, title: str) -> None:
        """Update session title"""
        self.title = title
        self.updated_at = datetime.utcnow()

    def toggle_pin(self) -> None:
        """Toggle pinned status"""
        self.pinned = not self.pinned
        self.updated_at = datetime.utcnow()
