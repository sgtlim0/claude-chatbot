"""AWS Bedrock implementation of ChatService"""

from collections.abc import AsyncGenerator
from typing import Optional

from langchain_aws import ChatBedrockConverse
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.config import settings
from app.domain.chat.entities import MessageEmbed
from app.domain.chat.ports import ChatService


class BedrockChatService(ChatService):
    """AWS Bedrock implementation of the ChatService port using LangChain"""

    def __init__(self):
        """Initialize the Bedrock chat service"""
        self.llm = None
        self.current_model_id = settings.aws_bedrock_model_id

    def _get_llm(self, model_id: Optional[str] = None) -> ChatBedrockConverse:
        """Get or create LangChain ChatBedrockConverse instance"""
        model_to_use = model_id or settings.aws_bedrock_model_id

        if not self.llm or model_to_use != self.current_model_id:
            self.llm = ChatBedrockConverse(
                model=model_to_use,
                region=settings.aws_default_region,
                # AWS credentials are automatically loaded from environment by boto3
            )
            self.current_model_id = model_to_use

        return self.llm

    async def stream_response(
        self,
        messages: list[MessageEmbed],
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat response from AWS Bedrock

        Args:
            messages: Conversation history
            model: Optional model ID to use
            system_prompt: Optional system prompt

        Yields:
            Token strings from the LLM response
        """
        # Build LangChain messages
        langchain_messages = []

        # Add system message
        if system_prompt:
            langchain_messages.append(SystemMessage(content=system_prompt))
        else:
            # Default system prompt
            langchain_messages.append(
                SystemMessage(
                    content=(
                        "You are a helpful AI assistant. Answer accurately and clearly. "
                        "Answer in Korean by default, but if the user asks in another language, "
                        "respond in that language."
                    )
                )
            )

        # Convert MessageEmbed to LangChain messages
        for msg in messages:
            if msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                langchain_messages.append(AIMessage(content=msg.content))

        # Get LLM instance
        llm = self._get_llm(model)

        # Stream tokens from LangChain
        try:
            async for chunk in llm.astream(langchain_messages):
                # Extract content from chunk
                if hasattr(chunk, "content") and chunk.content:
                    yield chunk.content
        except Exception as e:
            # Log error and yield error message
            print(f"Error in chat streaming: {e}")
            yield f"Error: {str(e)}"

    def get_model_id(self) -> str:
        """Get the current model ID"""
        return self.current_model_id
