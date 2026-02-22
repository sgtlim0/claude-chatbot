"""Application configuration using pydantic-settings"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database_name: str = "cardnews_ai_chat"

    # AWS Bedrock
    aws_default_region: str = "us-east-1"
    aws_bedrock_model_id: str = "us.anthropic.claude-sonnet-4-20250514-v1:0"

    # AWS credentials are automatically read by boto3 from environment:
    # AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

    # Application
    app_name: str = "CardNews AI Chat API"
    app_version: str = "0.1.0"
    debug: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()