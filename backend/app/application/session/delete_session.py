"""Delete session use case"""

from app.domain.session.ports import SessionRepository


class DeleteSessionUseCase:
    """Use case for deleting a session"""

    def __init__(self, session_repository: SessionRepository):
        self.session_repository = session_repository

    async def execute(self, session_id: str) -> bool:
        """
        Delete a session

        Args:
            session_id: Session identifier

        Returns:
            True if deleted, False if not found
        """
        return await self.session_repository.delete(session_id)
