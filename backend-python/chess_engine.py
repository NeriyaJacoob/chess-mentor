# backend-python/chess_engine.py - SIMPLE SYNC VERSION
"""
Stockfish Chess Engine - Simplified Synchronous Version
"""

import chess
import chess.engine
import os
import time
from typing import Dict, Any

class ChessEngine:
    """מנוע שחמט מבוסס Stockfish - גרסה פשוטה"""
    
    def __init__(self, stockfish_path: str = None, skill_level: int = 5):
        self.stockfish_path = stockfish_path or self._find_stockfish()
        self.skill_level = skill_level
        self.engine = None
        self.board = chess.Board()
        self.game_history = []
        
    def _find_stockfish(self) -> str:
        """מציאת נתיב Stockfish"""
        env_path = os.getenv('STOCKFISH_PATH')
        print(f"🔍 Looking for Stockfish at: {env_path}")
        
        if env_path and os.path.exists(env_path):
            print(f"✅ Found Stockfish: {env_path}")
            return env_path
        
        # נתיבים נפוצים
        common_paths = [
            'stockfish',
            'stockfish.exe',
            '/usr/local/bin/stockfish',
            '/usr/bin/stockfish',
            'C:\\stockfish\\stockfish.exe',
        ]
        
        for path in common_paths:
            if os.path.exists(path):
                print(f"✅ Found Stockfish: {path}")
                return path
                
        raise FileNotFoundError("Stockfish not found")
    
    def start_engine(self):
        """התחלת מנוע Stockfish - גרסה סינכרונית"""
        try:
            if not self.engine:
                print(f"🚀 Starting Stockfish: {self.stockfish_path}")
                self.engine = chess.engine.SimpleEngine.popen_uci(self.stockfish_path)
                
                # הגדרת רמת המשחק
                try:
                    self.engine.configure({"Skill Level": self.skill_level})
                    print(f"✅ Stockfish started - Skill Level: {self.skill_level}")
                except:
                    print(f"⚠️ Could not set skill level, using default")
                
        except Exception as e:
            print(f"❌ Failed to start Stockfish: {e}")
            raise
    
    def stop_engine(self):
        """עצירת המנוע"""
        if self.engine:
            self.engine.quit()
            self.engine = None
            print("🔴 Stockfish stopped")
    
    def _skill_to_elo(self, skill_level: int) -> int:
        """המרת רמת skill ל-ELO משוער"""
        return 800 + (skill_level * 110)
    
    def new_game(self) -> Dict[str, Any]:
        """התחלת משחק חדש"""
        self.board = chess.Board()
        self.game_history = []
        
        return {
            "fen": self.board.fen(),
            "legal_moves": [move.uci() for move in self.board.legal_moves],
            "turn": "white",
            "status": "active",
            "move_count": 0
        }
    
    def make_move(self, move_uci: str) -> Dict[str, Any]:
        """ביצוע מהלך על הלוח"""
        try:
            move = chess.Move.from_uci(move_uci)
            
            if move not in self.board.legal_moves:
                return {
                    "success": False,
                    "error": f"Illegal move: {move_uci}",
                    "legal_moves": [m.uci() for m in self.board.legal_moves]
                }
            
            # Get SAN notation before making the move
            san_notation = self.board.san(move)
            
            # ביצוע המהלך
            self.board.push(move)
            self.game_history.append({
                "move": move_uci,
                "san": san_notation,
                "timestamp": time.time()
            })
            
            return {
                "success": True,
                "move": move_uci,
                "san": san_notation,
                "fen": self.board.fen(),
                "legal_moves": [m.uci() for m in self.board.legal_moves],
                "turn": "black" if self.board.turn == chess.BLACK else "white",
                "is_check": self.board.is_check(),
                "is_checkmate": self.board.is_checkmate(),
                "is_stalemate": self.board.is_stalemate(),
                "is_game_over": self.board.is_game_over(),
                "move_count": len(self.game_history)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Invalid move format: {move_uci}",
                "details": str(e)
            }
    
    def get_ai_move(self, time_limit: float = 1.0) -> Dict[str, Any]:
        """קבלת מהלך מהמנוע AI - גרסה סינכרונית"""
        if not self.engine:
            self.start_engine()
        
        if self.board.is_game_over():
            return {
                "success": False,
                "error": "Game is over",
                "game_result": self.get_game_result()
            }
        
        try:
            print(f"🤖 AI thinking for {time_limit}s...")
            
            # חישוב המהלך הטוב ביותר
            result = self.engine.play(
                self.board, 
                chess.engine.Limit(time=time_limit)
            )
            
            if result.move:
                # Get SAN notation before making the move
                san_notation = self.board.san(result.move)
                move_uci = result.move.uci()
                
                print(f"🤖 AI chose: {move_uci} ({san_notation})")
                
                # ביצוע המהלך
                self.board.push(result.move)
                
                self.game_history.append({
                    "move": move_uci,
                    "san": san_notation,
                    "timestamp": time.time(),
                    "is_ai": True
                })
                
                return {
                    "success": True,
                    "move": move_uci,
                    "san": san_notation,
                    "fen": self.board.fen(),
                    "legal_moves": [m.uci() for m in self.board.legal_moves],
                    "turn": "black" if self.board.turn == chess.BLACK else "white",
                    "is_check": self.board.is_check(),
                    "is_checkmate": self.board.is_checkmate(),
                    "is_stalemate": self.board.is_stalemate(),
                    "is_game_over": self.board.is_game_over(),
                    "move_count": len(self.game_history)
                }
            else:
                return {
                    "success": False,
                    "error": "Engine couldn't find a move"
                }
                
        except Exception as e:
            print(f"❌ Engine error: {e}")
            return {
                "success": False,
                "error": f"Engine error: {str(e)}"
            }
    
    def get_position_info(self) -> Dict[str, Any]:
        """מידע על המיקום הנוכחי"""
        return {
            "fen": self.board.fen(),
            "turn": "black" if self.board.turn == chess.BLACK else "white",
            "legal_moves": [move.uci() for move in self.board.legal_moves],
            "is_check": self.board.is_check(),
            "is_checkmate": self.board.is_checkmate(),
            "is_stalemate": self.board.is_stalemate(),
            "is_game_over": self.board.is_game_over(),
            "move_count": len(self.game_history),
            "history": self.game_history[-10:],
            "can_castle_kingside": self.board.has_kingside_castling_rights(self.board.turn),
            "can_castle_queenside": self.board.has_queenside_castling_rights(self.board.turn)
        }
    
    def get_game_result(self) -> str:
        """קבלת תוצאת המשחק"""
        if self.board.is_checkmate():
            winner = "black" if self.board.turn == chess.WHITE else "white"
            return f"{winner} wins by checkmate"
        elif self.board.is_stalemate():
            return "draw by stalemate"
        elif self.board.is_insufficient_material():
            return "draw by insufficient material"
        elif self.board.is_fivefold_repetition():
            return "draw by repetition"
        elif self.board.is_seventyfive_moves():
            return "draw by 75-move rule"
        else:
            return "game in progress"
    
    def set_skill_level(self, level: int):
        """עדכון רמת הקושי"""
        self.skill_level = max(0, min(20, level))
        print(f"🎯 Skill level set to: {self.skill_level} (ELO: ~{self._skill_to_elo(self.skill_level)})")
    
    def load_fen(self, fen: str) -> bool:
        """טעינת מיקום מ-FEN"""
        try:
            self.board = chess.Board(fen)
            self.game_history = []
            return True
        except Exception as e:
            print(f"❌ Invalid FEN: {e}")
            return False

# Instance גלובלי
chess_engine = ChessEngine()

# Helper functions
def init_engine(skill_level: int = 5):
    """אתחול המנוע"""
    chess_engine.set_skill_level(skill_level)
    chess_engine.start_engine()

def cleanup_engine():
    """ניקוי המנוע"""
    chess_engine.stop_engine()

def test_stockfish():
    """בדיקת Stockfish"""
    try:
        test_engine = ChessEngine()
        test_engine.start_engine()
        
        # Test a simple move
        result = test_engine.get_ai_move(1.0)
        test_engine.stop_engine()
        
        if result['success']:
            print(f"✅ Stockfish test passed: {result['move']}")
            return True
        else:
            print(f"❌ Stockfish test failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Stockfish test error: {e}")
        return False