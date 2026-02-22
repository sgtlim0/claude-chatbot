"""FastAPI dependency injection using Container"""

from typing import Optional

from app.domain.chat.ports import ChatService
from app.domain.session.ports import SessionRepository
from app.harness.container import Container
from app.application.chat.send_message import SendMessageUseCase
from app.application.session.create_session import CreateSessionUseCase
from app.application.session.list_sessions import ListSessionsUseCase
from app.application.session.get_session import GetSessionUseCase
from app.application.session.update_session import UpdateSessionUseCase
from app.application.session.delete_session import DeleteSessionUseCase

# Singleton container
_container: Optional[Container] = None


def get_container() -> Container:
    """Get the application container"""
    global _container
    if _container is None:
        _container = Container()
    return _container


def set_container(container: Container) -> None:
    """Override the container (for testing)"""
    global _container
    _container = container


# Port dependencies
def get_session_repository() -> SessionRepository:
    return get_container().session_repository()


def get_chat_service() -> ChatService:
    return get_container().chat_service()


# Use case dependencies
def get_send_message_use_case() -> SendMessageUseCase:
    return get_container().send_message_use_case()


def get_create_session_use_case() -> CreateSessionUseCase:
    return get_container().create_session_use_case()


def get_list_sessions_use_case() -> ListSessionsUseCase:
    return get_container().list_sessions_use_case()


def get_get_session_use_case() -> GetSessionUseCase:
    return get_container().get_session_use_case()


def get_update_session_use_case() -> UpdateSessionUseCase:
    return get_container().update_session_use_case()


def get_delete_session_use_case() -> DeleteSessionUseCase:
    return get_container().delete_session_use_case()
