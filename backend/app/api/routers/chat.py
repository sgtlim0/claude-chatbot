"""Chat streaming endpoint with SSE"""

import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.application.chat.dto import ChatRequest
from app.application.chat.send_message import SendMessageUseCase

from ..dependencies import get_send_message_use_case

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def stream_chat(
    request: ChatRequest,
    use_case: SendMessageUseCase = Depends(get_send_message_use_case),
):
    """
    Stream chat response using Server-Sent Events (SSE)

    Returns tokens as:
    data: {"content": "token"}\n\n

    And on completion:
    data: [DONE]\n\n
    """
    try:
        # Prepare streaming response
        async def generate_sse():
            """Generate SSE stream"""
            try:
                # Stream tokens from use case
                async for token in use_case.execute(request):
                    # Send token as SSE
                    data = json.dumps({"content": token}, ensure_ascii=False)
                    yield f"data: {data}\n\n"

                # Send completion signal
                yield "data: [DONE]\n\n"

            except Exception as e:
                # Send error in SSE format
                error_data = json.dumps({"error": str(e)}, ensure_ascii=False)
                yield f"data: {error_data}\n\n"

        return StreamingResponse(
            generate_sse(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable Nginx buffering
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))