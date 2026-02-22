"""Test harness with fake/mock implementations for testing

Provides:
- InMemorySessionRepository: In-memory session storage
- FakeChatService: Predetermined response service
- ScriptedChatService: Per-input scripted responses for evaluation
- TestContainer: DI container with fakes
- EvalContainer: DI container wired for evaluation harness
"""

from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from app.config import Settings
from app.domain.chat.entities import MessageEmbed
from app.domain.session.entities import Session
from app.domain.chat.ports import ChatService
from app.domain.session.ports import SessionRepository
from app.harness.container import Container
from app.harness.evaluation.metrics import EvaluationMetric, LLMJudgeMetric
from app.harness.evaluation.runner import EvaluationRunner


class InMemorySessionRepository(SessionRepository):
    """In-memory implementation of SessionRepository for testing"""

    def __init__(self):
        self._sessions: dict[str, Session] = {}

    async def find_by_session_id(self, session_id: str) -> Optional[Session]:
        return self._sessions.get(session_id)

    async def find_by_browser_id(
        self, browser_id: str, skip: int = 0, limit: int = 100
    ) -> list[Session]:
        results = [
            s for s in self._sessions.values() if s.browser_id == browser_id
        ]
        results.sort(key=lambda s: s.updated_at, reverse=True)
        return results[skip : skip + limit]

    async def save(self, session: Session) -> Session:
        self._sessions[session.session_id] = session
        return session

    async def update(self, session_id: str, **kwargs) -> Optional[Session]:
        session = self._sessions.get(session_id)
        if not session:
            return None

        data = session.model_dump()
        data.update(kwargs)
        data["updated_at"] = datetime.now(timezone.utc)
        updated = Session(**data)
        self._sessions[session_id] = updated
        return updated

    async def delete(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False


class FakeChatService(ChatService):
    """Fake chat service that returns a single predetermined response"""

    def __init__(self, response: str = "This is a test response."):
        self._response = response
        self._model_id = "fake-model"

    async def stream_response(
        self,
        messages: list[MessageEmbed],
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        for word in self._response.split():
            yield word + " "

    def get_model_id(self) -> str:
        return self._model_id


class ScriptedChatService(ChatService):
    """Chat service with scripted responses keyed by last user message

    Used for evaluation harness test cases where each input
    needs a specific predetermined output.

    Usage:
        service = ScriptedChatService({
            "서울의 수도는?": "서울은 대한민국의 수도입니다.",
            "1+1은?": "2입니다.",
        })
    """

    def __init__(
        self,
        scripts: Optional[dict[str, str]] = None,
        default_response: str = "응답을 찾을 수 없습니다.",
        response_fn: Optional[Callable[[str], str]] = None,
    ):
        self._scripts = scripts or {}
        self._default = default_response
        self._response_fn = response_fn
        self._model_id = "scripted-model"
        self._call_log: list[dict[str, Any]] = []

    async def stream_response(
        self,
        messages: list[MessageEmbed],
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        # Extract last user message
        last_user_msg = ""
        for msg in reversed(messages):
            if msg.role == "user":
                last_user_msg = msg.content
                break

        self._call_log.append({
            "input": last_user_msg,
            "model": model,
            "system_prompt": system_prompt,
        })

        # Resolve response
        if self._response_fn:
            response = self._response_fn(last_user_msg)
        else:
            response = self._scripts.get(last_user_msg, self._default)

        for word in response.split():
            yield word + " "

    def get_model_id(self) -> str:
        return self._model_id

    @property
    def call_log(self) -> list[dict[str, Any]]:
        """Access recorded calls for assertions"""
        return list(self._call_log)


class TestContainer(Container):
    """Test container with fake implementations

    Usage:
        container = TestContainer()
        use_case = container.send_message_use_case()
    """

    def __init__(
        self,
        config: Optional[Settings] = None,
        fake_response: str = "Test response.",
    ):
        super().__init__(config or Settings(mongodb_uri="mongodb://localhost:27017"))
        self._in_memory_repo = InMemorySessionRepository()
        self._fake_chat = FakeChatService(response=fake_response)

    def session_repository(self) -> SessionRepository:
        return self._in_memory_repo

    def chat_service(self) -> ChatService:
        return self._fake_chat


class EvalContainer(Container):
    """Container wired for evaluation harness

    Provides a ScriptedChatService and an EvaluationRunner
    for running automated LLM evaluation suites.

    Usage:
        container = EvalContainer(scripts={
            "서울의 수도는?": "서울은 대한민국의 수도입니다.",
        })
        runner = container.evaluation_runner()
        result = await runner.run_suite(suite)
        print(result.summary())
    """

    def __init__(
        self,
        config: Optional[Settings] = None,
        scripts: Optional[dict[str, str]] = None,
        response_fn: Optional[Callable[[str], str]] = None,
        pass_threshold: float = 0.7,
        custom_metrics: Optional[dict[str, EvaluationMetric]] = None,
    ):
        super().__init__(config or Settings(mongodb_uri="mongodb://localhost:27017"))
        self._in_memory_repo = InMemorySessionRepository()
        self._scripted_chat = ScriptedChatService(
            scripts=scripts,
            response_fn=response_fn,
        )
        self._pass_threshold = pass_threshold
        self._custom_metrics = custom_metrics or {}

    def session_repository(self) -> SessionRepository:
        return self._in_memory_repo

    def chat_service(self) -> ChatService:
        return self._scripted_chat

    def evaluation_runner(
        self,
        judge_service: Optional[ChatService] = None,
    ) -> EvaluationRunner:
        """Create an evaluation runner

        Args:
            judge_service: Optional LLM service for LLM-based metrics.
                          If provided, adds 'llm_judge' to available metrics.
        """
        custom = dict(self._custom_metrics)
        if judge_service:
            custom["llm_judge"] = LLMJudgeMetric(judge_service=judge_service)

        return EvaluationRunner(
            chat_service=self._scripted_chat,
            pass_threshold=self._pass_threshold,
            custom_metrics=custom,
        )
