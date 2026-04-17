@echo off
REM Setup script for RAG system in venv

echo ============================================================
echo RAG System Setup Script
echo ============================================================
echo.

REM Check if venv exists
if exist ".venv\Scripts\activate.bat" (
    echo Activating .venv...
    call .venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    echo Activating venv...
    call venv\Scripts\activate.bat
) else (
    echo Creating new venv...
    python -m venv .venv
    call .venv\Scripts\activate.bat
)

echo.
echo Python executable: 
python -c "import sys; print(sys.executable)"

echo.
echo ============================================================
echo Installing/Upgrading dependencies...
echo ============================================================
echo.

REM Fix huggingface_hub version first
python -m pip install --upgrade "huggingface-hub<0.20.0"

REM Install all requirements
python -m pip install --upgrade -r requirements.txt

echo.
echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo Now you can run:
echo   python -m rag_system.simple_rag --rebuild
echo.

pause

