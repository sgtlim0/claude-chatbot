"""
CardNews AI Chat - Backend API on Modal
AWS Bedrock Converse API with Bearer Token authentication.
"""

import modal
import os

app = modal.App("cardnews-ai-chat-api")

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "httpx", "fastapi[standard]"
)


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("aws-bedrock-secrets")],
    min_containers=1,
)
@modal.asgi_app()
def web_app():
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    api = FastAPI(title="CardNews AI Chat API", docs_url="/docs")

    api.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @api.post("/chat")
    async def chat(data: dict):
        import httpx

        messages = data.get("messages", [])
        model_id = data.get(
            "model",
            os.environ.get(
                "AWS_BEDROCK_MODEL_ID",
                "us.anthropic.claude-sonnet-4-20250514-v1:0",
            ),
        )
        system_prompt = data.get(
            "systemPrompt",
            "You are a helpful AI assistant. Answer accurately and clearly. "
            "Answer in Korean by default, but if the user asks in another language, "
            "respond in that language.",
        )

        if not messages:
            return {"error": "messages is required"}

        api_key = os.environ.get("AWS_BEARER_TOKEN_BEDROCK")
        if not api_key:
            return {"error": "AWS_BEARER_TOKEN_BEDROCK not configured"}

        region = os.environ.get("AWS_BEDROCK_REGION", "us-east-1")

        bedrock_messages = [
            {"role": m["role"], "content": [{"text": m["content"]}]}
            for m in messages
            if m.get("role") in ("user", "assistant")
        ]

        if not bedrock_messages:
            return {"error": "No valid messages provided"}

        bedrock_url = (
            f"https://bedrock-runtime.{region}.amazonaws.com"
            f"/model/{model_id}/converse"
        )

        body = {
            "modelId": model_id,
            "system": [{"text": system_prompt}],
            "messages": bedrock_messages,
            "inferenceConfig": {"maxTokens": 4096},
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                resp = await client.post(
                    bedrock_url,
                    json=body,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}",
                    },
                )
            except httpx.ConnectError as e:
                return {"error": f"Connection failed: {str(e)}"}

            if resp.status_code != 200:
                return {
                    "error": f"Bedrock API error ({resp.status_code}): {resp.text}"
                }

            result = resp.json()

        text_content = "".join(
            block.get("text", "")
            for block in result.get("output", {}).get("message", {}).get("content", [])
        )

        if not text_content:
            return {"error": "No response from Bedrock"}

        return {"response": text_content}

    @api.get("/health")
    async def health():
        return {"status": "ok"}

    return api
