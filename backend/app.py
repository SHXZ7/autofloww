import uvicorn
from backend.app.main import app  # Import your existing FastAPI app


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
