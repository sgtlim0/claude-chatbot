"""Evaluation metrics for LLM response quality assessment

Implements both logic-based and LLM-based metrics,
following the lm-evaluation-harness pattern:
- Logic-based: exact match, contains, cosine similarity, Rouge-L
- LLM-based: LLM judge scoring (GPT similarity/correctness pattern)
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Any, Optional

from app.domain.chat.entities import MessageEmbed
from app.domain.chat.ports import ChatService


class EvaluationMetric(ABC):
    """Abstract base class for evaluation metrics"""

    @property
    @abstractmethod
    def name(self) -> str:
        """Metric identifier"""
        pass

    @abstractmethod
    async def score(
        self, expected: str, actual: str, **kwargs: Any
    ) -> tuple[float, dict[str, Any]]:
        """
        Calculate similarity score between expected and actual output.

        Returns:
            Tuple of (score between 0.0-1.0, detail dict)
        """
        pass


class ExactMatchMetric(EvaluationMetric):
    """Exact string match (case-insensitive by default)"""

    def __init__(self, case_sensitive: bool = False, strip: bool = True):
        self._case_sensitive = case_sensitive
        self._strip = strip

    @property
    def name(self) -> str:
        return "exact_match"

    async def score(
        self, expected: str, actual: str, **kwargs: Any
    ) -> tuple[float, dict[str, Any]]:
        e = expected.strip() if self._strip else expected
        a = actual.strip() if self._strip else actual
        if not self._case_sensitive:
            e = e.lower()
            a = a.lower()
        matched = e == a
        return (1.0 if matched else 0.0, {"matched": matched})


class ContainsMetric(EvaluationMetric):
    """Check if expected content is contained in actual output"""

    def __init__(self, case_sensitive: bool = False):
        self._case_sensitive = case_sensitive

    @property
    def name(self) -> str:
        return "contains"

    async def score(
        self, expected: str, actual: str, **kwargs: Any
    ) -> tuple[float, dict[str, Any]]:
        e = expected if self._case_sensitive else expected.lower()
        a = actual if self._case_sensitive else actual.lower()
        contained = e in a
        return (1.0 if contained else 0.0, {"contained": contained})


class CosineSimilarityMetric(EvaluationMetric):
    """Token-level cosine similarity using TF-IDF-like approach

    Lightweight implementation without external ML dependencies.
    Uses word frequency vectors for similarity calculation.
    """

    @property
    def name(self) -> str:
        return "cosine_similarity"

    async def score(
        self, expected: str, actual: str, **kwargs: Any
    ) -> tuple[float, dict[str, Any]]:
        expected_tokens = self._tokenize(expected)
        actual_tokens = self._tokenize(actual)

        if not expected_tokens or not actual_tokens:
            return (0.0, {"reason": "empty input"})

        # Build vocabulary
        vocab = set(expected_tokens) | set(actual_tokens)

        # Build frequency vectors
        vec_e = {t: expected_tokens.count(t) for t in vocab}
        vec_a = {t: actual_tokens.count(t) for t in vocab}

        # Cosine similarity
        dot_product = sum(vec_e[t] * vec_a[t] for t in vocab)
        norm_e = sum(v**2 for v in vec_e.values()) ** 0.5
        norm_a = sum(v**2 for v in vec_a.values()) ** 0.5

        if norm_e == 0 or norm_a == 0:
            return (0.0, {"reason": "zero norm"})

        similarity = dot_product / (norm_e * norm_a)
        return (similarity, {"dot_product": dot_product})

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return text.lower().split()


class RougeMetric(EvaluationMetric):
    """Rouge-L metric using longest common subsequence

    Measures recall-oriented similarity between expected and actual text.
    Lightweight implementation without external dependencies.
    """

    @property
    def name(self) -> str:
        return "rouge_l"

    async def score(
        self, expected: str, actual: str, **kwargs: Any
    ) -> tuple[float, dict[str, Any]]:
        ref_tokens = expected.lower().split()
        hyp_tokens = actual.lower().split()

        if not ref_tokens or not hyp_tokens:
            return (0.0, {"reason": "empty input"})

        lcs_length = self._lcs_length(ref_tokens, hyp_tokens)

        precision = lcs_length / len(hyp_tokens) if hyp_tokens else 0.0
        recall = lcs_length / len(ref_tokens) if ref_tokens else 0.0

        if precision + recall == 0:
            f1 = 0.0
        else:
            f1 = 2 * precision * recall / (precision + recall)

        return (
            f1,
            {
                "precision": precision,
                "recall": recall,
                "lcs_length": lcs_length,
            },
        )

    @staticmethod
    def _lcs_length(x: list[str], y: list[str]) -> int:
        m, n = len(x), len(y)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if x[i - 1] == y[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
        return dp[m][n]


class LLMJudgeMetric(EvaluationMetric):
    """LLM-based evaluation using another LLM as judge

    Follows the GPT similarity/correctness pattern from lm-evaluation-harness.
    Uses the ChatService port so any LLM backend can serve as judge.
    """

    JUDGE_PROMPT_TEMPLATE = """당신은 AI 응답 품질 평가 전문가입니다.

아래의 기대 출력과 실제 출력을 비교하여 유사도를 1~5 점으로 평가하세요.

## 기대 출력
{expected}

## 실제 출력
{actual}

## 평가 기준
1점: 완전히 다른 내용
2점: 일부 관련 있으나 핵심 내용 누락
3점: 핵심 내용은 포함하나 세부사항 차이
4점: 대부분 일치하며 표현 차이만 있음
5점: 의미적으로 동일

점수만 숫자로 답하세요 (1, 2, 3, 4, 5 중 하나)."""

    def __init__(
        self,
        judge_service: ChatService,
        threshold: float = 0.6,
        prompt_template: Optional[str] = None,
    ):
        self._judge = judge_service
        self._threshold = threshold
        self._template = prompt_template or self.JUDGE_PROMPT_TEMPLATE

    @property
    def name(self) -> str:
        return "llm_judge"

    async def score(
        self, expected: str, actual: str, **kwargs: Any
    ) -> tuple[float, dict[str, Any]]:
        prompt = self._template.format(expected=expected, actual=actual)

        judge_message = MessageEmbed(role="user", content=prompt)
        response_text = ""

        async for token in self._judge.stream_response(
            messages=[judge_message],
            system_prompt="당신은 AI 응답 평가자입니다. 숫자만 답하세요.",
        ):
            response_text += token

        # Parse score from response
        raw_score = self._parse_score(response_text.strip())
        normalized = raw_score / 5.0  # Normalize to 0.0-1.0

        return (
            normalized,
            {
                "raw_score": raw_score,
                "judge_response": response_text.strip(),
                "threshold": self._threshold,
            },
        )

    @staticmethod
    def _parse_score(text: str) -> float:
        """Extract numeric score from judge response"""
        for char in text:
            if char.isdigit() and char in "12345":
                return float(char)
        return 1.0  # Default to lowest score on parse failure


# --- Metric Registry ---

BUILTIN_METRICS: dict[str, type[EvaluationMetric]] = {
    "exact_match": ExactMatchMetric,
    "contains": ContainsMetric,
    "cosine_similarity": CosineSimilarityMetric,
    "rouge_l": RougeMetric,
}


def get_metric(name: str, **kwargs: Any) -> EvaluationMetric:
    """Create a metric instance by name"""
    if name not in BUILTIN_METRICS:
        raise ValueError(
            f"Unknown metric '{name}'. "
            f"Available: {list(BUILTIN_METRICS.keys())} + 'llm_judge' (requires judge_service)"
        )
    return BUILTIN_METRICS[name](**kwargs)
