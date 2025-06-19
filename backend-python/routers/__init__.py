# backend-python/routers/__init__.py
# Make routers available for import

from . import auth_router
from . import game_router  
from . import websocket_router
from . import chess_api

__all__ = ['auth_router', 'game_router', 'websocket_router', 'chess_api']