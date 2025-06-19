# backend-python/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

load_dotenv()

# Import routers directly
from routers.auth_router import router as auth_router
from routers.game_router import router as game_router  
from routers.websocket_router import router as websocket_router

# Try to import chess_api - if it fails, we'll know
try:
    from routers.chess_api import router as chess_api_router
    CHESS_API_AVAILABLE = True
    print("✅ Chess API loaded successfully")
except ImportError as e:
    print(f"❌ Failed to load Chess API: {e}")
    CHESS_API_AVAILABLE = False

app = FastAPI(title="ChessMentor Server", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(game_router, prefix="/api", tags=["games"])
app.include_router(websocket_router, tags=["websocket"])

# Only register chess API if it loaded successfully
if CHESS_API_AVAILABLE:
    app.include_router(chess_api_router, prefix="/api", tags=["chess"])
    print("✅ Chess API routes registered")
else:
    print("⚠️ Chess API routes not available")

@app.get("/")
async def root():
    return {
        "message": "ChessMentor Server",
        "chess_api_available": CHESS_API_AVAILABLE
    }

if __name__ == "__main__":
    print("🚀 Starting server...")
    if CHESS_API_AVAILABLE:
        print("🎮 Chess API endpoints available:")
        print("  POST /api/chess/new-game")
        print("  POST /api/chess/move") 
    else:
        print("❌ Chess API not available - check chess_api.py file")
    
    uvicorn.run("main:app", host="localhost", port=5001, log_level="info", reload=False)