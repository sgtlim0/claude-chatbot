#!/usr/bin/env python3
"""Test script to verify DDD structure imports work correctly"""

print("Testing Domain Layer imports...")
try:
    from app.domain.entities import MessageEmbed, Session
    from app.domain.ports import SessionRepository, ChatService
    from app.domain.services import ChatOrchestrator
    print("✅ Domain layer imports OK")
except ImportError as e:
    print(f"❌ Domain layer import error: {e}")

print("\nTesting Application Layer imports...")
try:
    from app.application.use_cases import (
        SendMessageUseCase,
        CreateSessionUseCase,
        ListSessionsUseCase,
        GetSessionUseCase,
        UpdateSessionUseCase,
        DeleteSessionUseCase,
    )
    from app.application.dto import (
        ChatRequest,
        ChatResponse,
        SessionCreateDTO,
        SessionUpdateDTO,
        SessionResponseDTO,
    )
    print("✅ Application layer imports OK")
except ImportError as e:
    print(f"❌ Application layer import error: {e}")

print("\nTesting Infrastructure Layer imports...")
try:
    from app.infrastructure.persistence.mongodb import (
        init_db,
        MongoSessionRepository,
    )
    from app.infrastructure.llm import BedrockChatService
    print("✅ Infrastructure layer imports OK")
except ImportError as e:
    print(f"❌ Infrastructure layer import error: {e}")

print("\nTesting API Layer imports...")
try:
    from app.api.routers import chat_router, sessions_router, health_router
    from app.api.dependencies import get_session_repository, get_chat_service
    print("✅ API layer imports OK")
except ImportError as e:
    print(f"❌ API layer import error: {e}")

print("\nTesting Main App import...")
try:
    from app.main import create_app
    print("✅ Main app import OK")
except ImportError as e:
    print(f"❌ Main app import error: {e}")

print("\n🎉 All imports successful! DDD structure is correctly set up.")