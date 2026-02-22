"""Data models for evaluation test cases and results"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class TestCase(BaseModel):
    """A single evaluation test case

    Represents one input-output pair for evaluating the chat service.
    Follows the per-prompt test granularity from lm-evaluation-harness.
    """

    id: str
    description: str = ""
    messages: list[dict[str, str]]  # [{"role": "user", "content": "..."}]
    expected_output: str
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class TestSuite(BaseModel):
    """A collection of test cases for a specific evaluation task

    Maps to the YAML task config concept in lm-evaluation-harness.
    Groups related test cases with shared metrics.
    """

    name: str
    description: str = ""
    test_cases: list[TestCase]
    metric_names: list[str] = Field(default_factory=lambda: ["exact_match"])
    tags: list[str] = Field(default_factory=list)


class MetricScore(BaseModel):
    """Score from a single metric evaluation"""

    metric_name: str
    score: float  # 0.0 to 1.0
    details: dict[str, Any] = Field(default_factory=dict)


class EvaluationResult(BaseModel):
    """Result of evaluating a single test case"""

    test_case_id: str
    actual_output: str
    expected_output: str
    scores: list[MetricScore] = Field(default_factory=list)
    passed: bool = False
    error: Optional[str] = None
    latency_ms: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SuiteResult(BaseModel):
    """Aggregated results from running a full test suite"""

    suite_name: str
    results: list[EvaluationResult]
    total_cases: int = 0
    passed_cases: int = 0
    failed_cases: int = 0
    error_cases: int = 0
    average_scores: dict[str, float] = Field(default_factory=dict)
    duration_ms: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    def pass_rate(self) -> float:
        if self.total_cases == 0:
            return 0.0
        return self.passed_cases / self.total_cases

    def summary(self) -> str:
        return (
            f"Suite '{self.suite_name}': "
            f"{self.passed_cases}/{self.total_cases} passed "
            f"({self.pass_rate():.1%}), "
            f"avg scores: {self.average_scores}"
        )
