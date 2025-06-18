# backend-python/ChessGame.py - גרסה מתוקנת
"""
Game logic wrapper around python-chess and Stockfish - Fixed Version
"""
import chess
import chess.engine
import time
from typing import Optional, List, Dict
import sys
import io

# תיקון encoding ל-Windows
if sys.platform.startswith('win'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class ChessGame:
    """Manage a single chess match and interface with Stockfish"""
    
    def __init__(self, stockfish_path: str, elo_level: int = 1500):
        self.board = chess.Board()
        self.history: List[chess.Move] = []
        self.move_times: List[float] = []
        self.evaluations: List[int] = []
        self.game_id: Optional[str] = None
        self.white_player: Optional[str] = None
        self.black_player: Optional[str] = None
        self.game_start_time = time.time()
        self.engine = None
        
        # Initialize Stockfish with error handling
        if stockfish_path:
            self._init_stockfish(stockfish_path, elo_level)

    def _init_stockfish(self, stockfish_path: str, elo_level: int):
        """Initialize Stockfish engine with proper error handling"""
        try:
            self.engine = chess.engine.SimpleEngine.popen_uci(stockfish_path)
            
            # Configure engine settings
            self.engine.configure({
                "UCI_LimitStrength": True, 
                "UCI_Elo": max(800, min(3000, elo_level)),  # Clamp ELO to valid range
                "Threads": 1,
                "Hash": 16,
                "Skill Level": self._elo_to_skill_level(elo_level)
            })
            
            print(f"✅ Stockfish initialized with ELO {elo_level}")
            
        except FileNotFoundError:
            print(f"❌ Stockfish not found at: {stockfish_path}")
            print("   Please install Stockfish or check the path")
            self.engine = None
        except chess.engine.EngineTerminatedError:
            print(f"❌ Stockfish failed to start at: {stockfish_path}")
            self.engine = None
        except Exception as e:
            print(f"❌ Stockfish initialization error: {e}")
            self.engine = None

    def _elo_to_skill_level(self, elo: int) -> int:
        """Convert ELO rating to Stockfish skill level (0-20)"""
        if elo <= 800:
            return 0
        elif elo <= 1000:
            return 2
        elif elo <= 1200:
            return 5
        elif elo <= 1400:
            return 8
        elif elo <= 1600:
            return 12
        elif elo <= 1800:
            return 15
        elif elo <= 2000:
            return 17
        else:
            return 20

    def player_move(self, move_uci: str) -> bool:
        """Execute a player move if legal"""
        try:
            move = chess.Move.from_uci(move_uci)
            
            if move in self.board.legal_moves:
                move_time = time.time()
                self.board.push(move)
                self.history.append(move)
                self.move_times.append(move_time)
                
                # Store evaluation if engine available
                evaluation = self._get_current_evaluation()
                self.evaluations.append(evaluation)
                
                return True
            else:
                print(f"❌ Illegal move attempted: {move_uci}")
                return False
                
        except ValueError as e:
            print(f"❌ Invalid move format: {move_uci} - {e}")
            return False
        except Exception as e:
            print(f"❌ Move error: {e}")
            return False

    def computer_move(self, thinking_time: float = 1.0) -> Optional[chess.Move]:
        """Let Stockfish play a move"""
        if not self.engine or self.board.is_game_over():
            return self._get_random_move()
        
        try:
            # Set thinking time between 0.1 and 5.0 seconds
            thinking_time = max(0.1, min(5.0, thinking_time))
            
            result = self.engine.play(self.board, chess.engine.Limit(time=thinking_time))
            move_time = time.time()
            
            if result.move and result.move in self.board.legal_moves:
                self.board.push(result.move)
                self.history.append(result.move)
                self.move_times.append(move_time)
                
                # Store evaluation
                evaluation = self._get_current_evaluation()
                self.evaluations.append(evaluation)
                
                return result.move
            else:
                print("❌ Engine returned invalid move, using random")
                return self._get_random_move()
                
        except chess.engine.EngineTerminatedError:
            print("❌ Engine terminated, using random move")
            self.engine = None
            return self._get_random_move()
        except Exception as e:
            print(f"❌ Computer move error: {e}")
            return self._get_random_move()

    def _get_random_move(self) -> Optional[chess.Move]:
        """Get a random legal move as fallback"""
        try:
            legal_moves = list(self.board.legal_moves)
            if legal_moves:
                import random
                move = random.choice(legal_moves)
                
                move_time = time.time()
                self.board.push(move)
                self.history.append(move)
                self.move_times.append(move_time)
                self.evaluations.append(0)  # No evaluation for random moves
                
                return move
            return None
        except Exception as e:
            print(f"❌ Random move error: {e}")
            return None

    def _get_current_evaluation(self) -> int:
        """Get current position evaluation"""
        if not self.engine:
            return 0
        
        try:
            analysis = self.engine.analyse(self.board, chess.engine.Limit(depth=8, time=0.5))
            score = analysis['score'].white()
            return score.score(mate_score=10000) or 0
        except:
            return 0

    def get_best_move(self, depth: int = 10) -> Optional[chess.Move]:
        """Get the best move according to Stockfish"""
        if not self.engine or self.board.is_game_over():
            return None
        
        try:
            analysis = self.engine.analyse(self.board, chess.engine.Limit(depth=depth, time=2.0))
            if analysis.get('pv') and len(analysis['pv']) > 0:
                return analysis['pv'][0]
            return None
        except Exception as e:
            print(f"❌ Best move analysis error: {e}")
            return None

    def evaluate_position(self, depth: int = 10) -> Optional[int]:
        """Get position evaluation in centipawns"""
        if not self.engine:
            return None
        
        try:
            analysis = self.engine.analyse(self.board, chess.engine.Limit(depth=depth, time=1.0))
            score = analysis['score'].white()
            return score.score(mate_score=10000)
        except Exception as e:
            print(f"❌ Position evaluation error: {e}")
            return None

    def get_legal_moves(self) -> List[str]:
        """Get all legal moves in UCI format"""
        try:
            return [move.uci() for move in self.board.legal_moves]
        except Exception as e:
            print(f"❌ Legal moves error: {e}")
            return []

    def get_position_info(self) -> Dict:
        """Get comprehensive position information"""
        try:
            legal_moves = self.get_legal_moves()
            evaluation = self.evaluate_position() if self.engine else None
            best_move = self.get_best_move() if self.engine else None
            
            return {
                'fen': self.board.fen(),
                'turn': 'white' if self.board.turn == chess.WHITE else 'black',
                'legal_moves': legal_moves,
                'move_count': len(self.history),
                'is_check': self.board.is_check(),
                'is_checkmate': self.board.is_checkmate(),
                'is_stalemate': self.board.is_stalemate(),
                'is_game_over': self.board.is_game_over(),
                'evaluation': evaluation,
                'best_move': best_move.uci() if best_move else None,
                'engine_available': self.engine is not None
            }
        except Exception as e:
            print(f"❌ Position info error: {e}")
            return {
                'fen': self.board.fen(),
                'turn': 'white' if self.board.turn == chess.WHITE else 'black',
                'legal_moves': [],
                'move_count': len(self.history),
                'is_check': False,
                'is_checkmate': False,
                'is_stalemate': False,
                'is_game_over': False,
                'evaluation': None,
                'best_move': None,
                'engine_available': False
            }

    def get_game_pgn(self) -> str:
        """Get game in PGN format"""
        try:
            game = chess.pgn.Game()
            game.headers["Event"] = "ChessMentor Game"
            game.headers["Date"] = time.strftime("%Y.%m.%d")
            game.headers["White"] = self.white_player or "Player"
            game.headers["Black"] = self.black_player or "AI"
            
            node = game
            board = chess.Board()
            
            for move in self.history:
                try:
                    if move in board.legal_moves:
                        node = node.add_variation(move)
                        board.push(move)
                    else:
                        print(f"❌ Invalid move in history: {move}")
                        break
                except Exception as e:
                    print(f"❌ PGN move error: {e}")
                    break
            
            game.headers["Result"] = board.result()
            
            exporter = chess.pgn.StringExporter(headers=True, variations=False, comments=False)
            return game.accept(exporter)
            
        except Exception as e:
            print(f"❌ PGN generation error: {e}")
            return f"[Event \"ChessMentor Game\"]\n[Result \"*\"]\n\n*"

    def undo_move(self) -> bool:
        """Undo the last move"""
        try:
            if len(self.history) > 0:
                self.board.pop()
                self.history.pop()
                if self.move_times:
                    self.move_times.pop()
                if self.evaluations:
                    self.evaluations.pop()
                return True
            return False
        except Exception as e:
            print(f"❌ Undo move error: {e}")
            return False

    def is_game_over(self) -> bool:
        """Check if game is over"""
        try:
            return self.board.is_game_over()
        except Exception as e:
            print(f"❌ Game over check error: {e}")
            return False

    def get_board(self) -> chess.Board:
        """Get the current board state"""
        return self.board

    def get_result(self) -> str:
        """Get game result"""
        try:
            if self.board.is_checkmate():
                winner = "Black" if self.board.turn == chess.WHITE else "White"
                return f"{winner} wins by checkmate"
            elif self.board.is_stalemate():
                return "Draw by stalemate"
            elif self.board.is_insufficient_material():
                return "Draw by insufficient material"
            elif self.board.is_seventyfive_moves():
                return "Draw by 75-move rule"
            elif self.board.is_fivefold_repetition():
                return "Draw by repetition"
            else:
                return "Game in progress"
        except Exception as e:
            print(f"❌ Result check error: {e}")
            return "Unknown result"

    def reset_game(self):
        """Reset the game to starting position"""
        try:
            self.board.reset()
            self.history.clear()
            self.move_times.clear()
            self.evaluations.clear()
            self.game_start_time = time.time()
            print("✅ Game reset successfully")
        except Exception as e:
            print(f"❌ Game reset error: {e}")

    def set_position(self, fen: str) -> bool:
        """Set board position from FEN string"""
        try:
            self.board.set_fen(fen)
            # Clear history when setting new position
            self.history.clear()
            self.move_times.clear()
            self.evaluations.clear()
            return True
        except Exception as e:
            print(f"❌ Set position error: {e}")
            return False

    def close(self):
        """Close Stockfish engine and cleanup"""
        if self.engine:
            try:
                self.engine.quit()
                print("✅ Stockfish engine closed")
            except Exception as e:
                print(f"❌ Engine close error: {e}")
            finally:
                self.engine = None

    def __del__(self):
        """Destructor to ensure engine is closed"""
        try:
            self.close()
        except:
            pass

    # Utility methods for advanced features
    def get_game_statistics(self) -> Dict:
        """Get detailed game statistics"""
        try:
            total_time = time.time() - self.game_start_time
            avg_move_time = sum(self.move_times[-10:]) / min(10, len(self.move_times)) if self.move_times else 0
            
            return {
                'total_moves': len(self.history),
                'total_time': total_time,
                'average_move_time': avg_move_time,
                'engine_evaluations': len([e for e in self.evaluations if e != 0]),
                'game_phase': self._determine_game_phase(),
                'material_balance': self._calculate_material_balance()
            }
        except Exception as e:
            print(f"❌ Statistics error: {e}")
            return {}

    def _determine_game_phase(self) -> str:
        """Determine current game phase"""
        try:
            move_count = len(self.history)
            piece_count = len(self.board.piece_map())
            
            if move_count < 10:
                return "opening"
            elif piece_count <= 10:
                return "endgame"
            else:
                return "middlegame"
        except:
            return "unknown"

    def _calculate_material_balance(self) -> Dict:
        """Calculate material balance"""
        try:
            piece_values = {
                chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, 
                chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0
            }
            
            white_material = 0
            black_material = 0
            
            for square in chess.SQUARES:
                piece = self.board.piece_at(square)
                if piece:
                    value = piece_values.get(piece.piece_type, 0)
                    if piece.color == chess.WHITE:
                        white_material += value
                    else:
                        black_material += value
            
            return {
                'white': white_material,
                'black': black_material,
                'difference': white_material - black_material
            }
        except Exception as e:
            print(f"❌ Material balance error: {e}")
            return {'white': 0, 'black': 0, 'difference': 0}