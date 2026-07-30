import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field, field_validator

load_dotenv()

import coach
from findings import CHART_DATA, HEADLINE_STATS

logger = logging.getLogger("review_coach")

app = FastAPI(title="Review Response Coach")

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174"
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    review: str = Field(..., max_length=10000)
    review_type: str

    @field_validator("review_type")
    @classmethod
    def _check_type(cls, v: str) -> str:
        if v not in ("positive", "negative"):
            raise ValueError("review_type must be 'positive' or 'negative'")
        return v

    @field_validator("review")
    @classmethod
    def _check_review(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("review must not be empty")
        return v.strip()


class PracticeRequest(BaseModel):
    review: str = Field(..., max_length=10000)
    response: str = Field(..., max_length=10000)
    review_type: str

    @field_validator("review_type")
    @classmethod
    def _check_type(cls, v: str) -> str:
        if v not in ("positive", "negative"):
            raise ValueError("review_type must be 'positive' or 'negative'")
        return v

    @field_validator("review", "response")
    @classmethod
    def _check_text(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("field must not be empty")
        return v.strip()


class SampleGenRequest(BaseModel):
    review_type: str

    @field_validator("review_type")
    @classmethod
    def _check_type(cls, v: str) -> str:
        if v not in ("positive", "negative"):
            raise ValueError("review_type must be 'positive' or 'negative'")
        return v


@app.post("/api/generate")
async def api_generate(req: GenerateRequest):
    try:
        return coach.generate_response(req.review, req.review_type)
    except HTTPException:
        raise
    except Exception:
        logger.exception("generate failed")
        raise HTTPException(status_code=500, detail="Internal error while generating the response.")


@app.post("/api/practice")
async def api_practice(req: PracticeRequest):
    try:
        return coach.practice_critique(req.review, req.response, req.review_type)
    except HTTPException:
        raise
    except Exception:
        logger.exception("practice failed")
        raise HTTPException(status_code=500, detail="Internal error while critiquing the response.")


@app.get("/api/samples")
async def api_samples(review_type: str | None = None):
    if review_type and review_type not in ("positive", "negative"):
        raise HTTPException(status_code=400, detail="review_type must be 'positive', 'negative', or omitted")
    return {"samples": coach.list_samples(review_type)}


@app.post("/api/samples/generate")
async def api_sample_generate(req: SampleGenRequest):
    try:
        return coach.generate_sample_review(req.review_type)
    except HTTPException:
        raise
    except Exception:
        logger.exception("sample generate failed")
        raise HTTPException(status_code=500, detail="Internal error while generating a sample review.")


@app.get("/api/dashboard")
async def api_dashboard():
    return {"headline": HEADLINE_STATS, "charts": CHART_DATA}


# Streaming endpoints (SSE)
@app.post("/api/generate/stream")
async def api_generate_stream(req: GenerateRequest):
    try:
        async def generate():
            try:
                async for line in coach.stream_generate(req.review, req.review_type):
                    yield line
            except Exception:
                logger.exception("generate stream failed")
                yield f"event: error\ndata: {json.dumps({'message': 'Stream failed.'})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("generate stream setup failed")
        raise HTTPException(status_code=500, detail="Internal error while starting the stream.")


@app.post("/api/practice/stream")
async def api_practice_stream(req: PracticeRequest):
    try:
        async def generate():
            try:
                async for line in coach.stream_practice(req.review, req.response, req.review_type):
                    yield line
            except Exception:
                logger.exception("practice stream failed")
                yield f"event: error\ndata: {json.dumps({'message': 'Stream failed.'})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("practice stream setup failed")
        raise HTTPException(status_code=500, detail="Internal error while starting the stream.")


# Serve compiled React build (production)
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        index = frontend_dist / "index.html"
        return FileResponse(str(index))
