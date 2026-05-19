import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator

load_dotenv()

from analyzer import analyze
from findings import CHART_DATA, HEADLINE_STATS

app = FastAPI(title="Review Response Coach")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    review: str
    response: str
    review_type: str

    @field_validator("review_type")
    @classmethod
    def validate_review_type(cls, v: str) -> str:
        if v not in ("positive", "negative"):
            raise ValueError("review_type must be 'positive' or 'negative'")
        return v

    @field_validator("review", "response")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field must not be empty")
        return v.strip()


@app.post("/api/analyze")
async def api_analyze(req: AnalyzeRequest):
    try:
        result = analyze(req.review, req.response, req.review_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard")
async def api_dashboard():
    return {"headline": HEADLINE_STATS, "charts": CHART_DATA}


# Serve compiled React build (production)
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        index = frontend_dist / "index.html"
        return FileResponse(str(index))
