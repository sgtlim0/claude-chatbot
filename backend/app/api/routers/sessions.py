"""Session CRUD endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.application.session.dto import (
    SessionCreateDTO,
    SessionResponseDTO,
    SessionUpdateDTO,
)
from app.application.session import (
    CreateSessionUseCase,
    DeleteSessionUseCase,
    GetSessionUseCase,
    ListSessionsUseCase,
    UpdateSessionUseCase,
)

from ..dependencies import (
    get_list_sessions_use_case,
    get_get_session_use_case,
    get_create_session_use_case,
    get_update_session_use_case,
    get_delete_session_use_case,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("", response_model=list[SessionResponseDTO])
async def get_sessions(
    browser_id: str = Query(..., description="Browser ID to filter sessions"),
    skip: int = Query(0, ge=0, description="Number of sessions to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of sessions"),
    use_case: ListSessionsUseCase = Depends(get_list_sessions_use_case),
):
    """
    Get all sessions for a browser ID, sorted by updated_at desc.
    Returns sessions without messages for performance.
    """
    sessions = await use_case.execute(browser_id, skip, limit)

    # Convert to response DTOs without messages
    return [
        SessionResponseDTO(
            session_id=s.session_id,
            browser_id=s.browser_id,
            title=s.title,
            pinned=s.pinned,
            created_at=s.created_at,
            updated_at=s.updated_at,
            messages=None,  # Don't include messages in list view
        )
        for s in sessions
    ]


@router.get("/{session_id}", response_model=SessionResponseDTO)
async def get_session(
    session_id: str,
    use_case: GetSessionUseCase = Depends(get_get_session_use_case),
):
    """Get a specific session with all messages"""
    session = await use_case.execute(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponseDTO(
        session_id=session.session_id,
        browser_id=session.browser_id,
        title=session.title,
        pinned=session.pinned,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=session.messages,  # Include messages
    )


@router.post("", response_model=SessionResponseDTO)
async def create_session(
    session_data: SessionCreateDTO,
    use_case: CreateSessionUseCase = Depends(get_create_session_use_case),
):
    """Create a new session"""
    try:
        session = await use_case.execute(session_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return SessionResponseDTO(
        session_id=session.session_id,
        browser_id=session.browser_id,
        title=session.title,
        pinned=session.pinned,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[],
    )


@router.patch("/{session_id}", response_model=SessionResponseDTO)
async def update_session(
    session_id: str,
    update_data: SessionUpdateDTO,
    use_case: UpdateSessionUseCase = Depends(get_update_session_use_case),
):
    """Update session title or pinned status"""
    session = await use_case.execute(session_id, update_data)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponseDTO(
        session_id=session.session_id,
        browser_id=session.browser_id,
        title=session.title,
        pinned=session.pinned,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=None,  # Don't include messages in update response
    )


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    use_case: DeleteSessionUseCase = Depends(get_delete_session_use_case),
):
    """Delete a session"""
    deleted = await use_case.execute(session_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"message": "Session deleted successfully"}