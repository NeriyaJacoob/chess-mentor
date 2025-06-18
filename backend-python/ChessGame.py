"""
Game logic wrapper around python-chess and Stockfish
"""
import chess
import chess.engine
import time
from typing import Optional, List, Dict
import sys
import io
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
        
        # Initialize Stockfish
        try:
            self.engine = chess.engine.SimpleEngine.popen_uci(stockfish_path)
            self.engine.configure({
                "UCI_LimitStrength": True, 
                "UCI_Elo": elo_level,
                "Threads": 1,
                "Hash": 16
            })
            print(f" Stockfish initialized with ELO {elo_level}")
        except (FileNotFoundError, RuntimeError) as e:
            print(f"❌ Stockfish error: {e}")
            self.engine = None

    def player_move(self, move_uci: str) -> bool:
        """Execute a player move if legal.

        Steps:
        1. Convert UCI string to a Move object and verify legality.
        2. Push the move on the board and record timestamp.
        3. Optionally query Stockfish for evaluation after the move.
        4. Return True if the move was applied.
        """
        try:
            move = chess.Move.from_uci(move_uci)
            if move in self.board.legal_moves:
                move_time = time.time()
                self.board.push(move)
                self.history.append(move)
                self.move_times.append(move_time)
                
                # Store evaluation if engine available
                if self.engine:
                    try:
                        analysis = self.engine.analyse(self.board, chess.engine.Limit(depth=8))
                        eval_score = analysis['score'].white().score(mate_score=10000)
                        self.evaluations.append(eval_score)
                    except:
                        self.evaluations.append(0)
                else:
                    self.evaluations.append(0)
                
                return True
            return False
        except ValueError:
            return False

    def computer_move(self, thinking_time: float = 0.5) -> Optional[chess.Move]:
        """Let Stockfish play a move.

        The engine is given a time limit, then the returned move is
        pushed to the board and recorded in the history along with an
        evaluation of the resulting position.
        Returns the move object or ``None`` if no engine is available.
        """
        if not self.engine or self.board.is_game_over():
            return None
        
        try:
            result = self.engine.play(self.board, chess.engine.Limit(time=thinking_time))
            move_time = time.time()
            
            self.board.push(result.move)
            self.history.append(result.move)
            self.move_times.append(move_time)
            
            # Store evaluation
            try:
                analysis = self.engine.analyse(self.board, chess.engine.Limit(depth=8))
                eval_score = analysis['score'].white().score(mate_score=10000)
                self.evaluations.append(eval_score)
            except:
                self.evaluations.append(0)
            
            return result.move
        except Exception as e:
            print(f"❌ Computer move error: {e}")
            return None

    def get_best_move(self, depth: int = 8) -> Optional[chess.Move]:
        """Get the best move according to Stockfish"""
        if not self.engine or self.board.is_game_over():
            return None
        
        try:
            analysis = self.engine.analyse(self.board, chess.engine.Limit(depth=depth))
            return analysis['pv'][0] if analysis['pv'] else None
        except:
            return None

    def evaluate_position(self, depth: int = 8) -> Optional[int]:
        """Get position evaluation in centipawns"""
        if not self.engine:
            return None
        
        try:
            analysis = self.engine.analyse(self.board, chess.engine.Limit(depth=depth))
            return analysis['score'].white().score(mate_score=10000)
        except:
            return None

    def get_legal_moves(self) -> List[str]:
        """Get all legal moves in UCI format"""
        return [move.uci() for move in self.board.legal_moves]

    def get_position_info(self) -> Dict:
        """Get comprehensive position information"""
        return {
            'fen': self.board.fen(),
            'turn': 'white' if self.board.turn == chess.WHITE else 'black',
            'legal_moves': self.get_legal_moves(),
            'move_count': len(self.history),
            'is_check': self.board.is_check(),
            'is_checkmate': self.board.is_checkmate(),
            'is_stalemate': self.board.is_stalemate(),
            'is_game_over': self.board.is_game_over(),
            'evaluation': self.evaluate_position(),
            'best_move': self.get_best_move().uci() if self.get_best_move() else None
        }

    def get_game_pgn(self) -> str:
        """Get game in PGN format"""
        import io
        
        game = chess.pgn.Game()
        game.headers["Event"] = "ChessMentor Game"
        game.headers["Date"] = time.strftime("%Y.%m.%d")
        game.headers["White"] = self.white_player or "Player"
        game.headers["Black"] = self.black_player or "AI"
        
        node = game
        board = chess.Board()
        
        for move in self.history:
            node = node.add_variation(move)
            board.push(move)
        
        game.headers["Result"] = board.result()
        
        exporter = chess.pgn.StringExporter(headers=True, variations=True, comments=True)
        return game.accept(exporter)

    def undo_move(self) -> bool:
        """Undo the last move"""
        if len(self.history) > 0:
            self.board.pop()
            self.history.pop()
            if self.move_times:
                self.move_times.pop()
            if self.evaluations:
                self.evaluations.pop()
            return True
        return False

    def is_game_over(self) -> bool:
        return self.board.is_game_over()

    def get_board(self) -> chess.Board:
        return self.board

    def get_result(self) -> str:
        """Get game result"""
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

    def reset_game(self):
        """Reset the game"""
        self.board.reset()
        self.history.clear()
        self.move_times.clear()
        self.evaluations.clear()
        self.game_start_time = time.time()

    def close(self):
        """Close Stockfish engine"""
        if self.engine:
            try:
                self.engine.quit()
                print(" Stockfish engine closed")
            except:
                pass
            self.engine = None

    def __del__(self):
        """Destructor to ensure engine is closed"""
        self.close()
