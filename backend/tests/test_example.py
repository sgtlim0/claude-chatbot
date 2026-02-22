"""Example test demonstrating the harness layer with TestContainer"""

import asyncio
from app.harness.testing import TestContainer
from app.application.chat.dto import ChatRequest
from app.application.session.dto import SessionCreateDTO


async def test_send_message_with_test_container():
    """Example test using TestContainer with fake implementations"""

    # Create test container with fake implementations
    container = TestContainer(fake_response="Hello from test!")

    # Get use case from container
    send_message_use_case = container.send_message_use_case()

    # Create chat request
    request = ChatRequest(
        session_id="test-session-123",
        browser_id="test-browser-456",
        message="Hello AI",
        model="test-model",
        system_prompt="You are a test assistant",
    )

    # Execute use case and collect response
    response_tokens = []
    async for token in send_message_use_case.execute(request):
        response_tokens.append(token)

    # Verify response
    full_response = "".join(response_tokens)
    assert full_response == "Hello from test! "
    print(f"✅ Test passed! Response: {full_response}")

    # Verify session was created and updated
    session_repo = container.session_repository()
    session = await session_repo.find_by_session_id("test-session-123")
    assert session is not None
    assert len(session.messages) == 2  # User message + assistant message
    assert session.messages[0].role == "user"
    assert session.messages[0].content == "Hello AI"
    assert session.messages[1].role == "assistant"
    assert session.messages[1].content == "Hello from test! "
    print("✅ Session correctly updated with messages")


async def test_session_crud_with_test_container():
    """Example test of session CRUD operations using TestContainer"""

    # Create test container
    container = TestContainer()

    # Get use cases from container
    create_use_case = container.create_session_use_case()
    list_use_case = container.list_sessions_use_case()
    get_use_case = container.get_session_use_case()
    update_use_case = container.update_session_use_case()
    delete_use_case = container.delete_session_use_case()

    # Test create
    create_dto = SessionCreateDTO(
        session_id="session-1",
        browser_id="browser-1",
        title="Test Session",
        pinned=False,
    )
    created = await create_use_case.execute(create_dto)
    assert created.session_id == "session-1"
    assert created.title == "Test Session"
    print("✅ Session created")

    # Test list
    sessions = await list_use_case.execute("browser-1")
    assert len(sessions) == 1
    assert sessions[0].session_id == "session-1"
    print("✅ Session listed")

    # Test get
    session = await get_use_case.execute("session-1")
    assert session is not None
    assert session.session_id == "session-1"
    print("✅ Session retrieved")

    # Test update
    from app.application.session.dto import SessionUpdateDTO
    update_dto = SessionUpdateDTO(title="Updated Title", pinned=True)
    updated = await update_use_case.execute("session-1", update_dto)
    assert updated is not None
    assert updated.title == "Updated Title"
    assert updated.pinned is True
    print("✅ Session updated")

    # Test delete
    deleted = await delete_use_case.execute("session-1")
    assert deleted is True
    sessions_after = await list_use_case.execute("browser-1")
    assert len(sessions_after) == 0
    print("✅ Session deleted")


async def test_swapping_implementations():
    """Demonstrate how easy it is to swap between test and production containers"""

    # Test with fake implementations
    test_container = TestContainer(fake_response="Test response")
    test_use_case = test_container.send_message_use_case()

    # In production, you would use:
    # from app.harness.container import Container
    # prod_container = Container()
    # prod_use_case = prod_container.send_message_use_case()

    # The interface is exactly the same!
    request = ChatRequest(
        session_id="demo-session",
        browser_id="demo-browser",
        message="Hello",
    )

    # Collect test response
    test_response = []
    async for token in test_use_case.execute(request):
        test_response.append(token)

    print(f"✅ Test implementation returned: {''.join(test_response)}")

    # In production, the real MongoDB and Bedrock would be used
    # but the code remains the same!


# FastAPI testing example
def test_fastapi_with_test_container():
    """Example of how to use TestContainer with FastAPI TestClient"""
    from fastapi.testclient import TestClient
    from app.main import create_app
    from app.api.dependencies import set_container
    from app.harness.testing import TestContainer

    # Create app
    app = create_app()

    # Override with test container
    test_container = TestContainer(fake_response="Mock response from API test")
    set_container(test_container)

    # Create test client
    client = TestClient(app)

    # Test the chat endpoint
    response = client.post(
        "/api/chat",
        json={
            "session_id": "api-test-session",
            "browser_id": "api-test-browser",
            "message": "Test message",
        },
        stream=True,
    )

    # Note: In a real test, you would parse the SSE stream
    # For this example, we just verify the status
    assert response.status_code == 200
    print("✅ API test with TestContainer passed")


if __name__ == "__main__":
    print("Running example tests with TestContainer...\n")

    # Run async tests
    asyncio.run(test_send_message_with_test_container())
    print()
    asyncio.run(test_session_crud_with_test_container())
    print()
    asyncio.run(test_swapping_implementations())
    print()

    # Run sync test
    print("Note: FastAPI test example shown but not executed (requires fastapi installed)")
    print("\n🎉 All example tests demonstrate the harness layer working correctly!")