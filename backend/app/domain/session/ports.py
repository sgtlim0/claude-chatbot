"""Session repository port (interface)"""

from abc import ABC, abstractmethod
from typing import Optional

from .entities import Session


class SessionRepository(ABC):
    """Abstract interface for session persistence"""

    @abstractmethod
    async def find_by_session_id(self, session_id: str) -> Optional[Session]:
        """Find a session by its ID"""
        pass

    @abstractmethod
    async def find_by_browser_id(
        self, browser_id: str, skip: int = 0, limit: int = 100
    ) -> list[Session]:
        """Find all sessions for a browser ID"""
        pass

    @abstractmethod
    async def save(self, session: Session) -> Session:
        """Save a session (create or update)"""
        pass

    @abstractmethod
    async def update(self, session_id: str, **kwargs) -> Optional[Session]:
        """Update specific fields of a session"""
        pass

    @abstractmethod
    async def delete(self, session_id: str) -> bool:
        """Delete a session"""
        pass
