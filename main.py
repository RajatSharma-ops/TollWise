import os
from dotenv import load_dotenv

# Automatically load environment variables from .env file
load_dotenv(override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from src.routes.router import router as routes_router
from src.annual_pass.router import router as annual_pass_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(
    title="TollWise API",
    description="FastAPI service for calculating route tolls and NHAI Annual Pass savings.",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes_router)
app.include_router(annual_pass_router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "TollWise API",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
