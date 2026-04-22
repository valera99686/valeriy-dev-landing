"""AWS Lambda entrypoint.

Wraps the FastAPI ``app`` with Mangum so the same code runs on:
  * local `uvicorn` for development,
  * Docker on EC2 / Fargate for self-hosting,
  * AWS Lambda + API Gateway (HTTP API) for serverless deploys.

Usage in AWS Lambda:
    Handler: handler.handler
    Runtime: python3.12
"""

from mangum import Mangum

from main import app

handler = Mangum(app, lifespan="auto")
