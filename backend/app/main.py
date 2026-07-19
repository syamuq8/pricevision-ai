import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routes import auth, products, history, wishlist, notifications, admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI-powered product price comparison platform APIs",
    version="1.0.0"
)

# CORS Configuration
# React frontend dev server usually runs on http://localhost:5173 or http://localhost:3000
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(history.router, prefix=settings.API_V1_STR)
app.include_router(wishlist.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

# Serve uploaded product images
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

from fastapi.responses import FileResponse
from fastapi import HTTPException

# Serve static frontend build
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/")
def read_root():
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} Backend API! (Frontend build missing)",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/{catchall:path}")
async def serve_frontend(catchall: str):
    # Prevent intercepting API routes or uploads
    if (catchall.startswith("api") or 
        catchall.startswith("docs") or 
        catchall.startswith("openapi.json") or 
        catchall.startswith("uploads")):
        raise HTTPException(status_code=404, detail="Not Found")
        
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Frontend build index.html not found")
