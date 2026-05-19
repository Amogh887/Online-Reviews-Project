import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
import analyzer as _analyzer
from findings import HEADLINE_STATS, CHART_DATA

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    review: str
    response: str
    review_type: str

    @field_validator("review", "response")
    @classmethod
    def not_empty(cls, v):
        if not v.strip():
            raise ValueError("must not be empty")
        return v.strip()

    @field_validator("review_type")
    @classmethod
    def validate_type(cls, v):
        if v not in {"positive", "negative"}:
            raise ValueError("must be 'positive' or 'negative'")
        return v


@app.post("/api/analyze")
async def analyze_endpoint(req: AnalyzeRequest):
    try:
        return _analyzer.analyze(req.review, req.response, req.review_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard")
async def dashboard():
    return {"headline_stats": HEADLINE_STATS, "chart_data": CHART_DATA}
