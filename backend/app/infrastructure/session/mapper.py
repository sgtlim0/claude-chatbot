"""Mappers between domain entities and persistence models"""

from app.domain.session.entities import Session
from .document import SessionDocument


def session_entity_to_document(session: Session) -> SessionDocument:
    """Convert domain Session entity to MongoDB SessionDocument"""
    return SessionDocument(**session.model_dump())


def session_document_to_entity(document: SessionDocument) -> Session:
    """Convert MongoDB SessionDocument to domain Session entity"""
    return Session(
        session_id=document.session_id,
        browser_id=document.browser_id,
        title=document.title,
        messages=document.messages,
        pinned=document.pinned,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )
