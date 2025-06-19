# backend-python/ChessCoach.py - גרסה מתוקנת
"""
AI coaching utilities for explaining moves and positions - Fixed Version
"""
import chess
import chess.engine
from typing import Dict, List, Optional, Tuple
import re
import time

class ChessCoach:
    """Provide high level analysis using Stockfish"""
    
    def __init__(self, engine: Optional[chess.engine.SimpleEngine]):
        self.engine = engine
        self.analysis_cache = {}  # Cache for expensive operations

    def analyze_position(self, board: chess.Board, depth: int = 12) -> Dict:
        """Comprehensive position analysis with error handling"""
        if not self.engine:
            return self._basic_position_analysis(board)
        
        try:
            # Use cache key to avoid repeated analysis
            cache_key = f"{board.fen()}_{depth}"
            if cache_key in self.analysis_cache:
                return self.analysis_cache[cache_key]
            
            # Limit analysis time to prevent hanging
            analysis = self.engine.analyse(
                board, 
                chess.engine.Limit(depth=min(depth, 15), time=2.0)
            )
            
            score = analysis['score'].white()
            pv = analysis.get('pv', [])
            
            result = {
                "evaluation": score.score(mate_score=10000) if score.score() is not None else 0,
                "mate_in": score.mate() if score.is_mate() else None,
                "best_move": pv[0].uci() if pv else None,
                "pv": [move.uci() for move in pv[:5]],
                "depth": analysis.get('depth', depth),
                "nodes": analysis.get('nodes', 0),
                "time": analysis.get('time', 0),
                "engine_available": True
            }
            
            # Cache the result
            self.analysis_cache[cache_key] = result
            return result
            
        except chess.engine.EngineTerminatedError:
            print("❌ Engine terminated during analysis")
            self.engine = None
            return self._basic_position_analysis(board)
        except Exception as e:
            print(f"❌ Analysis failed: {e}")
            return self._basic_position_analysis(board)

    def _basic_position_analysis(self, board: chess.Board) -> Dict:
        """Basic analysis without engine"""
        return {
            "evaluation": 0,
            "mate_in": None,
            "best_move": None,
            "pv": [],
            "depth": 0,
            "nodes": 0,
            "time": 0,
            "engine_available": False,
            "basic_info": self._get_basic_position_info(board)
        }

    def _get_basic_position_info(self, board: chess.Board) -> Dict:
        """Get basic position information without engine"""
        try:
            legal_moves = list(board.legal_moves)
            return {
                "legal_moves_count": len(legal_moves),
                "is_check": board.is_check(),
                "is_checkmate": board.is_checkmate(),
                "is_stalemate": board.is_stalemate(),
                "material_balance": self._calculate_material_balance(board),
                "piece_count": len(board.piece_map())
            }
        except Exception as e:
            print(f"❌ Basic info error: {e}")
            return {}

    def explain_move(self, board: chess.Board, player_move: chess.Move, player_elo: int = 1800) -> str:
        """Explain a player's move with evaluation and suggestions"""
        try:
            if not player_move or player_move not in board.legal_moves:
                return "מהלך לא חוקי."
            
            # Basic move description
            move_description = self._describe_move(board, player_move)
            
            if not self.engine:
                return f"{move_description} (ללא ניתוח מנוע)"
            
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
            explanation = self._generate_explanation(
                player_move, eval_diff, best_move, board, 
                player_elo, move_description, initial_analysis
            )
            
            return explanation
            
        except Exception as e:
            print(f"❌ Move explanation error: {e}")
            return f"שגיאה בניתוח המהלך: {str(e)}"

    def _describe_move(self, board: chess.Board, move: chess.Move) -> str:
        """Describe the move in chess notation"""
        try:
            san = board.san(move)
            
            description = f"המהלך {san}"
            
            # Add basic move characteristics
            if board.is_capture(move):
                description += " (לוקח)"
            if board.gives_check(move):
                description += " (שח)"
            if move.promotion:
                piece_names = {
                    chess.QUEEN: "מלכה", chess.ROOK: "צריח", 
                    chess.BISHOP: "רץ", chess.KNIGHT: "סוס"
                }
                description += f" (הכתרה ל{piece_names.get(move.promotion, 'כלי')})"
            
            return description
            
        except Exception as e:
            return f"המהלך {move.uci()}"

    def _generate_explanation(self, move: chess.Move, eval_diff: int, best_move: Optional[chess.Move], 
                            board: chess.Board, player_elo: int, move_description: str, 
                            analysis: Dict) -> str:
        """Generate explanation based on player level"""
        try:
            if player_elo < 1200:
                return self._beginner_explanation(move, eval_diff, best_move, move_description)
            elif player_elo < 1800:
                return self._intermediate_explanation(move, eval_diff, best_move, move_description, analysis)
            else:
                return self._advanced_explanation(move, eval_diff, best_move, move_description, analysis, board)
        except Exception as e:
            return f"{move_description}. שגיאה בניתוח מפורט."

    def _beginner_explanation(self, move: chess.Move, eval_diff: int, best_move: Optional[chess.Move], move_description: str) -> str:
        """Simple explanation for beginners"""
        try:
            explanation = move_description
            
            if eval_diff >= 50:
                explanation += " - מהלך טוב! משפר את המיקום שלך."
            elif eval_diff >= -50:
                explanation += " - מהלך סביר, שומר על המיקום."
            else:
                explanation += " - לא המהלך הטוב ביותר. מחליש את המיקום."
                if best_move:
                    explanation += f" כדאי לשקול {best_move.uci()}."
            
            return explanation
        except:
            return move_description

    def _intermediate_explanation(self, move: chess.Move, eval_diff: int, best_move: Optional[chess.Move], 
                                move_description: str, analysis: Dict) -> str:
        """Detailed explanation for intermediate players"""
        try:
            explanation = f"{move_description}. "
            
            eval_text = f"משנה את ההערכה ב-{eval_diff:+d} נקודות מאה"
            
            if eval_diff >= 100:
                explanation += f"מהלך מצוין! {eval_text} ומשפר משמעותית את המיקום."
            elif eval_diff >= 0:
                explanation += f"מהלך טוב. {eval_text}."
            elif eval_diff >= -100:
                explanation += f"מהלך מפוקפק. {eval_text}."
                if best_move:
                    explanation += f" המהלך הטוב ביותר היה {best_move.uci()}."
            else:
                explanation += f"מהלך גרוע! {eval_diff} ומחליש מאוד את המיקום."
                if best_move:
                    explanation += f" עדיף לשחק {best_move.uci()}."
            
            return explanation
        except:
            return move_description

    def _advanced_explanation(self, move: chess.Move, eval_diff: int, best_move: Optional[chess.Move], 
                            move_description: str, analysis: Dict, board: chess.Board) -> str:
        """Comprehensive explanation for advanced players"""
        try:
            explanation = f"{move_description}. "
            
            eval_text = f"שינוי הערכה: {eval_diff:+d} נקודות מאה"
            best_line = " ".join(analysis.get("pv", [])[:3])
            
            if eval_diff >= 50:
                explanation += "מהלך חזק! "
            elif eval_diff >= -50:
                explanation += "מהלך מקובל. "
            else:
                explanation += "מהלך לא מדויק. "
            
            explanation += eval_text + ". "
            
            if best_move:
                explanation += f"ההמשך הטוב ביותר היה {best_move.uci()}"
                if best_line:
                    explanation += f" עם הרצף: {best_line}"
            
            # Add tactical/positional insights
            tactical_note = self._get_tactical_insight(board, move)
            if tactical_note:
                explanation += f". {tactical_note}"
            
            return explanation
        except:
            return f"{move_description}. {eval_diff:+d} נקודות מאה."

    def _get_tactical_insight(self, board: chess.Board, move: chess.Move) -> str:
        """Get tactical insights about the move"""
        try:
            insights = []
            
            if board.is_capture(move):
                insights.append("לוקח חומר")
            
            if board.gives_check(move):
                insights.append("נותן שח")
            
            # Check for piece development
            piece = board.piece_at(move.from_square)
            if piece and piece.piece_type in [chess.KNIGHT, chess.BISHOP]:
                from_rank = chess.square_rank(move.from_square)
                to_rank = chess.square_rank(move.to_square)
                
                if piece.color == chess.WHITE and to_rank > from_rank:
                    insights.append("מפתח כלי")
                elif piece.color == chess.BLACK and to_rank < from_rank:
                    insights.append("מפתח כלי")
            
            return ", ".join(insights) if insights else ""
        except:
            return ""

    def find_tactical_opportunities(self, board: chess.Board) -> List[Dict]:
        """Find tactical patterns in the position"""
        if not board:
            return []
        
        try:
            opportunities = []
            
            # Check for checks, captures, and threats
            for move in list(board.legal_moves)[:20]:  # Limit to prevent long analysis
                try:
                    opportunity = {}
                    
                    # Check if move gives check
                    if board.gives_check(move):
                        opportunity = {
                            "type": "check",
                            "move": move.uci(),
                            "description": f"{move.uci()} נותן שח"
                        }
                    
                    # Check if move is a capture
                    elif board.is_capture(move):
                        captured_piece = board.piece_at(move.to_square)
                        opportunity = {
                            "type": "capture",
                            "move": move.uci(),
                            "description": f"{move.uci()} לוקח {captured_piece.symbol() if captured_piece else 'כלי'}"
                        }
                    
                    if opportunity:
                        opportunities.append(opportunity)
                        
                except Exception:
                    continue
            
            return opportunities[:5]  # Return top 5 opportunities
            
        except Exception as e:
            print(f"❌ Tactical opportunities error: {e}")
            return []

    def suggest_opening_principles(self, board: chess.Board) -> List[str]:
        """Suggest opening principles based on current position"""
        try:
            suggestions = []
            move_count = len(board.move_stack)
            
            if move_count < 10:  # Opening phase
                # Check piece development
                if not self._is_piece_developed(board, chess.WHITE, chess.KNIGHT):
                    suggestions.append("פתח את הסוסים לפני הרצים")
                
                if not self._is_piece_developed(board, chess.WHITE, chess.BISHOP):
                    suggestions.append("פתח את הרצים למשבצות פעילות")
                
                # Check king safety
                if board.has_kingside_castling_rights(chess.WHITE) or board.has_queenside_castling_rights(chess.WHITE):
                    suggestions.append("שקול הצרחה לביטחון המלך")
                
                # Center control
                center_squares = [chess.E4, chess.E5, chess.D4, chess.D5]
                white_controls_center = any(board.is_attacked_by(chess.WHITE, sq) for sq in center_squares)
                if not white_controls_center:
                    suggestions.append("שלוט במרכז עם רגלים וכלים")
            
            return suggestions[:3]  # Limit to 3 suggestions
            
        except Exception as e:
            print(f"❌ Opening principles error: {e}")
            return ["התמקד בפיתוח כלים ובטיחות המלך"]

    def _is_piece_developed(self, board: chess.Board, color: chess.Color, piece_type: chess.PieceType) -> bool:
        """Check if pieces of given type are developed"""
        try:
            pieces = board.pieces(piece_type, color)
            
            if piece_type == chess.KNIGHT:
                developed_squares = {chess.F3, chess.C3} if color == chess.WHITE else {chess.F6, chess.C6}
            elif piece_type == chess.BISHOP:
                developed_squares = {chess.C4, chess.F4, chess.E2, chess.D3} if color == chess.WHITE else {chess.C5, chess.F5, chess.E7, chess.D6}
            else:
                return True
            
            return any(sq in developed_squares for sq in pieces)
        except:
            return True

    def _calculate_material_balance(self, board: chess.Board) -> Dict:
        """Calculate material balance"""
        try:
            piece_values = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}
            
            white_material = 0
            black_material = 0
            
            for square in chess.SQUARES:
                piece = board.piece_at(square)
                if piece and piece.piece_type != chess.KING:
                    value = piece_values.get(piece.piece_type, 0)
                    if piece.color == chess.WHITE:
                        white_material += value
                    else:
                        black_material += value
            
            return {
                "white": white_material,
                "black": black_material,
                "difference": white_material - black_material
            }
        except Exception as e:
            print(f"❌ Material balance error: {e}")
            return {"white": 0, "black": 0, "difference": 0}

    def get_learning_tips(self, board: chess.Board, player_elo: int) -> List[str]:
        """Get personalized learning tips based on position and player level"""
        try:
            tips = []
            
            if player_elo < 1200:
                tips.extend([
                    "התמקד בבטיחות הכלים - הימנע מהשארת כלים לא מוגנים",
                    "חפש טקטיקות פשוטות כמו מזלג, נעיצה וחיטוף",
                    "השלם את הפיתוח לפני התקפה"
                ])
            elif player_elo < 1800:
                tips.extend([
                    "שפר את החישוב - הסתכל 2-3 מהלכים קדימה",
                    "למד דפוסי סיום נפוצים",
                    "עבוד על הבנת מבנה הרגלים"
                ])
            else:
                tips.extend([
                    "התמקד בהבנה מיקומית ותכנון אסטרטגי",
                    "למד משחקי מאסטרים בפתיחות שלך",
                    "נתח את המשחקים שלך עם עזרת מחשב"
                ])
            
            # Add position-specific tips
            move_count = len(board.move_stack)
            if move_count < 10:
                tips.append("בפתיחה: פתח כלים, שלוט במרכז, דאג לביטחון המלך")
            elif self._is_endgame(board):
                tips.append("בסיום: הפעל את המלך, צור רגלים עוברים, חשב בדיוק")
            
            return tips[:3]  # Return top 3 tips
        except Exception as e:
            print(f"❌ Learning tips error: {e}")
            return ["התמקד בטקטיקות בסיסיות ובטיחות כלים"]

    def _is_endgame(self, board: chess.Board) -> bool:
        """Determine if position is in endgame phase"""
        try:
            piece_count = len(board.piece_map())
            return piece_count <= 10  # Simplified endgame detection
        except:
            return False

    def clear_cache(self):
        """Clear analysis cache"""
        self.analysis_cache.clear()

    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        return {
            "cache_size": len(self.analysis_cache),
            "engine_available": self.engine is not None
        }