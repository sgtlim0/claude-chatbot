"""Send message use case"""

from collections.abc import AsyncGenerator

from app.domain.chat.ports import ChatService
from app.domain.chat.service import ChatOrchestrator
from app.domain.session.ports import SessionRepository

from .dto import ChatRequest


class SendMessageUseCase:
    """Use case for sending a message and streaming the response"""

    def __init__(
        self,
        session_repository: SessionRepository,
        chat_service: ChatService,
    ):
        self.orchestrator = ChatOrchestrator(session_repository, chat_service)

    async def execute(self, request: ChatRequest) -> AsyncGenerator[str, None]:
        """
        Execute the send message use case

        Args:
            request: Chat request with message details

        Yields:
            Tokens from the assistant response
        """
        async for token in self.orchestrator.process_message(
            session_id=request.session_id,
            browser_id=request.browser_id,
            user_message=request.message,
            model=request.model,
            system_prompt=request.system_prompt,
        ):
            yield token
