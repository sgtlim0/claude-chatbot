"""Dependency injection container - wires ports to adapters"""

from typing import Optional

from app.config import Settings, settings
from app.domain.chat.ports import ChatService
from app.domain.session.ports import SessionRepository
from app.infrastructure.chat.bedrock_adapter import BedrockChatService
from app.infrastructure.session.mongo_adapter import MongoSessionRepository
from app.application.chat.send_message import SendMessageUseCase
from app.application.session.create_session import CreateSessionUseCase
from app.application.session.list_sessions import ListSessionsUseCase
from app.application.session.get_session import GetSessionUseCase
from app.application.session.update_session import UpdateSessionUseCase
from app.application.session.delete_session import DeleteSessionUseCase


class Container:
    """Production dependency container

    Provides lazy-initialized singleton instances of all ports and use cases.
    Swap implementations by subclassing (see TestContainer).
    """

    def __init__(self, config: Optional[Settings] = None):
        self._config = config or settings
        self._session_repo: Optional[SessionRepository] = None
        self._chat_service: Optional[ChatService] = None

    @property
    def config(self) -> Settings:
        return self._config

    def session_repository(self) -> SessionRepository:
        if self._session_repo is None:
            self._session_repo = MongoSessionRepository()
        return self._session_repo

    def chat_service(self) -> ChatService:
        if self._chat_service is None:
            self._chat_service = BedrockChatService()
        return self._chat_service

    # --- Use Cases ---

    def send_message_use_case(self) -> SendMessageUseCase:
        return SendMessageUseCase(
            session_repository=self.session_repository(),
            chat_service=self.chat_service(),
        )

    def create_session_use_case(self) -> CreateSessionUseCase:
        return CreateSessionUseCase(
            session_repository=self.session_repository(),
        )

    def list_sessions_use_case(self) -> ListSessionsUseCase:
        return ListSessionsUseCase(
            session_repository=self.session_repository(),
        )

    def get_session_use_case(self) -> GetSessionUseCase:
        return GetSessionUseCase(
            session_repository=self.session_repository(),
        )

    def update_session_use_case(self) -> UpdateSessionUseCase:
        return UpdateSessionUseCase(
            session_repository=self.session_repository(),
        )

    def delete_session_use_case(self) -> DeleteSessionUseCase:
        return DeleteSessionUseCase(
            session_repository=self.session_repository(),
        )
