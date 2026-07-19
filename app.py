import sys
import os
import subprocess

if __name__ == "__main__":
    # Get backend folder path relative to this file
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
    
    # Run uvicorn in a clean subprocess to prevent Python namespace collisions
    cmd = [
        sys.executable, "-m", "uvicorn", 
        "app.main:app", 
        "--host", "0.0.0.0", 
        "--port", "8000", 
        "--reload", 
        "--app-dir", backend_dir
    ]
    
    print("Starting PriceVision AI Unified Server on http://localhost:8000 ...")
    try:
        subprocess.run(cmd, cwd=backend_dir)
    except KeyboardInterrupt:
        print("\nStopping server...")
