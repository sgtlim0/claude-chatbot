"""Domain service for orchestrating chat flow"""

from datetime import datetime
from typing import Optional

from .entities import MessageEmbed
from .ports import ChatService
from ..session.entities import Session
from ..session.ports import SessionRepository


class ChatOrchestrator:
    """Orchestrates the chat flow between session and LLM"""

    def __init__(
        self,
        session_repository: SessionRepository,
        chat_service: ChatService,
    ):
        self.session_repository = session_repository
        self.chat_service = chat_service

    async def process_message(
        self,
        session_id: str,
        browser_id: str,
        user_message: str,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ):
        """
        Process a user message and stream the response

        Yields:
            Tokens from the assistant response
        """
        # Get or create session
        session = await self.session_repository.find_by_session_id(session_id)
        if not session:
            session = Session(
                session_id=session_id,
                browser_id=browser_id,
                title="새 채팅",
                messages=[],
                pinned=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

        # Add user message
        user_msg = MessageEmbed(
            role="user",
            content=user_message,
            timestamp=datetime.utcnow(),
        )
        session.add_message(user_msg)

        # Save session with user message
        session = await self.session_repository.save(session)

        # Stream response from LLM
        full_response = ""
        async for token in self.chat_service.stream_response(
            messages=session.messages,
            model=model,
            system_prompt=system_prompt,
        ):
            full_response += token
            yield token

        # Add assistant message
        assistant_msg = MessageEmbed(
            role="assistant",
            content=full_response,
            timestamp=datetime.utcnow(),
            model=model or self.chat_service.get_model_id(),
        )
        session.add_message(assistant_msg)

        # Save session with assistant message
        await self.session_repository.save(session)
