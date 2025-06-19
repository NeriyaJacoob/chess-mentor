# backend-python/main.py - FIXED VERSION
"""
ChessMentor Server - Main Entry Point - Fixed
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers import auth_router, game_router, websocket_router
from utils.mock_data import mock_db

# יצירת האפליקציה הראשית
app = FastAPI(
    title="ChessMentor Server", 
    version="1.0.0",
    description="Simple working server for ChessMentor chess application"
)

# הגדרת CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# רישום הנתיבים - עם ובלי /api
app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(game_router.router, prefix="/api", tags=["games"])
app.include_router(websocket_router.router, tags=["websocket"])

# נתיבים נוספים בלי /api (לתאימות עם הפרונט)
app.include_router(auth_router.router, prefix="/auth", tags=["auth-compat"])
app.include_router(game_router.router, prefix="", tags=["games-compat"])

# Health check
@app.get("/")
async def root():
    return {
        "message": "ChessMentor Server is running!",
        "status": "OK",
        "endpoints": {
            "health": "/health",
            "websocket": "/ws",
            "auth": "/api/auth/",
            "games": "/api/games"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "OK", 
        "message": "ChessMentor Server Running",
        "data": {
            "users": len(mock_db.users),
            "sessions": len(mock_db.sessions),
            "active_games": len([g for g in mock_db.games.values() if g['status'] == 'active']),
            "connected_players": len(mock_db.connected_players),
            "waiting_queue": len(mock_db.waiting_queue)
        },
        "version": "1.0.0"
    }

if __name__ == "__main__":
    print("🚀 Starting ChessMentor Server...")
    print("=" * 50)
    print("🌐 Server: http://localhost:5001")
    print("🔗 WebSocket: ws://localhost:5001/ws")
    print("🏥 Health: http://localhost:5001/health")
    print("🔐 Auth: http://localhost:5001/api/auth/")
    print("🎮 Games: http://localhost:5001/api/games")
    print("=" * 50)
    print("📋 Available endpoints:")
    print("  POST /api/auth/register")
    print("  POST /api/auth/login")
    print("  POST /api/auth/guest")
    print("  POST /api/auth/openai")
    print("  POST /api/auth/logout")
    print("  POST /api/chess/coach")
    print("  GET  /api/games")
    print("  WS   /ws")
    print("=" * 50)
    print("🔥 Server starting... Press Ctrl+C to stop")
    
    try:
        uvicorn.run(
            "main:app",  # ← זה התיקון החשוב!
            host="localhost", 
            port=5001,
            log_level="info",
            reload=False  # כדי להסיר את ה-warning
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        input("Press Enter to exit...")