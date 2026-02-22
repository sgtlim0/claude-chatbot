"""Tests for the evaluation harness"""

import pytest

from app.harness.evaluation.metrics import (
    ExactMatchMetric,
    ContainsMetric,
    CosineSimilarityMetric,
    RougeMetric,
    get_metric,
)
from app.harness.evaluation.models import TestCase, TestSuite
from app.harness.evaluation.runner import EvaluationRunner
from app.harness.evaluation.loader import load_suite_from_dict
from app.harness.testing import EvalContainer, ScriptedChatService


# --- Metric Tests ---


@pytest.mark.asyncio
async def test_exact_match_positive():
    metric = ExactMatchMetric()
    score, details = await metric.score("hello world", "Hello World")
    assert score == 1.0
    assert details["matched"] is True


@pytest.mark.asyncio
async def test_exact_match_negative():
    metric = ExactMatchMetric()
    score, _ = await metric.score("hello", "world")
    assert score == 0.0


@pytest.mark.asyncio
async def test_exact_match_case_sensitive():
    metric = ExactMatchMetric(case_sensitive=True)
    score, _ = await metric.score("Hello", "hello")
    assert score == 0.0


@pytest.mark.asyncio
async def test_contains_positive():
    metric = ContainsMetric()
    score, details = await metric.score("서울", "서울은 대한민국의 수도입니다.")
    assert score == 1.0
    assert details["contained"] is True


@pytest.mark.asyncio
async def test_contains_negative():
    metric = ContainsMetric()
    score, _ = await metric.score("부산", "서울은 대한민국의 수도입니다.")
    assert score == 0.0


@pytest.mark.asyncio
async def test_cosine_similarity_identical():
    metric = CosineSimilarityMetric()
    score, _ = await metric.score("hello world", "hello world")
    assert score == pytest.approx(1.0)


@pytest.mark.asyncio
async def test_cosine_similarity_partial():
    metric = CosineSimilarityMetric()
    score, _ = await metric.score("hello world", "hello there")
    assert 0.0 < score < 1.0


@pytest.mark.asyncio
async def test_cosine_similarity_empty():
    metric = CosineSimilarityMetric()
    score, _ = await metric.score("", "hello")
    assert score == 0.0


@pytest.mark.asyncio
async def test_rouge_l_identical():
    metric = RougeMetric()
    score, details = await metric.score("the cat sat on the mat", "the cat sat on the mat")
    assert score == pytest.approx(1.0)
    assert details["precision"] == pytest.approx(1.0)
    assert details["recall"] == pytest.approx(1.0)


@pytest.mark.asyncio
async def test_rouge_l_partial():
    metric = RougeMetric()
    score, details = await metric.score(
        "the cat sat on the mat",
        "the cat was on a mat",
    )
    assert 0.0 < score < 1.0
    assert details["lcs_length"] > 0


@pytest.mark.asyncio
async def test_get_metric_builtin():
    metric = get_metric("exact_match")
    assert metric.name == "exact_match"


def test_get_metric_unknown():
    with pytest.raises(ValueError, match="Unknown metric"):
        get_metric("nonexistent")


# --- Model Tests ---


def test_suite_result_pass_rate():
    from app.harness.evaluation.models import SuiteResult, EvaluationResult

    result = SuiteResult(
        suite_name="test",
        results=[],
        total_cases=10,
        passed_cases=7,
        failed_cases=3,
    )
    assert result.pass_rate() == pytest.approx(0.7)


def test_suite_result_empty():
    from app.harness.evaluation.models import SuiteResult

    result = SuiteResult(suite_name="empty", results=[], total_cases=0)
    assert result.pass_rate() == 0.0


# --- Loader Tests ---


def test_load_suite_from_dict():
    data = {
        "name": "test-suite",
        "description": "A test suite",
        "metrics": ["exact_match", "contains"],
        "test_cases": [
            {
                "id": "t1",
                "messages": [{"role": "user", "content": "hi"}],
                "expected_output": "hello",
            }
        ],
    }
    suite = load_suite_from_dict(data)
    assert suite.name == "test-suite"
    assert len(suite.test_cases) == 1
    assert suite.metric_names == ["exact_match", "contains"]


# --- ScriptedChatService Tests ---


@pytest.mark.asyncio
async def test_scripted_service_returns_scripted_response():
    service = ScriptedChatService(scripts={"hi": "hello"})
    from app.domain.chat.entities import MessageEmbed

    msg = MessageEmbed(role="user", content="hi")
    result = ""
    async for token in service.stream_response(messages=[msg]):
        result += token
    assert result.strip() == "hello"


@pytest.mark.asyncio
async def test_scripted_service_default_response():
    service = ScriptedChatService(default_response="default")
    from app.domain.chat.entities import MessageEmbed

    msg = MessageEmbed(role="user", content="unknown")
    result = ""
    async for token in service.stream_response(messages=[msg]):
        result += token
    assert result.strip() == "default"


@pytest.mark.asyncio
async def test_scripted_service_logs_calls():
    service = ScriptedChatService(scripts={"q": "a"})
    from app.domain.chat.entities import MessageEmbed

    msg = MessageEmbed(role="user", content="q")
    async for _ in service.stream_response(messages=[msg]):
        pass
    assert len(service.call_log) == 1
    assert service.call_log[0]["input"] == "q"


# --- Runner Integration Tests ---


@pytest.mark.asyncio
async def test_runner_with_scripted_service():
    service = ScriptedChatService(scripts={
        "한국의 수도는?": "서울 입니다.",
    })
    runner = EvaluationRunner(chat_service=service, pass_threshold=0.5)

    suite = TestSuite(
        name="runner-test",
        test_cases=[
            TestCase(
                id="t1",
                messages=[{"role": "user", "content": "한국의 수도는?"}],
                expected_output="서울",
            ),
        ],
        metric_names=["contains"],
    )

    result = await runner.run_suite(suite)
    assert result.total_cases == 1
    assert result.passed_cases == 1
    assert result.average_scores["contains"] == 1.0


@pytest.mark.asyncio
async def test_runner_handles_error():
    """Test that runner gracefully handles service errors"""

    def failing_fn(msg: str) -> str:
        raise RuntimeError("Service unavailable")

    service = ScriptedChatService(response_fn=failing_fn)
    runner = EvaluationRunner(chat_service=service)

    suite = TestSuite(
        name="error-test",
        test_cases=[
            TestCase(
                id="t1",
                messages=[{"role": "user", "content": "test"}],
                expected_output="anything",
            ),
        ],
        metric_names=["exact_match"],
    )

    result = await runner.run_suite(suite)
    assert result.error_cases == 1
    assert result.results[0].error is not None


# --- EvalContainer Tests ---


@pytest.mark.asyncio
async def test_eval_container():
    container = EvalContainer(scripts={
        "안녕": "안녕하세요!",
    })

    runner = container.evaluation_runner()
    suite = TestSuite(
        name="container-test",
        test_cases=[
            TestCase(
                id="t1",
                messages=[{"role": "user", "content": "안녕"}],
                expected_output="안녕하세요",
            ),
        ],
        metric_names=["contains"],
    )

    result = await runner.run_suite(suite)
    assert result.total_cases == 1
    assert result.suite_name == "container-test"
