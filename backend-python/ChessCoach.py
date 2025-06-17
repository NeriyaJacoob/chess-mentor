"""
AI coaching utilities for explaining moves and positions
"""
import chess
import chess.engine
from typing import Dict, List, Optional, Tuple
import re

class ChessCoach:
    """Provide high level analysis using Stockfish"""
    def __init__(self, engine: chess.engine.SimpleEngine):
        self.engine = engine

    def analyze_position(self, board: chess.Board, depth: int = 12) -> Dict:
        """Comprehensive position analysis"""
        if not self.engine:
            return {"error": "Engine not available"}
        
        try:
            analysis = self.engine.analyse(board, chess.engine.Limit(depth=depth))
            score = analysis['score'].white()
            
            return {
                "evaluation": score.score(mate_score=10000),
                "mate_in": score.mate() if score.is_mate() else None,
                "best_move": analysis['pv'][0].uci() if analysis['pv'] else None,
                "pv": [move.uci() for move in analysis['pv'][:5]],  # First 5 moves
                "depth": analysis.get('depth', depth),
                "nodes": analysis.get('nodes', 0),
                "time": analysis.get('time', 0)
            }
        except Exception as e:
            return {"error": f"Analysis failed: {e}"}

    def explain_move(self, board: chess.Board, player_move: chess.Move, player_elo: int = 1800) -> str:
        """Explain a player's move with evaluation and suggestions"""
        if not self.engine:
            return "Engine not available for move analysis."
        
        try:
            # Analyze position before move
            initial_analysis = self.analyze_position(board)
            initial_eval = initial_analysis.get("evaluation", 0)
            
            # Make the move and analyze
            board_copy = board.copy()
            board_copy.push(player_move)
            new_analysis = self.analyze_position(board_copy)
            new_eval = new_analysis.get("evaluation", 0)
            
            # Calculate evaluation difference
            eval_diff = new_eval - initial_eval
            
            # Get best move
            best_move_uci = initial_analysis.get("best_move")
            best_move = chess.Move.from_uci(best_move_uci) if best_move_uci else None
            
            # Generate explanation based on ELO level
            if player_elo < 1200:
                return self._beginner_explanation(player_move, eval_diff, best_move, board)
            elif player_elo < 1800:
                return self._intermediate_explanation(player_move, eval_diff, best_move, board)
            else:
                return self._advanced_explanation(player_move, eval_diff, best_move, board, initial_analysis)
        
        except Exception as e:
            return f"Move analysis failed: {e}"

    def _beginner_explanation(self, move: chess.Move, eval_diff: int, best_move: Optional[chess.Move], board: chess.Board) -> str:
        """Simple explanation for beginners"""
        if eval_diff >= 50:
            return f"Good move! {move.uci()} improves your position."
        elif eval_diff >= -50:
            return f"Decent move. {move.uci()} maintains the position."
        else:
            suggestion = f" Consider {best_move.uci()} instead." if best_move else ""
            return f"Not the best move. {move.uci()} weakens your position.{suggestion}"

    def _intermediate_explanation(self, move: chess.Move, eval_diff: int, best_move: Optional[chess.Move], board: chess.Board) -> str:
        """Detailed explanation for intermediate players"""
        eval_text = f"changes the evaluation by {eval_diff:+d} centipawns"
        
        if eval_diff >= 100:
            return f"Excellent move! {move.uci()} {eval_text} and significantly improves your position."
        elif eval_diff >= 0:
            return f"Good move. {move.uci()} {eval_text}."
        elif eval_diff >= -100:
            return f"Questionable move. {move.uci()} {eval_text}. The best move was {best_move.uci() if best_move else 'unclear'}."
        else:
            return f"Poor move! {move.uci()} {eval_text} and seriously weakens your position. Play {best_move.uci() if best_move else 'more carefully'} instead."

    def _advanced_explanation(self, move: chess.Move, eval_diff: int, best_move: Optional[chess.Move], board: chess.Board, analysis: Dict) -> str:
        """Comprehensive explanation for advanced players"""
        eval_text = f"Evaluation change: {eval_diff:+d} centipawns"
        best_line = " ".join(analysis.get("pv", [])[:3])
        
        explanation = f"Move {move.uci()}: {eval_text}. "
        
        if eval_diff >= 50:
            explanation += "Strong move! "
        elif eval_diff >= -50:
            explanation += "Acceptable move. "
        else:
            explanation += "Inaccurate move. "
        
        if best_move:
            explanation += f"Best continuation was {best_move.uci()}"
            if best_line:
                explanation += f" with the line: {best_line}"
        
        return explanation

    def find_tactical_opportunities(self, board: chess.Board) -> List[Dict]:
        """Find tactical patterns in the position"""
        opportunities = []
        
        # Check for checks, captures, and threats
        for move in board.legal_moves:
            board_copy = board.copy()
            board_copy.push(move)
            
            opportunity = {}
            
            # Check if move gives check
            if board_copy.is_check():
                opportunity["type"] = "check"
                opportunity["move"] = move.uci()
                opportunity["description"] = f"{move.uci()} gives check"
            
            # Check if move is a capture
            elif board.is_capture(move):
                opportunity["type"] = "capture"
                opportunity["move"] = move.uci()
                captured_piece = board.piece_at(move.to_square)
                opportunity["description"] = f"{move.uci()} captures {captured_piece.symbol() if captured_piece else 'piece'}"
            
            # Check for discovered attacks
            elif self._is_discovered_attack(board, move):
                opportunity["type"] = "discovered_attack"
                opportunity["move"] = move.uci()
                opportunity["description"] = f"{move.uci()} creates a discovered attack"
            
            if opportunity:
                opportunities.append(opportunity)
        
        return opportunities[:5]  # Return top 5 opportunities

    def _is_discovered_attack(self, board: chess.Board, move: chess.Move) -> bool:
        """Check if a move creates a discovered attack"""
        # Simplified check - can be expanded
        return False  # Placeholder for more complex logic

    def suggest_opening_principles(self, board: chess.Board) -> List[str]:
        """Suggest opening principles based on current position"""
        suggestions = []
        move_count = len(board.move_stack)
        
        if move_count < 10:  # Opening phase
            # Check piece development
            if not self._is_piece_developed(board, chess.WHITE, chess.KNIGHT):
                suggestions.append("Develop your knights before bishops")
            
            if not self._is_piece_developed(board, chess.WHITE, chess.BISHOP):
                suggestions.append("Develop your bishops to active squares")
            
            # Check king safety
            if not board.has_kingside_castling_rights(chess.WHITE) and not board.has_queenside_castling_rights(chess.WHITE):
                if len(board.move_stack) > 0:  # King has moved
                    suggestions.append("Consider castling for king safety")
            
            # Center control
            center_squares = [chess.E4, chess.E5, chess.D4, chess.D5]
            white_controls_center = any(board.is_attacked_by(chess.WHITE, sq) for sq in center_squares)
            if not white_controls_center:
                suggestions.append("Control the center with pawns and pieces")
        
        return suggestions

    def _is_piece_developed(self, board: chess.Board, color: chess.Color, piece_type: chess.PieceType) -> bool:
        """Check if pieces of given type are developed"""
        pieces = board.pieces(piece_type, color)
        
        if piece_type == chess.KNIGHT:
            developed_squares = {chess.F3, chess.C3} if color == chess.WHITE else {chess.F6, chess.C6}
        elif piece_type == chess.BISHOP:
            developed_squares = {chess.C4, chess.F4, chess.E2, chess.D3} if color == chess.WHITE else {chess.C5, chess.F5, chess.E7, chess.D6}
        else:
            return True
        
        return any(sq in developed_squares for sq in pieces)

    def evaluate_endgame(self, board: chess.Board) -> Dict:
        """Analyze endgame positions"""
        if not self._is_endgame(board):
            return {"message": "Not an endgame position"}
        
        analysis = {
            "phase": "endgame",
            "material_balance": self._calculate_material_balance(board),
            "king_activity": self._evaluate_king_activity(board),
            "pawn_structure": self._evaluate_pawn_structure(board)
        }
        
        return analysis

    def _is_endgame(self, board: chess.Board) -> bool:
        """Determine if position is in endgame phase"""
        piece_count = len(board.piece_map())
        return piece_count <= 10  # Simplified endgame detection

    def _calculate_material_balance(self, board: chess.Board) -> Dict:
        """Calculate material balance"""
        piece_values = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}
        
        white_material = sum(piece_values.get(board.piece_at(sq).piece_type, 0) 
                           for sq in chess.SQUARES if board.piece_at(sq) and board.piece_at(sq).color == chess.WHITE)
        black_material = sum(piece_values.get(board.piece_at(sq).piece_type, 0) 
                           for sq in chess.SQUARES if board.piece_at(sq) and board.piece_at(sq).color == chess.BLACK)
        
        return {
            "white": white_material,
            "black": black_material,
            "difference": white_material - black_material
        }

    def _evaluate_king_activity(self, board: chess.Board) -> Dict:
        """Evaluate king activity in endgame"""
        white_king = board.king(chess.WHITE)
        black_king = board.king(chess.BLACK)
        
        # King centralization (distance from center)
        center_squares = [chess.D4, chess.D5, chess.E4, chess.E5]
        
        white_centralization = min(chess.square_distance(white_king, sq) for sq in center_squares)
        black_centralization = min(chess.square_distance(black_king, sq) for sq in center_squares)
        
        return {
            "white_centralization": 4 - white_centralization,  # Lower distance = better
            "black_centralization": 4 - black_centralization,
            "king_opposition": chess.square_distance(white_king, black_king) == 2
        }

    def _evaluate_pawn_structure(self, board: chess.Board) -> Dict:
        """Analyze pawn structure"""
        white_pawns = board.pieces(chess.PAWN, chess.WHITE)
        black_pawns = board.pieces(chess.PAWN, chess.BLACK)
        
        return {
            "white_pawn_count": len(white_pawns),
            "black_pawn_count": len(black_pawns),
            "passed_pawns": self._count_passed_pawns(board),
            "isolated_pawns": self._count_isolated_pawns(board)
        }

    def _count_passed_pawns(self, board: chess.Board) -> Dict:
        """Count passed pawns for both sides"""
        # Simplified implementation
        return {"white": 0, "black": 0}

    def _count_isolated_pawns(self, board: chess.Board) -> Dict:
        """Count isolated pawns for both sides"""
        # Simplified implementation
        return {"white": 0, "black": 0}

    def get_learning_tips(self, board: chess.Board, player_elo: int) -> List[str]:
        """Get personalized learning tips based on position and player level"""
        tips = []
        
        if player_elo < 1200:
            tips.extend([
                "Focus on piece safety - avoid leaving pieces undefended",
                "Look for simple tactics like forks, pins, and skewers",
                "Complete your development before attacking"
            ])
        elif player_elo < 1800:
            tips.extend([
                "Improve your calculation - look 2-3 moves ahead",
                "Study common endgame patterns",
                "Work on pawn structure understanding"
            ])
        else:
            tips.extend([
                "Focus on positional understanding and strategic planning",
                "Study master games in your opening repertoire",
                "Analyze your games with computer assistance"
            ])
        
        # Add position-specific tips
        if len(board.move_stack) < 10:
            tips.append("In the opening: Develop pieces, control center, ensure king safety")
        elif self._is_endgame(board):
            tips.append("In the endgame: Activate your king, create passed pawns, calculate precisely")
        
        return tips[:3]  # Return top 3 tips
