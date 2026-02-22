"""Chat service port (interface)"""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Optional

from .entities import MessageEmbed


class ChatService(ABC):
    """Abstract interface for LLM chat streaming"""

    @abstractmethod
    async def stream_response(
        self,
        messages: list[MessageEmbed],
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat response from LLM

        Args:
            messages: Conversation history
            model: Optional model ID to use
            system_prompt: Optional system prompt

        Yields:
            Token strings from the LLM response
        """
        pass

    @abstractmethod
    def get_model_id(self) -> str:
        """Get the current model ID"""
        pass
