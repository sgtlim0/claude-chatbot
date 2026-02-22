# Domain-Driven Design with Hexagonal Architecture

This backend follows DDD principles with Hexagonal Architecture (Ports and Adapters pattern) organized by **business concept** (비즈니스 개념단위) rather than technical layers.

## Architecture Layers

### 🔴 Domain Layer (Core Business Logic)
- **Location**: `app/domain/`
- **Organization**: By business concept
  ```
  domain/
  ├── chat/               # Chat bounded context
  │   ├── entities.py    # MessageEmbed value object
  │   ├── ports.py       # ChatService interface (ABC)
  │   └── service.py     # ChatOrchestrator domain service
  └── session/           # Session bounded context
      ├── entities.py    # Session entity with business methods
      ├── ports.py       # SessionRepository interface (ABC)
      └── service.py     # SessionService domain service
  ```
- **Key Principle**: Pure Python, no framework dependencies

### 🟡 Application Layer (Use Cases)
- **Location**: `app/application/`
- **Organization**: By business concept
  ```
  application/
  ├── chat/                    # Chat use cases
  │   ├── send_message.py     # SendMessageUseCase
  │   └── dto.py              # ChatRequest, ChatResponse DTOs
  └── session/                # Session CRUD use cases
      ├── create_session.py
      ├── list_sessions.py
      ├── get_session.py
      ├── update_session.py
      ├── delete_session.py
      └── dto.py              # Session DTOs
  ```
- **Dependencies**: Only domain layer

### 🟢 Infrastructure Layer (External Adapters)
- **Location**: `app/infrastructure/`
- **Organization**: By business concept
  ```
  infrastructure/
  ├── chat/                    # Chat infrastructure
  │   └── bedrock_adapter.py  # BedrockChatService (implements ChatService port)
  ├── session/                # Session infrastructure
  │   ├── document.py         # Beanie SessionDocument
  │   ├── mapper.py           # Domain ↔ Document mapping
  │   └── mongo_adapter.py    # MongoSessionRepository (implements SessionRepository port)
  └── database.py             # Shared database connection
  ```
- **Dependencies**: Implements domain ports

### 🔵 API Layer (Driving Adapters)
- **Location**: `app/api/`
- **Purpose**: HTTP API controllers
- **Components**:
  - `routers/` - FastAPI endpoints (chat, sessions, health)
  - `dependencies.py` - FastAPI dependency injection functions
- **Dependencies**: Gets use cases from harness container

### 🟣 Harness Layer (Dependency Wiring)
- **Location**: `app/harness/`
- **Purpose**: Factory layer that wires ports to adapters
- **Components**:
  - `container.py` - Production dependency container
  - `testing.py` - Test doubles (InMemorySessionRepository, FakeChatService, TestContainer)
- **Key Benefits**:
  - Single place to configure all dependencies
  - Easy swapping between implementations (prod/test/dev)
  - Lazy initialization for performance
  - Test isolation with TestContainer

## Container Pattern

The Container class acts as a factory for all dependencies:

```python
class Container:
    def __init__(self, config: Settings):
        self.config = config
        self._session_repo = None
        self._chat_service = None

    def session_repository(self) -> SessionRepository:
        if not self._session_repo:
            self._session_repo = MongoSessionRepository()
        return self._session_repo

    def chat_service(self) -> ChatService:
        if not self._chat_service:
            self._chat_service = BedrockChatService()
        return self._chat_service

    def send_message_use_case(self) -> SendMessageUseCase:
        return SendMessageUseCase(
            self.session_repository(),
            self.chat_service()
        )
```

## Testing with TestContainer

The TestContainer provides fake implementations for testing:

```python
from app.harness.testing import TestContainer

# Create test container with fake implementations
container = TestContainer(fake_response="Mock response")

# Get use case with all dependencies wired
use_case = container.send_message_use_case()

# Execute with confidence - no external dependencies!
async for token in use_case.execute(request):
    print(token)  # Will print "Mock response"
```

## FastAPI Integration

FastAPI endpoints use dependency injection to get use cases:

```python
from app.api.dependencies import get_send_message_use_case

@router.post("/chat")
async def stream_chat(
    request: ChatRequest,
    use_case: SendMessageUseCase = Depends(get_send_message_use_case)
):
    async for token in use_case.execute(request):
        yield token
```

For testing, simply swap the container:

```python
from app.api.dependencies import set_container
from app.harness.testing import TestContainer

# Override with test container
test_container = TestContainer()
set_container(test_container)

# Now all API calls use fake implementations!
```

## Benefits

1. **Testability**: Complete test isolation with TestContainer
2. **Flexibility**: Swap implementations without changing code
3. **Maintainability**: Clear boundaries between layers
4. **Domain Focus**: Business logic free from technical concerns
5. **Scalability**: Easy to add new use cases or adapters
6. **Developer Experience**: Single place to configure dependencies

## Implementation Swapping Examples

- **Production**: MongoSessionRepository + BedrockChatService
- **Testing**: InMemorySessionRepository + FakeChatService
- **Local Dev**: SQLiteRepository + MockLLMService (future)
- **Staging**: MongoSessionRepository + OpenAIChatService (future)

## Future Enhancements

- Add more test doubles (SQLite for local dev)
- Implement domain events for complex workflows
- Add CQRS if read/write patterns diverge
- Create specialized containers for different environments
- Add dependency validation on container initialization