"""Test suite loader - load evaluation test cases from YAML/JSON files

Follows the lm-evaluation-harness pattern of YAML task configs
for defining evaluation datasets and metrics.
"""

import json
from pathlib import Path
from typing import Any

from .models import TestCase, TestSuite


def load_suite_from_dict(data: dict[str, Any]) -> TestSuite:
    """Load a test suite from a dictionary

    Expected format:
        {
            "name": "basic-qa",
            "description": "Basic Q&A evaluation",
            "metrics": ["contains", "cosine_similarity"],
            "tags": ["qa", "basic"],
            "test_cases": [
                {
                    "id": "q1",
                    "description": "Capital city question",
                    "messages": [{"role": "user", "content": "한국의 수도는?"}],
                    "expected_output": "서울",
                    "tags": ["geography"]
                }
            ]
        }
    """
    test_cases = [
        TestCase(**tc) for tc in data.get("test_cases", [])
    ]
    return TestSuite(
        name=data["name"],
        description=data.get("description", ""),
        test_cases=test_cases,
        metric_names=data.get("metrics", ["exact_match"]),
        tags=data.get("tags", []),
    )


def load_suite_from_json(path: str | Path) -> TestSuite:
    """Load a test suite from a JSON file"""
    with open(path) as f:
        data = json.load(f)
    return load_suite_from_dict(data)


def load_suite_from_yaml(path: str | Path) -> TestSuite:
    """Load a test suite from a YAML file

    Requires PyYAML (optional dependency).
    """
    try:
        import yaml
    except ImportError:
        raise ImportError(
            "PyYAML is required for YAML loading. "
            "Install with: pip install pyyaml"
        )

    with open(path) as f:
        data = yaml.safe_load(f)
    return load_suite_from_dict(data)


def load_suites_from_directory(
    directory: str | Path,
    extensions: tuple[str, ...] = (".json", ".yaml", ".yml"),
) -> list[TestSuite]:
    """Load all test suites from a directory"""
    dir_path = Path(directory)
    if not dir_path.is_dir():
        raise FileNotFoundError(f"Directory not found: {directory}")

    suites = []
    for ext in extensions:
        for path in sorted(dir_path.glob(f"*{ext}")):
            if ext == ".json":
                suites.append(load_suite_from_json(path))
            else:
                suites.append(load_suite_from_yaml(path))

    return suites
