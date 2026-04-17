@echo off
REM Run RAG system in venv

REM Activate venv
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo ERROR: No venv found!
    echo Please run setup_venv.bat first
    pause
    exit /b 1
)

REM Run the RAG system with any arguments passed
python -m rag_system.simple_rag %*

