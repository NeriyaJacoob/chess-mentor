# backend-python/utils/enhanced_coach.py
# Enhanced coach responses with Stockfish data integration

def format_move_analysis_for_gpt(move_data: dict, game_context: dict) -> str:
    """Convert Stockfish analysis to human-readable GPT prompt"""
    
    move = move_data['move']
    classification = move_data['classification']
    eval_before = move_data['eval_before']
    eval_after = move_data['eval_after']
    eval_change = move_data['eval_change']
    
    # Create context-rich prompt
    prompt = f"""אנא הסבר את המהלך הזה במשחק שחמט:

**פרטי המהלך:**
- המהלך: {move}
- סיווג: {classification}
- הערכה לפני המהלך: {eval_before:.2f}
- הערכה אחרי המהלך: {eval_after:.2f}
- שינוי בהערכה: {eval_change:+.2f}

**הקשר המשחק:**
- שלב: {get_game_phase(game_context)}
- תוצאה סופית: {game_context.get('result', 'לא ידוע')}
- רמת AI: {game_context.get('ai_level', 'לא ידוע')}

**בקשה להסבר:**
הסבר בשפה פשוטה וברורה:
1. למה המהלך קיבל את הסיווג "{classification}"?
2. מה השפעת המהלך על המיקום?
3. מה היו החלופות הטובות יותר (אם היו)?
4. איזה לקח אפשר ללמוד מהמהלך הזה?

תן הסבר חינוכי ובונה שיעזור לשחקן להשתפר."""

    return prompt

def format_game_summary_for_gpt(analysis: dict, game_data: dict) -> str:
    """Create comprehensive game analysis prompt"""
    
    summary = analysis['game_summary']
    critical_moves = analysis['critical_moves']
    
    # Extract key statistics
    total_moves = len(analysis['move_analysis'])
    mistakes_count = summary['total_mistakes']
    good_moves_count = summary['total_good_moves']
    avg_score = summary['average_score']
    
    # Build prompt
    prompt = f"""נתח את המשחק המלא הזה:

**נתוני המשחק:**
- מספר מהלכים: {total_moves}
- תוצאה: {game_data.get('result', 'לא ידוע')}
- ציון ממוצע: {avg_score}
- מהלכים שגויים: {mistakes_count}
- מהלכים טובים: {good_moves_count}

**מהלכים קריטיים:**"""

    for i, move in enumerate(critical_moves[:3]):
        prompt += f"""
{i+1}. מהלך {move['move_number']}: {move['move']} 
   - סיווג: {move['classification']}
   - שינוי הערכה: {move['eval_change']:+.2f}"""

    prompt += f"""

**בקש ניתוח מקיף:**
1. **הערכה כללית**: איך היה איכות המשחק?
2. **נקודות חוזק**: מה עשה השחקן טוב?
3. **אזורים לשיפור**: על מה כדאי להתמקד?
4. **לקחים עיקריים**: 3 דברים חשובים ללמוד מהמשחק
5. **המלצות**: איך להשתפר במשחקים הבאים?

תן ניתוח מפורט וחינוכי שיעזור לשחקן להשתפר."""

    return prompt

def get_game_phase(game_context: dict) -> str:
    """Determine game phase based on move count"""
    move_count = game_context.get('move_count', 0)
    
    if move_count <= 10:
        return "פתיחה"
    elif move_count <= 25:
        return "אמצע משחק"
    else:
        return "סוף משחק"

def create_contextual_response(message: str, move_data: dict = None, game_context: dict = None) -> str:
    """Create enhanced coach response with context"""
    
    if move_data and game_context:
        # This is a move-specific question
        analysis_prompt = format_move_analysis_for_gpt(move_data, game_context)
        return f"{analysis_prompt}\n\nשאלה נוספת מהמשתמש: {message}"
    
    elif game_context:
        # General game question
        return f"""שאלה על המשחק:
        
**הקשר המשחק:**
- תוצאה: {game_context.get('result', 'לא ידוע')}
- מספר מהלכים: {game_context.get('move_count', 'לא ידוע')}
- רמת AI: {game_context.get('ai_level', 'לא ידוע')}

**שאלת המשתמש:** {message}

אנא תן תשובה מפורטת ומועילה."""
    
    else:
        # Regular chess question
        return message