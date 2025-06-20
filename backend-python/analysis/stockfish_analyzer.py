# backend-python/analysis/stockfish_analyzer.py
import chess
import chess.engine
from typing import List, Dict, Optional
import asyncio

class StockfishAnalyzer:
    def __init__(self, engine_path: str = None):
        self.engine_path = engine_path or self._find_stockfish()
        self.engine = None
        
    def _find_stockfish(self):
        import os
        paths = ['stockfish', '/usr/local/bin/stockfish', 'C:\\stockfish\\stockfish.exe']
        for path in paths:
            if os.path.exists(path):
                return path
        return 'stockfish'
    
    async def start_engine(self):
        if not self.engine:
            self.engine = await chess.engine.SimpleEngine.apopen_uci(self.engine_path)
    
    async def stop_engine(self):
        if self.engine:
            await self.engine.quit()
            self.engine = None
    
    async def analyze_game(self, moves: List[str], time_per_move: float = 1.0) -> Dict:
        """Analyze complete game and classify moves"""
        await self.start_engine()
        
        board = chess.Board()
        analysis_results = []
        evaluations = [0.0]  # Starting evaluation
        
        for i, move_san in enumerate(moves):
            try:
                move = board.parse_san(move_san)
                
                # Get evaluation before move
                info = await self.engine.analyse(board, chess.engine.Limit(time=time_per_move))
                eval_before = self._extract_evaluation(info, board.turn)
                
                # Make the move
                board.push(move)
                
                # Get evaluation after move  
                info = await self.engine.analyse(board, chess.engine.Limit(time=time_per_move))
                eval_after = self._extract_evaluation(info, not board.turn)
                
                # Calculate move quality
                move_quality = self._classify_move(eval_before, eval_after, board.turn)
                
                analysis_results.append({
                    "move_number": i + 1,
                    "move": move_san,
                    "uci": move.uci(),
                    "eval_before": eval_before,
                    "eval_after": eval_after,
                    "eval_change": eval_after - eval_before,
                    "classification": move_quality["class"],
                    "score": move_quality["score"],
                    "is_critical": abs(eval_after - eval_before) > 0.5
                })
                
                evaluations.append(eval_after)
                
            except Exception as e:
                print(f"Error analyzing move {i}: {e}")
                continue
        
        return {
            "total_moves": len(moves),
            "move_analysis": analysis_results,
            "critical_moves": [m for m in analysis_results if m["is_critical"]],
            "evaluation_graph": evaluations,
            "game_summary": self._generate_summary(analysis_results)
        }
    
    def _extract_evaluation(self, info: chess.engine.InfoDict, turn: bool) -> float:
        """Extract numerical evaluation from engine"""
        score = info.get("score")
        if not score:
            return 0.0
            
        if score.is_mate():
            mate_score = score.white().mate()
            return 10.0 if mate_score > 0 else -10.0
        else:
            cp_score = score.white().score(mate_score=10000)
            eval_score = cp_score / 100.0 if cp_score else 0.0
            return eval_score if turn else -eval_score
    
    def _classify_move(self, eval_before: float, eval_after: float, is_white: bool) -> Dict:
        """Classify move quality like chess.com"""
        change = eval_after - eval_before
        if not is_white:
            change = -change
            
        if change >= 1.0:
            return {"class": "brilliant", "score": 95}
        elif change >= 0.5:
            return {"class": "excellent", "score": 85}
        elif change >= 0.1:
            return {"class": "good", "score": 75}
        elif change >= -0.1:
            return {"class": "book", "score": 65}
        elif change >= -0.3:
            return {"class": "inaccuracy", "score": 45}
        elif change >= -0.7:
            return {"class": "mistake", "score": 25}
        else:
            return {"class": "blunder", "score": 10}
    
    def _generate_summary(self, moves: List[Dict]) -> Dict:
        """Generate game summary statistics"""
        classifications = {}
        for move in moves:
            cls = move["classification"]
            classifications[cls] = classifications.get(cls, 0) + 1
        
        avg_score = sum(m["score"] for m in moves) / len(moves) if moves else 0
        
        return {
            "average_score": round(avg_score, 1),
            "total_mistakes": classifications.get("mistake", 0) + classifications.get("blunder", 0),
            "total_good_moves": classifications.get("excellent", 0) + classifications.get("brilliant", 0),
            "classifications": classifications
        }

# Global analyzer instance
analyzer = StockfishAnalyzer()