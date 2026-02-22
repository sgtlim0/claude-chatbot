"""List sessions use case"""

from app.domain.session.entities import Session
from app.domain.session.ports import SessionRepository


class ListSessionsUseCase:
    """Use case for listing sessions by browser ID"""

    def __init__(self, session_repository: SessionRepository):
        self.session_repository = session_repository

    async def execute(
        self, browser_id: str, skip: int = 0, limit: int = 100
    ) -> list[Session]:
        """
        Get all sessions for a browser ID

        Args:
            browser_id: Browser identifier
            skip: Number of sessions to skip
            limit: Maximum number of sessions to return

        Returns:
            List of sessions
        """
        return await self.session_repository.find_by_browser_id(
            browser_id=browser_id,
            skip=skip,
            limit=limit,
        )
