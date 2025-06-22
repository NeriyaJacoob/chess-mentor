# backend-python/routers/__init__.py
"""
Router modules for the ChessMentor backend
"""

# יבוא הנתיבים אם הם קיימים
try:
    from .game_router import router as game_router
except ImportError:
    print("⚠️ game_router not found")
    from fastapi import APIRouter
    game_router = APIRouter()

try:
    from .websocket_router import router as websocket_router
except ImportError:
    print("⚠️ websocket_router not found")
    from fastapi import APIRouter
    websocket_router = APIRouter()

__all__ = ['game_router', 'websocket_router']