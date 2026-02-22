"""MongoDB implementation of SessionRepository"""

from datetime import datetime
from typing import Optional

from app.domain.session.entities import Session
from app.domain.session.ports import SessionRepository

from .mapper import session_document_to_entity, session_entity_to_document
from .document import SessionDocument


class MongoSessionRepository(SessionRepository):
    """MongoDB implementation of the SessionRepository port"""

    async def find_by_session_id(self, session_id: str) -> Optional[Session]:
        """Find a session by its ID"""
        document = await SessionDocument.find_one(
            SessionDocument.session_id == session_id
        )
        if document:
            return session_document_to_entity(document)
        return None

    async def find_by_browser_id(
        self, browser_id: str, skip: int = 0, limit: int = 100
    ) -> list[Session]:
        """Find all sessions for a browser ID"""
        documents = (
            await SessionDocument.find(SessionDocument.browser_id == browser_id)
            .sort(-SessionDocument.updated_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )
        return [session_document_to_entity(doc) for doc in documents]

    async def save(self, session: Session) -> Session:
        """Save a session (create or update)"""
        # Check if session exists
        existing = await SessionDocument.find_one(
            SessionDocument.session_id == session.session_id
        )

        if existing:
            # Update existing document
            for field, value in session.model_dump().items():
                setattr(existing, field, value)
            await existing.save()
            return session_document_to_entity(existing)
        else:
            # Create new document
            document = session_entity_to_document(session)
            await document.save()
            return session_document_to_entity(document)

    async def update(self, session_id: str, **kwargs) -> Optional[Session]:
        """Update specific fields of a session"""
        document = await SessionDocument.find_one(
            SessionDocument.session_id == session_id
        )
        if not document:
            return None

        # Update fields
        for field, value in kwargs.items():
            if hasattr(document, field):
                setattr(document, field, value)

        # Always update the updated_at timestamp
        document.updated_at = datetime.utcnow()

        await document.save()
        return session_document_to_entity(document)

    async def delete(self, session_id: str) -> bool:
        """Delete a session"""
        document = await SessionDocument.find_one(
            SessionDocument.session_id == session_id
        )
        if not document:
            return False

        await document.delete()
        return True
