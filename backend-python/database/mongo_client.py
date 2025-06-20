# backend-python/database/mongo_client.py
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from typing import Optional, List, Dict

class MongoDB:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        
    async def connect(self):
        mongo_url = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client.chessmentor
        print("📁 Connected to MongoDB")
        
    async def close(self):
        if self.client:
            self.client.close()

    # Games Collection
    async def save_game(self, user_id: str, game_data: dict) -> str:
        """Save completed game to database"""
        game_doc = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "moves": game_data["moves"],
            "positions": game_data["positions"], 
            "result": game_data["result"],
            "ai_level": game_data.get("ai_level", 5),
            "player_color": game_data.get("player_color", "white"),
            "game_duration": game_data.get("duration", 0),
            "analysis": None  # Will be filled during review
        }
        
        result = await self.db.games.insert_one(game_doc)
        return str(result.inserted_id)
    
    async def get_user_games(self, user_id: str, limit: int = 20) -> List[Dict]:
        """Get user's games for review"""
        cursor = self.db.games.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)
        
        games = []
        async for game in cursor:
            game["_id"] = str(game["_id"])
            games.append(game)
        return games
    
    async def get_game_by_id(self, game_id: str) -> Optional[Dict]:
        """Get specific game for review"""
        from bson import ObjectId
        game = await self.db.games.find_one({"_id": ObjectId(game_id)})
        if game:
            game["_id"] = str(game["_id"])
        return game
    
    async def save_game_analysis(self, game_id: str, analysis: dict):
        """Save Stockfish analysis results"""
        from bson import ObjectId
        await self.db.games.update_one(
            {"_id": ObjectId(game_id)},
            {"$set": {"analysis": analysis, "analyzed_at": datetime.utcnow()}}
        )

# Global instance
mongodb = MongoDB()