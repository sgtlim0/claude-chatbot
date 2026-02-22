"""Update session use case"""

from typing import Optional

from app.domain.session.entities import Session
from app.domain.session.ports import SessionRepository

from .dto import SessionUpdateDTO


class UpdateSessionUseCase:
    """Use case for updating a session"""

    def __init__(self, session_repository: SessionRepository):
        self.session_repository = session_repository

    async def execute(
        self, session_id: str, dto: SessionUpdateDTO
    ) -> Optional[Session]:
        """
        Update a session

        Args:
            session_id: Session identifier
            dto: Update data

        Returns:
            Updated session if found, None otherwise
        """
        # Build update kwargs from DTO
        update_kwargs = {}
        if dto.title is not None:
            update_kwargs["title"] = dto.title
        if dto.pinned is not None:
            update_kwargs["pinned"] = dto.pinned

        # Update via repository
        return await self.session_repository.update(session_id, **update_kwargs)
