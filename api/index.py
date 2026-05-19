import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

import coach
from findings import CHART_DATA, HEADLINE_STATS

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    review: str
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
    review: str
    response: str
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/practice")
async def api_practice(req: PracticeRequest):
    try:
        return coach.practice_critique(req.review, req.response, req.review_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/samples")
async def api_samples(review_type: str | None = None):
    if review_type and review_type not in ("positive", "negative"):
        raise HTTPException(status_code=400, detail="review_type must be 'positive', 'negative', or omitted")
    return {"samples": coach.list_samples(review_type)}


@app.post("/api/samples/generate")
async def api_sample_generate(req: SampleGenRequest):
    try:
        return coach.generate_sample_review(req.review_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard")
async def api_dashboard():
    return {"headline": HEADLINE_STATS, "charts": CHART_DATA}
