import sys
import os
import uvicorn

# Add backend directory to Python search path and environment variables
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
sys.path.insert(0, backend_dir)
os.environ["PYTHONPATH"] = backend_dir

# Set working directory to backend folder so database and folders map correctly
os.chdir(backend_dir)

if __name__ == "__main__":
    print("Starting PriceVision AI Unified Server on http://localhost:8000 ...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
