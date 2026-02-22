"""Create session use case"""

from datetime import datetime

from app.domain.session.entities import Session
from app.domain.session.ports import SessionRepository

from .dto import SessionCreateDTO


class CreateSessionUseCase:
    """Use case for creating a new session"""

    def __init__(self, session_repository: SessionRepository):
        self.session_repository = session_repository

    async def execute(self, dto: SessionCreateDTO) -> Session:
        """
        Create a new session

        Args:
            dto: Session creation data

        Returns:
            Created session

        Raises:
            ValueError: If session already exists
        """
        # Check if session already exists
        existing = await self.session_repository.find_by_session_id(dto.session_id)
        if existing:
            raise ValueError("Session already exists")

        # Create new session
        session = Session(
            session_id=dto.session_id,
            browser_id=dto.browser_id,
            title=dto.title,
            pinned=dto.pinned,
            messages=[],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        # Save and return
        return await self.session_repository.save(session)
