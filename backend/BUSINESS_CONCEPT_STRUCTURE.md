# DDD Structure by Business Concept

The backend is organized by **business concept** (비즈니스 개념단위) rather than technical layers. Each business domain (chat, session) is self-contained across all architectural layers.

## Current Structure

```
backend/app/
├── domain/                      # 도메인 계층 (핵심 비즈니스 로직)
│   ├── chat/                    # 채팅 도메인
│   │   ├── __init__.py
│   │   ├── entities.py          # MessageEmbed value object
│   │   ├── ports.py             # ChatService ABC (인터페이스)
│   │   └── service.py           # ChatOrchestrator (도메인 서비스)
│   │
│   └── session/                 # 세션 도메인
│       ├── __init__.py
│       ├── entities.py          # Session entity
│       ├── ports.py             # SessionRepository ABC (인터페이스)
│       └── service.py           # SessionService (도메인 서비스)
│
├── application/                 # 애플리케이션 계층 (유즈케이스)
│   ├── chat/                    # 채팅 유즈케이스
│   │   ├── __init__.py
│   │   ├── send_message.py      # SendMessageUseCase
│   │   └── dto.py               # ChatRequest, ChatResponse
│   │
│   └── session/                 # 세션 유즈케이스
│       ├── __init__.py
│       ├── create_session.py    # CreateSessionUseCase
│       ├── list_sessions.py     # ListSessionsUseCase
│       ├── get_session.py       # GetSessionUseCase
│       ├── update_session.py    # UpdateSessionUseCase
│       ├── delete_session.py    # DeleteSessionUseCase
│       └── dto.py               # Session DTOs
│
├── infrastructure/              # 인프라 계층 (외부 어댑터)
│   ├── chat/                    # 채팅 인프라
│   │   ├── __init__.py
│   │   └── bedrock_adapter.py   # BedrockChatService (AWS Bedrock 구현)
│   │
│   ├── session/                 # 세션 인프라
│   │   ├── __init__.py
│   │   ├── document.py          # Beanie SessionDocument
│   │   ├── mapper.py            # Domain ↔ Document 매퍼
│   │   └── mongo_adapter.py     # MongoSessionRepository (MongoDB 구현)
│   │
│   └── database.py              # 공통 DB 연결 설정
│
├── harness/                     # 의존성 주입 & 테스트 하네스
│   ├── __init__.py
│   ├── container.py             # Production DI container
│   ├── testing.py               # Test doubles (Fakes, Mocks)
│   └── evaluation/              # 평가 하네스
│       ├── __init__.py
│       ├── loader.py
│       ├── metrics.py
│       ├── models.py
│       └── runner.py
│
├── api/                         # API 계층 (HTTP 어댑터)
│   ├── __init__.py
│   ├── dependencies.py          # FastAPI Depends (Container 사용)
│   └── routers/
│       ├── __init__.py
│       ├── chat.py              # /api/chat 엔드포인트
│       ├── sessions.py          # /api/sessions CRUD
│       └── health.py            # /health 체크
│
├── config.py                    # 애플리케이션 설정
└── main.py                      # FastAPI 앱 팩토리
```

## Benefits of Business Concept Organization

### 1. **높은 응집도 (High Cohesion)**
- 채팅 관련 모든 코드가 `chat/` 디렉토리에 모여있음
- 세션 관련 모든 코드가 `session/` 디렉토리에 모여있음
- 한 곳에서 비즈니스 개념의 전체 구현을 파악 가능

### 2. **낮은 결합도 (Low Coupling)**
- 각 비즈니스 도메인이 독립적
- 새로운 도메인 추가 시 기존 도메인 수정 불필요
- 도메인 간 의존성은 포트/어댑터를 통해서만 연결

### 3. **쉬운 네비게이션**
```bash
# 채팅 기능의 모든 레이어 확인
ls app/*/chat/

# 세션 기능의 모든 레이어 확인
ls app/*/session/
```

### 4. **독립적 테스트**
```python
# 채팅 도메인만 테스트
from app.harness.testing import TestContainer
container = TestContainer()
chat_use_case = container.send_message_use_case()

# 세션 도메인만 테스트
session_use_case = container.create_session_use_case()
```

## Adding New Business Concepts

새로운 비즈니스 개념 추가 예시 (예: User 도메인):

```
1. Domain Layer:
   app/domain/user/
   ├── entities.py      # User entity
   ├── ports.py         # UserRepository ABC
   └── service.py       # UserService

2. Application Layer:
   app/application/user/
   ├── register_user.py # RegisterUserUseCase
   ├── login_user.py    # LoginUserUseCase
   └── dto.py          # User DTOs

3. Infrastructure Layer:
   app/infrastructure/user/
   ├── document.py      # UserDocument
   └── mongo_adapter.py # MongoUserRepository

4. API Layer:
   app/api/routers/users.py  # User endpoints
```

## Architecture Principles

1. **비즈니스 중심 구조**: 기술이 아닌 비즈니스 개념으로 구성
2. **경계 컨텍스트**: 각 도메인은 명확한 경계를 가짐
3. **포트와 어댑터**: 도메인은 인터페이스(포트)를 정의, 인프라가 구현(어댑터)
4. **의존성 역전**: 인프라가 도메인에 의존 (도메인은 인프라를 모름)
5. **테스트 용이성**: 각 도메인을 독립적으로 테스트 가능

## Navigation Guide

```bash
# Find all chat-related code
find app -path "*/chat/*" -name "*.py"

# Find all session-related code
find app -path "*/session/*" -name "*.py"

# See domain interfaces
cat app/domain/*/ports.py

# See infrastructure implementations
cat app/infrastructure/*/adapter.py
```

This organization makes the codebase more intuitive and maintainable by grouping related code by business concept rather than technical concerns.