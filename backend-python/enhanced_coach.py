# backend-python/enhanced_coach.py
"""
מאמן שחמט משולב: סטוקפיש + GPT
מערכת מתקדמת לניתוח משחקים והדרכה
"""

import chess
import chess.engine
import chess.pgn
from typing import Dict, List, Optional, Tuple, Any
import time
import json
from datetime import datetime

class EnhancedChessCoach:
    """מאמן שחמט משולב עם סטוקפיש ו-GPT"""
    
    def __init__(self, stockfish_path: str, openai_client=None):
        self.stockfish_path = stockfish_path
        self.openai_client = openai_client
        self.engine = None
        self.analysis_cache = {}
        self.game_analysis_history = []
        
        # התחל מנוע סטוקפיש
        self._init_stockfish()
    
    def _init_stockfish(self):
        """אתחול מנוע סטוקפיש"""
        if not self.stockfish_path:
            print("⚠️ No Stockfish path provided")
            return
            
        try:
            self.engine = chess.engine.SimpleEngine.popen_uci(self.stockfish_path)
            self.engine.configure({
                "Threads": 2,
                "Hash": 128,
                "Skill Level": 20,  # מקסימום חוזק
                "UCI_AnalyseMode": True
            })
            print("✅ Enhanced Stockfish coach initialized")
        except Exception as e:
            print(f"❌ Stockfish initialization failed: {e}")
            self.engine = None
    
    def analyze_position_deep(self, board: chess.Board, depth: int = 18, time_limit: float = 3.0) -> Dict:
        """ניתוח עמוק של מיקום עם סטוקפיש"""
        if not self.engine:
            return self._basic_analysis(board)
        
        try:
            # ניתוח עמוק
            info = self.engine.analyse(
                board, 
                chess.engine.Limit(depth=depth, time=time_limit),
                multipv=3  # 3 מהלכים הטובים ביותר
            )
            
            analysis = {
                "timestamp": datetime.now().isoformat(),
                "position_fen": board.fen(),
                "to_move": "white" if board.turn else "black",
                "move_number": board.fullmove_number,
                "engine_depth": info.get('depth', depth),
                "nodes_searched": info.get('nodes', 0),
                "analysis_time": info.get('time', time_limit),
                "evaluation": self._parse_evaluation(info['score']),
                "best_moves": [],
                "position_features": self._analyze_position_features(board),
                "tactical_motifs": self._find_tactical_motifs(board),
                "strategic_themes": self._identify_strategic_themes(board)
            }
            
            # מהלכים טובים ביותר
            try:
                multipv_info = self.engine.analyse(
                    board, 
                    chess.engine.Limit(depth=depth-2, time=time_limit/2),
                    multipv=5
                )
                
                for i, info_line in enumerate(multipv_info if isinstance(multipv_info, list) else [multipv_info]):
                    if 'pv' in info_line and info_line['pv']:
                        move = info_line['pv'][0]
                        analysis["best_moves"].append({
                            "rank": i + 1,
                            "move": move.uci(),
                            "san": board.san(move),
                            "evaluation": self._parse_evaluation(info_line['score']),
                            "line": [m.uci() for m in info_line['pv'][:4]]
                        })
            except:
                # fallback למהלך יחיד
                if 'pv' in info and info['pv']:
                    move = info['pv'][0]
                    analysis["best_moves"].append({
                        "rank": 1,
                        "move": move.uci(),
                        "san": board.san(move),
                        "evaluation": analysis["evaluation"],
                        "line": [m.uci() for m in info['pv'][:4]]
                    })
            
            return analysis
            
        except Exception as e:
            print(f"❌ Deep analysis failed: {e}")
            return self._basic_analysis(board)
    
    def analyze_move_quality(self, board_before: chess.Board, move: chess.Move, depth: int = 15) -> Dict:
        """ניתוח איכות מהלך ספציפי"""
        if not self.engine:
            return {"error": "Engine not available"}
        
        try:
            # ניתוח לפני המהלך
            analysis_before = self.analyze_position_deep(board_before, depth=depth-3, time_limit=2.0)
            
            # ביצוע המהלך
            board_after = board_before.copy()
            board_after.push(move)
            
            # ניתוח אחרי המהלך (מנקודת מבט היריב)
            analysis_after = self.analyze_position_deep(board_after, depth=depth-3, time_limit=2.0)
            
            # חישוב איכות המהלך
            eval_before = analysis_before["evaluation"]["centipawns"]
            eval_after = -analysis_after["evaluation"]["centipawns"]  # מנקודת מבט היריב
            
            eval_change = eval_after - eval_before
            
            # קטגוריזציה של המהלך
            move_category = self._categorize_move_quality(eval_change)
            
            # מאפייני המהלך
            move_features = self._analyze_move_features(board_before, move)
            
            return {
                "move": move.uci(),
                "san": board_before.san(move),
                "evaluation_before": analysis_before["evaluation"],
                "evaluation_after": analysis_after["evaluation"],
                "evaluation_change": eval_change,
                "move_category": move_category,
                "move_features": move_features,
                "best_move_was": analysis_before["best_moves"][0] if analysis_before["best_moves"] else None,
                "engine_depth": min(analysis_before["engine_depth"], analysis_after["engine_depth"]),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Move analysis failed: {e}")
            return {"error": str(e)}
    
    def analyze_full_game(self, pgn_string: str) -> Dict:
        """ניתוח משחק מלא"""
        try:
            # פרסור PGN
            game = chess.pgn.read_game(chess.pgn.StringIO(pgn_string))
            if not game:
                return {"error": "Invalid PGN"}
            
            board = game.board()
            moves_analysis = []
            position_evaluations = []
            critical_moments = []
            
            # ניתוח מהלך אחר מהלך
            move_count = 0
            for move in game.mainline_moves():
                move_count += 1
                
                # ניתוח המהלך
                move_analysis = self.analyze_move_quality(board, move)
                moves_analysis.append(move_analysis)
                
                # שמירת הערכה
                position_evaluations.append({
                    "move_number": move_count,
                    "evaluation": move_analysis.get("evaluation_after", {"centipawns": 0})["centipawns"],
                    "player": "white" if board.turn else "black"
                })
                
                # זיהוי רגעים קריטיים
                if abs(move_analysis.get("evaluation_change", 0)) > 100:
                    critical_moments.append({
                        "move_number": move_count,
                        "move": move_analysis["san"],
                        "evaluation_change": move_analysis["evaluation_change"],
                        "category": move_analysis["move_category"],
                        "description": self._describe_critical_moment(move_analysis)
                    })
                
                board.push(move)
            
            # ניתוח מסכם
            game_summary = self._summarize_game_analysis(moves_analysis, position_evaluations, critical_moments)
            
            return {
                "game_info": {
                    "white": game.headers.get("White", "Unknown"),
                    "black": game.headers.get("Black", "Unknown"),
                    "result": game.headers.get("Result", "*"),
                    "date": game.headers.get("Date", "Unknown"),
                    "total_moves": move_count
                },
                "moves_analysis": moves_analysis,
                "position_evaluations": position_evaluations,
                "critical_moments": critical_moments,
                "game_summary": game_summary,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Game analysis failed: {e}")
            return {"error": str(e)}
    
    def get_gpt_explanation(self, stockfish_analysis: Dict, question: str = None) -> str:
        """קבלת הסבר מ-GPT על בסיס ניתוח סטוקפיש"""
        if not self.openai_client:
            return "OpenAI לא זמין להסברים"
        
        try:
            # בניית prompt מפורט
            prompt = self._build_gpt_prompt(stockfish_analysis, question)
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": "אתה מאמן שחמט מומחה המסביר ניתוחי מחשב בעברית. תן הסברים ברורים, מדויקים ושימושיים."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ GPT explanation failed: {e}")
            return f"שגיאה בקבלת הסבר: {str(e)}"
    
    def _parse_evaluation(self, score) -> Dict:
        """פרסור הערכת מיקום"""
        try:
            if score.is_mate():
                mate_in = score.mate()
                return {
                    "type": "mate",
                    "mate_in": mate_in,
                    "centipawns": 10000 if mate_in > 0 else -10000,
                    "advantage": "decisive_white" if mate_in > 0 else "decisive_black"
                }
            else:
                cp = score.score()
                if cp is None:
                    cp = 0
                
                advantage = self._categorize_advantage(cp)
                return {
                    "type": "centipawns",
                    "centipawns": cp,
                    "advantage": advantage,
                    "mate_in": None
                }
        except:
            return {"type": "unknown", "centipawns": 0, "advantage": "equal", "mate_in": None}
    
    def _categorize_advantage(self, centipawns: int) -> str:
        """קטגוריזציה של יתרון"""
        if centipawns > 300:
            return "decisive_white"
        elif centipawns > 150:
            return "clear_white"
        elif centipawns > 50:
            return "slight_white"
        elif centipawns > -50:
            return "equal"
        elif centipawns > -150:
            return "slight_black"
        elif centipawns > -300:
            return "clear_black"
        else:
            return "decisive_black"
    
    def _categorize_move_quality(self, eval_change: int) -> str:
        """קטגוריזציה של איכות מהלך"""
        if eval_change > 100:
            return "excellent"
        elif eval_change > 30:
            return "good"
        elif eval_change > -30:
            return "acceptable"
        elif eval_change > -100:
            return "inaccurate"
        elif eval_change > -300:
            return "mistake"
        else:
            return "blunder"
    
    def _analyze_position_features(self, board: chess.Board) -> Dict:
        """ניתוח מאפייני מיקום"""
        return {
            "material_balance": self._calculate_material_balance(board),
            "king_safety": self._evaluate_king_safety(board),
            "pawn_structure": self._analyze_pawn_structure(board),
            "piece_activity": self._evaluate_piece_activity(board),
            "center_control": self._evaluate_center_control(board)
        }
    
    def _find_tactical_motifs(self, board: chess.Board) -> List[str]:
        """זיהוי מוטיבים טקטיים"""
        motifs = []
        
        if board.is_check():
            motifs.append("check")
        
        # בדיקת מזלגות, נעיצות וכו'
        for move in list(board.legal_moves)[:20]:  # בדיקה מוגבלת
            board_copy = board.copy()
            board_copy.push(move)
            
            if board_copy.is_check():
                motifs.append("check_threat")
            
            if board.is_capture(move):
                motifs.append("capture_available")
        
        return list(set(motifs))
    
    def _identify_strategic_themes(self, board: chess.Board) -> List[str]:
        """זיהוי נושאים אסטרטגיים"""
        themes = []
        
        # שלב המשחק
        piece_count = len(board.piece_map())
        if piece_count > 20:
            themes.append("opening")
        elif piece_count > 10:
            themes.append("middlegame")
        else:
            themes.append("endgame")
        
        # נושאים נוספים
        if len(list(board.pieces(chess.QUEEN, chess.WHITE))) == 0 or len(list(board.pieces(chess.QUEEN, chess.BLACK))) == 0:
            themes.append("queenless_middlegame")
        
        return themes
    
    def _analyze_move_features(self, board: chess.Board, move: chess.Move) -> List[str]:
        """ניתוח מאפייני מהלך"""
        features = []
        
        if board.is_capture(move):
            features.append("capture")
        
        if board.gives_check(move):
            features.append("check")
        
        if move.promotion:
            features.append("promotion")
        
        # בדיקת הצרחה
        if board.is_castling(move):
            features.append("castling")
        
        # בדיקת פיתוח כלי
        piece = board.piece_at(move.from_square)
        if piece and piece.piece_type in [chess.KNIGHT, chess.BISHOP]:
            features.append("development")
        
        return features
    
    def _calculate_material_balance(self, board: chess.Board) -> Dict:
        """חישוב איזון חומר"""
        values = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}
        
        white_material = sum(values.get(piece.piece_type, 0) 
                           for piece in board.piece_map().values() 
                           if piece.color == chess.WHITE)
        
        black_material = sum(values.get(piece.piece_type, 0) 
                           for piece in board.piece_map().values() 
                           if piece.color == chess.BLACK)
        
        return {
            "white": white_material,
            "black": black_material,
            "difference": white_material - black_material
        }
    
    def _evaluate_king_safety(self, board: chess.Board) -> Dict:
        """הערכת ביטחון מלכים"""
        white_king = board.king(chess.WHITE)
        black_king = board.king(chess.BLACK)
        
        return {
            "white_king_square": chess.square_name(white_king) if white_king else None,
            "black_king_square": chess.square_name(black_king) if black_king else None,
            "white_can_castle": board.has_kingside_castling_rights(chess.WHITE) or board.has_queenside_castling_rights(chess.WHITE),
            "black_can_castle": board.has_kingside_castling_rights(chess.BLACK) or board.has_queenside_castling_rights(chess.BLACK)
        }
    
    def _analyze_pawn_structure(self, board: chess.Board) -> Dict:
        """ניתוח מבנה רגלים"""
        white_pawns = board.pieces(chess.PAWN, chess.WHITE)
        black_pawns = board.pieces(chess.PAWN, chess.BLACK)
        
        return {
            "white_pawns": len(white_pawns),
            "black_pawns": len(black_pawns),
            "pawn_islands": self._count_pawn_islands(board),
            "doubled_pawns": self._count_doubled_pawns(board)
        }
    
    def _evaluate_piece_activity(self, board: chess.Board) -> Dict:
        """הערכת פעילות כלים"""
        white_moves = len(list(board.legal_moves))
        
        board.push(chess.Move.null())  # מעבר תור
        black_moves = len(list(board.legal_moves)) if board.legal_moves else 0
        board.pop()
        
        return {
            "white_mobility": white_moves,
            "black_mobility": black_moves,
            "mobility_difference": white_moves - black_moves
        }
    
    def _evaluate_center_control(self, board: chess.Board) -> Dict:
        """הערכת שליטה במרכז"""
        center_squares = [chess.E4, chess.E5, chess.D4, chess.D5]
        
        white_control = sum(1 for sq in center_squares if board.is_attacked_by(chess.WHITE, sq))
        black_control = sum(1 for sq in center_squares if board.is_attacked_by(chess.BLACK, sq))
        
        return {
            "white_control": white_control,
            "black_control": black_control,
            "control_difference": white_control - black_control
        }
    
    def _count_pawn_islands(self, board: chess.Board) -> Dict:
        """ספירת איי רגלים"""
        # מימוש פשוט - יכול להיות משופר
        return {"white_islands": 0, "black_islands": 0}
    
    def _count_doubled_pawns(self, board: chess.Board) -> Dict:
        """ספירת רגלים כפולים"""
        # מימוש פשוט - יכול להיות משופר
        return {"white_doubled": 0, "black_doubled": 0}
    
    def _basic_analysis(self, board: chess.Board) -> Dict:
        """ניתוח בסיסי ללא מנוע"""
        return {
            "engine_available": False,
            "position_fen": board.fen(),
            "to_move": "white" if board.turn else "black",
            "is_check": board.is_check(),
            "is_checkmate": board.is_checkmate(),
            "legal_moves_count": len(list(board.legal_moves)),
            "material_balance": self._calculate_material_balance(board)
        }
    
    def _describe_critical_moment(self, move_analysis: Dict) -> str:
        """תיאור רגע קריטי"""
        category = move_analysis.get("move_category", "unknown")
        change = move_analysis.get("evaluation_change", 0)
        
        if category == "blunder":
            return f"טעות גסה שמפסידה {abs(change)} נקודות"
        elif category == "mistake":
            return f"טעות שמפסידה {abs(change)} נקודות"
        elif category == "excellent":
            return f"מהלך מצוין שמביא יתרון של {change} נקודות"
        else:
            return f"מהלך {category} עם שינוי של {change} נקודות"
    
    def _summarize_game_analysis(self, moves_analysis: List, evaluations: List, critical_moments: List) -> Dict:
        """סיכום ניתוח משחק"""
        total_moves = len(moves_analysis)
        
        # ספירת סוגי מהלכים
        move_categories = {}
        for move in moves_analysis:
            category = move.get("move_category", "unknown")
            move_categories[category] = move_categories.get(category, 0) + 1
        
        # חישוב דיוק
        good_moves = move_categories.get("excellent", 0) + move_categories.get("good", 0)
        accuracy = (good_moves / total_moves * 100) if total_moves > 0 else 0
        
        return {
            "total_moves": total_moves,
            "move_categories": move_categories,
            "accuracy_percentage": round(accuracy, 1),
            "critical_moments_count": len(critical_moments),
            "biggest_mistake": max(critical_moments, key=lambda x: abs(x["evaluation_change"])) if critical_moments else None,
            "best_move": max((m for m in moves_analysis if m.get("evaluation_change", 0) > 0), 
                           key=lambda x: x.get("evaluation_change", 0), default=None)
        }
    
    def _build_gpt_prompt(self, stockfish_analysis: Dict, question: str = None) -> str:
        """בניית prompt ל-GPT"""
        base_prompt = f"""
אנא הסבר את הניתוח הבא של סטוקפיש בעברית ברורה:

מיקום: {stockfish_analysis.get('position_fen', 'לא זמין')}
תור: {stockfish_analysis.get('to_move', 'לא ידוע')}
הערכה: {stockfish_analysis.get('evaluation', {}).get('centipawns', 0)} נקודות מאה

מהלכים טובים ביותר:
"""
        
        for i, move in enumerate(stockfish_analysis.get('best_moves', [])[:3]):
            base_prompt += f"{i+1}. {move.get('san', move.get('move', 'לא ידוע'))} - {move.get('evaluation', {}).get('centipawns', 0)} נקודות\n"
        
        if stockfish_analysis.get('position_features'):
            features = stockfish_analysis['position_features']
            base_prompt += f"\nמאפייני מיקום:\n"
            base_prompt += f"איזון חומר: {features.get('material_balance', {})}\n"
            base_prompt += f"ביטחון מלכים: {features.get('king_safety', {})}\n"
        
        if stockfish_analysis.get('tactical_motifs'):
            base_prompt += f"מוטיבים טקטיים: {', '.join(stockfish_analysis['tactical_motifs'])}\n"
        
        if question:
            base_prompt += f"\nשאלה ספציפית: {question}\n"
        
        base_prompt += "\nבבקשה תן הסבר מקיף, ברור ושימושי בעברית על המיקום והמהלכים המומלצים."
        
        return base_prompt
    
    def close(self):
        """סגירת המנוע"""
        if self.engine:
            try:
                self.engine.quit()
                print("✅ Enhanced coach engine closed")
            except:
                pass
            self.engine = None