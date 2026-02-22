"""Chat DTOs"""

from typing import Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Chat request DTO"""

    session_id: str
    browser_id: str
    message: str
    model: Optional[str] = None
    system_prompt: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response DTO (for non-streaming responses if needed)"""

    content: str
    model: str
