"""Session domain services"""

from datetime import datetime
from typing import Optional

from .entities import Session
from .ports import SessionRepository


class SessionService:
    """Domain service for session-related business logic

    This is for domain logic that doesn't fit naturally on the Session entity
    or requires coordination with the repository.
    """

    def __init__(self, repository: SessionRepository):
        self.repository = repository

    async def get_or_create_session(
        self,
        session_id: str,
        browser_id: str
    ) -> Session:
        """Get existing session or create a new one"""
        session = await self.repository.find_by_session_id(session_id)
        if session:
            return session

        # Create new session
        new_session = Session(
            session_id=session_id,
            browser_id=browser_id,
            title="새 채팅",
            messages=[],
            pinned=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        return await self.repository.save(new_session)

    async def auto_title_from_first_message(
        self,
        session: Session,
        max_length: int = 50
    ) -> Session:
        """Auto-generate title from first user message if still default"""
        if session.title == "새 채팅" and session.messages:
            # Find first user message
            for msg in session.messages:
                if msg.role == "user":
                    # Create title from first message
                    title = msg.content[:max_length]
                    if len(msg.content) > max_length:
                        title += "..."
                    session.update_title(title)
                    return await self.repository.save(session)
        return session