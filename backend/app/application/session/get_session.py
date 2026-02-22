"""Get session use case"""

from typing import Optional

from app.domain.session.entities import Session
from app.domain.session.ports import SessionRepository


class GetSessionUseCase:
    """Use case for getting a specific session"""

    def __init__(self, session_repository: SessionRepository):
        self.session_repository = session_repository

    async def execute(self, session_id: str) -> Optional[Session]:
        """
        Get a session by ID

        Args:
            session_id: Session identifier

        Returns:
            Session if found, None otherwise
        """
        return await self.session_repository.find_by_session_id(session_id)
