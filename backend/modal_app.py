"""
CardNews AI Chat - FastAPI + LangChain + MongoDB Backend on Modal
"""

import modal

app = modal.App("cardnews-ai-chat-backend")

# Modal image with all required dependencies
image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "fastapi[standard]",
        "langchain-aws>=0.2",
        "langchain-core>=0.3",
        "beanie>=1.26",
        "motor>=3.6",
        "pydantic-settings>=2.0",
    )
    .add_local_python_source("app")
)


@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("aws-bedrock-secrets"),
    ],
    min_containers=1,
)
@modal.asgi_app()
def web_app():
    from app.main import create_app

    return create_app()