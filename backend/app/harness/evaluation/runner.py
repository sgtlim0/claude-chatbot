"""Evaluation runner - orchestrates test suite execution

Runs test cases against a ChatService implementation and
collects results with metric scores.
"""

import time
from typing import Optional

from app.domain.chat.entities import MessageEmbed
from app.domain.chat.ports import ChatService

from .metrics import EvaluationMetric, get_metric
from .models import (
    EvaluationResult,
    MetricScore,
    SuiteResult,
    TestCase,
    TestSuite,
)


class EvaluationRunner:
    """Runs evaluation test suites against a ChatService

    Inspired by EleutherAI's lm-evaluation-harness runner.
    Supports both logic-based and LLM-based metrics.

    Usage:
        runner = EvaluationRunner(chat_service)
        result = await runner.run_suite(suite)
        print(result.summary())
    """

    def __init__(
        self,
        chat_service: ChatService,
        pass_threshold: float = 0.7,
        custom_metrics: Optional[dict[str, EvaluationMetric]] = None,
    ):
        self._chat_service = chat_service
        self._pass_threshold = pass_threshold
        self._custom_metrics = custom_metrics or {}

    async def run_case(
        self,
        test_case: TestCase,
        metrics: list[EvaluationMetric],
    ) -> EvaluationResult:
        """Run a single test case and evaluate with given metrics"""
        start = time.monotonic()

        try:
            # Build messages from test case
            messages = [
                MessageEmbed(role=m["role"], content=m["content"])
                for m in test_case.messages
            ]

            # Get response from chat service
            actual_output = ""
            async for token in self._chat_service.stream_response(
                messages=messages,
                model=test_case.model,
                system_prompt=test_case.system_prompt,
            ):
                actual_output += token

            latency = (time.monotonic() - start) * 1000

            # Evaluate with each metric
            scores = []
            for metric in metrics:
                score_value, details = await metric.score(
                    expected=test_case.expected_output,
                    actual=actual_output.strip(),
                )
                scores.append(
                    MetricScore(
                        metric_name=metric.name,
                        score=score_value,
                        details=details,
                    )
                )

            # Determine pass/fail based on average score
            avg_score = (
                sum(s.score for s in scores) / len(scores) if scores else 0.0
            )
            passed = avg_score >= self._pass_threshold

            return EvaluationResult(
                test_case_id=test_case.id,
                actual_output=actual_output.strip(),
                expected_output=test_case.expected_output,
                scores=scores,
                passed=passed,
                latency_ms=latency,
            )

        except Exception as e:
            latency = (time.monotonic() - start) * 1000
            return EvaluationResult(
                test_case_id=test_case.id,
                actual_output="",
                expected_output=test_case.expected_output,
                passed=False,
                error=str(e),
                latency_ms=latency,
            )

    async def run_suite(self, suite: TestSuite) -> SuiteResult:
        """Run all test cases in a suite and aggregate results"""
        start = time.monotonic()

        # Resolve metrics
        metrics = self._resolve_metrics(suite.metric_names)

        # Run each test case
        results: list[EvaluationResult] = []
        for test_case in suite.test_cases:
            result = await self.run_case(test_case, metrics)
            results.append(result)

        duration = (time.monotonic() - start) * 1000

        # Aggregate
        passed = sum(1 for r in results if r.passed)
        errors = sum(1 for r in results if r.error)
        failed = len(results) - passed - errors

        # Average scores per metric
        avg_scores: dict[str, float] = {}
        for metric in metrics:
            metric_scores = [
                s.score
                for r in results
                for s in r.scores
                if s.metric_name == metric.name
            ]
            if metric_scores:
                avg_scores[metric.name] = sum(metric_scores) / len(metric_scores)

        return SuiteResult(
            suite_name=suite.name,
            results=results,
            total_cases=len(results),
            passed_cases=passed,
            failed_cases=failed,
            error_cases=errors,
            average_scores=avg_scores,
            duration_ms=duration,
        )

    def _resolve_metrics(self, metric_names: list[str]) -> list[EvaluationMetric]:
        """Resolve metric names to instances"""
        metrics = []
        for name in metric_names:
            if name in self._custom_metrics:
                metrics.append(self._custom_metrics[name])
            else:
                metrics.append(get_metric(name))
        return metrics
