"""FastAPI server wrapper for SimpleRAG."""

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_system.simple_rag import SimpleRAG


def _fyp_root() -> Path:
    """Directory that contains `data/` and `vector_store/` (parent of package `rag_system`)."""
    return Path(__file__).resolve().parent.parent


class AskRequest(BaseModel):
    question: str
    use_llm: Optional[bool] = None
    llm_model_name: Optional[str] = None
    llm_temperature: Optional[float] = None


class Source(BaseModel):
    rank: int
    source_file: str
    relevance_score: float
    content: str


class AskResponse(BaseModel):
    answer: str
    sources: List[Source] = []


def _bool_env(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.lower() in ("1", "true", "yes", "on")


@lru_cache(maxsize=1)
def get_rag(default_use_llm: bool, default_llm_model: str, default_llm_temp: float) -> SimpleRAG:
    """Initialize SimpleRAG once per process (paths anchored to FYP bundle root)."""
    root = _fyp_root()
    return SimpleRAG(
        data_folder=str(root / "data/Admission Information"),
        program_folder=str(root / "data/Program"),
        faculty_folder=str(root / "data/Faculty"),
        vector_store_path=str(root / "vector_store"),
        rebuild_vector_store=False,
        include_programs=True,
        include_faculty=True,
        use_llm=default_use_llm,
        llm_model_name=default_llm_model,
        llm_temperature=default_llm_temp,
    )


DEFAULT_USE_LLM = _bool_env("RAG_USE_LLM", True)
DEFAULT_LLM_MODEL = os.getenv("RAG_LLM_MODEL", "qwen2.5:3b")
DEFAULT_LLM_TEMP = float(os.getenv("RAG_LLM_TEMP", "0.2"))

app = FastAPI(title="SimpleRAG API", version="1.0.0")
_origins = os.getenv("RAG_CORS_ORIGINS", "*")
_allow = [o.strip() for o in _origins.split(",") if o.strip()] or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    rag = get_rag(DEFAULT_USE_LLM, DEFAULT_LLM_MODEL, DEFAULT_LLM_TEMP)

    # Allow per-request overrides without reinitializing embeddings
    if req.use_llm is not None:
        rag.use_llm = req.use_llm
    if req.llm_model_name:
        rag.llm_model_name = req.llm_model_name
    if req.llm_temperature is not None:
        rag.llm_temperature = req.llm_temperature

    result = rag.ask(req.question)
    sources = [
        Source(
            rank=s["rank"],
            source_file=s.get("source_file", "Unknown"),
            relevance_score=s.get("relevance_score", 0.0),
            content=s.get("content", ""),
        )
        for s in result.get("sources", [])
    ]
    return AskResponse(answer=result["answer"], sources=sources)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "rag_system.api_server:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=False,
    )

