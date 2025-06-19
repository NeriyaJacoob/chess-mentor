# backend-python/utils/mock_responses.py
"""
Mock Responses - תגובות דמה מתוחכמות למאמן AI
"""

import random
import re
from typing import Optional, List

def get_coach_response(message: str, analysis_type: str, game_state: Optional[str] = None) -> str:
    """יצירת תגובה מתואמת של המאמן"""
    
    # ניתוח השאלה לזיהוי מילות מפתח
    message_lower = message.lower()
    keywords = extract_keywords(message_lower)
    
    # בחירת תגובה לפי סוג הניתוח
    if analysis_type == 'position':
        return get_position_response(keywords, game_state)
    elif analysis_type == 'move':
        return get_move_response(keywords, message)
    elif analysis_type == 'game':
        return get_game_response(keywords)
    else:
        return get_general_response(keywords, message)

def extract_keywords(message: str) -> List[str]:
    """חילוץ מילות מפתח מהשאלה"""
    chess_keywords = {
        # פיגורות שחמט בעברית
        'מהלך': ['move', 'מהלך', 'צעד'],
        'מלך': ['king', 'מלך', 'שח'],
        'מלכה': ['queen', 'מלכה'],
        'צריח': ['rook', 'צריח'],
        'פיל': ['bishop', 'פיל', 'רץ'],
        'סוס': ['knight', 'סוס', 'פרש'],
        'רגלי': ['pawn', 'רגלי', 'חייל'],
        'צרוח': ['castle', 'צרוח', 'הצרחה'],
        'פתיחה': ['opening', 'פתיחה'],
        'אמצע': ['middlegame', 'אמצע', 'משחק אמצע'],
        'סוף': ['endgame', 'סוף', 'משחק סוף'],
        'טקטיקה': ['tactics', 'טקטיקה', 'טקטיקות'],
        'אסטרטגיה': ['strategy', 'אסטרטגיה'],
        'מרכז': ['center', 'מרכז'],
        'התקפה': ['attack', 'התקפה'],
        'הגנה': ['defense', 'הגנה'],
        'פיתוח': ['development', 'פיתוח'],
        'מיקום': ['position', 'מיקום'],
        'ביטחון': ['safety', 'ביטחון', 'בטיחות']
    }
    
    found_keywords = []
    for category, words in chess_keywords.items():
        for word in words:
            if word in message:
                found_keywords.append(category)
                break
    
    return found_keywords

def get_position_response(keywords: List[str], game_state: Optional[str]) -> str:
    """תגובות לניתוח מיקום"""
    
    base_responses = [
        "ניתוח המיקום מראה מצב מעניין ומורכב.",
        "במיקום הנוכחי יש כמה אפשרויות אסטרטגיות.",
        "זהו מיקום שדורש תכנון קפדני.",
        "המיקום מציג איזון עדין בין הכוחות."
    ]
    
    # התאמה לפי מילות מפתח
    specific_advice = []
    
    if 'מלך' in keywords:
        specific_advice.append("שים לב לביטחון המלך - זה הכלי החשוב ביותר.")
    
    if 'מרכז' in keywords:
        specific_advice.append("השליטה במרכז הלוח היא מפתח להצלחה.")
    
    if 'פיתוח' in keywords:
        specific_advice.append("המשך בפיתוח הכלים לעמדות פעילות.")
    
    if 'התקפה' in keywords:
        specific_advice.append("לפני התקפה, וודא שהמלך שלך מוגן.")
    
    if 'הגנה' in keywords:
        specific_advice.append("הגנה טובה היא הבסיס להתקפה מוצלחת.")
    
    # בניית התגובה
    response = random.choice(base_responses)
    
    if specific_advice:
        response += f"\n\n💡 {random.choice(specific_advice)}"
    
    # הוספת עצה כללית
    general_tips = [
        "זכור לבדוק איומים על המלך לפני כל מהלך.",
        "חפש הזדמנויות ליצירת איומים כפולים.",
        "שקול את התיאום בין הכלים שלך.",
        "הערך את מבנה הרגלים לטווח הארוך."
    ]
    
    if random.random() < 0.4:  # 40% סיכוי
        response += f"\n\n⭐ {random.choice(general_tips)}"
    
    return response

def get_move_response(keywords: List[str], original_message: str) -> str:
    """תגובות לניתוח מהלך"""
    
    # ניסיון לזהות מהלך בתוך ההודעה
    move_pattern = r'\b[a-h][1-8][a-h][1-8]\b'
    moves_found = re.findall(move_pattern, original_message.lower())
    
    if moves_found:
        move = moves_found[0]
        specific_move_response = f"לגבי המהלך {move}: "
    else:
        specific_move_response = "לגבי המהלך שנבחר: "
    
    move_evaluations = [
        "זהו מהלך עקרוני נכון שמשפר את המיקום.",
        "מהלך סביר, אבל יש לשקול גם חלופות.",
        "זהו מהלך מעניין שיוצר אפשרויות חדשות.",
        "מהלך טוב שמראה הבנה של העמדה.",
        "זוהי בחירה הגיונית במצב הנוכחי."
    ]
    
    response = specific_move_response + random.choice(move_evaluations)
    
    # הוספת עצות ספציפיות לפי מילות מפתח
    if 'טקטיקה' in keywords:
        response += "\n\n🎯 חפש הזדמנויות טקטיות נוספות כמו מזלגות ויתדות."
    
    if 'צרוח' in keywords:
        response += "\n\n🏰 הצרחה היא מהלך חשוב לביטחון המלך ופיתוח הצריח."
    
    if 'פתיחה' in keywords:
        response += "\n\n📖 בפתיחה, התמקד בפיתוח, שליטה במרכז וביטחון המלך."
    
    return response

def get_game_response(keywords: List[str]) -> str:
    """תגובות לניתוח משחק מלא"""
    
    game_analysis_responses = [
        "המשחק מראה התפתחות מעניינת עם נקודות מפנה חשובות.",
        "ניתוח המשחק חושף תבניות אסטרטגיות מגוונות.",
        "זהו משחק מלמד שמדגים עקרונות שחמט חשובים.",
        "המשחק מציג מאבק מאוזן עם הזדמנויות משני הצדדים."
    ]
    
    response = random.choice(game_analysis_responses)
    
    # נקודות למידה לפי מילות מפתח
    learning_points = []
    
    if 'פתיחה' in keywords:
        learning_points.append("🔸 בפתיחה: שמירה על העקרונות הבסיסיים של פיתוח ושליטה במרכז")
    
    if 'אמצע' in keywords:
        learning_points.append("🔸 במשחק האמצע: תיאום בין כלים ויצירת תוכניות אסטרטגיות")
    
    if 'סוף' in keywords:
        learning_points.append("🔸 במשחק הסוף: דיוק בחישוב ופעילות המלך")
    
    if 'טקטיקה' in keywords:
        learning_points.append("🔸 טקטית: זיהוי תבניות והזדמנויות קצרות טווח")
    
    if 'אסטרטגיה' in keywords:
        learning_points.append("🔸 אסטרטגית: תכנון ארוך טווח ושיפור המיקום")
    
    if learning_points:
        response += "\n\n**נקודות למידה עיקריות:**\n" + "\n".join(learning_points)
    
    # המלצות לשיפור
    improvement_tips = [
        "💪 לשיפור: תרגל חישוב מהלכים קדימה",
        "📚 מומלץ: למד תבניות טקטיות בסיסיות",
        "⏰ טיפ: השקע זמן בתכנון לפני ביצוע מהלכים",
        "🔍 חשוב: בדוק תמיד איומים על המלך"
    ]
    
    response += f"\n\n{random.choice(improvement_tips)}"
    
    return response

def get_general_response(keywords: List[str], original_message: str) -> str:
    """תגובות כלליות"""
    
    # זיהוי סוג השאלה
    question_types = {
        'איך': 'how_to',
        'מה': 'what_is',
        'מתי': 'when_to',
        'איפה': 'where_to',
        'למה': 'why',
        'כמה': 'how_much'
    }
    
    question_type = None
    for hebrew_word, eng_type in question_types.items():
        if hebrew_word in original_message:
            question_type = eng_type
            break
    
    # תגובות מותאמות לסוג השאלה
    if question_type == 'how_to':
        base_responses = [
            "זוהי שאלה מעשית מעולה. בשחמט, הדרך הטובה ביותר ללמוד היא בתרגול.",
            "שאלה חכמה! יש לכך כמה גישות, אבל העיקרון הכללי הוא..."
        ]
    elif question_type == 'what_is':
        base_responses = [
            "זהו מושג מרכזי בשחמט שחשוב להבין היטב.",
            "שאלה בסיסית וחשובה! התשובה תעזור לך להשתפר."
        ]
    else:
        base_responses = [
            "שאלה מעניינת שנוגעת לנושא חשוב בשחמט.",
            "זהו נושא מרתק שכדאי לחקור עמוק יותר."
        ]
    
    response = random.choice(base_responses)
    
    # הוספת מידע ספציפי לפי מילות מפתח
    if keywords:
        keyword_responses = {
            'פתיחה': "בפתיחה, העקרונות העיקריים הם: פיתוח כלים, שליטה במרכז וביטחון המלך.",
            'אמצע': "במשחק האמצע, חשוב להתמקד בתיאום בין כלים ויצירת תוכניות.",
            'סוף': "במשחק הסוף, המלך הופך לכלי התקפי וחשוב לפעיל אותו.",
            'טקטיקה': "טקטיקות הן תבניות קצרות טווח שמנצלות חולשות ביריב.",
            'אסטרטגיה': "אסטרטגיה היא תכנון ארוך טווח לשיפור המיקום.",
            'מרכז': "השליטה במרכז מאפשרת גמישות ושליטה על המשחק."
        }
        
        for keyword in keywords:
            if keyword in keyword_responses:
                response += f"\n\n🎯 {keyword_responses[keyword]}"
                break
    
    # עצות כלליות
    general_advice = [
        "זכור: בשחמט כל מהלך צריך לשרת מטרה ברורה.",
        "טיפ: לפני כל מהלך, שאל את עצמך - מה המטרה?",
        "עיקרון: תמיד בדוק איומים על המלך לפני המהלך.",
        "חשוב: שיפור המיקום הוא תמיד מטרה חשובה."
    ]
    
    if random.random() < 0.5:  # 50% סיכוי
        response += f"\n\n💡 {random.choice(general_advice)}"
    
    return response

def get_contextual_tip(keywords: List[str]) -> str:
    """קבלת טיפ רלוונטי לפי הקונטקסט"""
    
    tips_by_context = {
        'מלך': "המלך הוא הכלי החשוב ביותר - הגן עליו בכל מחיר!",
        'מלכה': "המלכה היא הכלי החזק ביותר - השתמש בה בזהירות.",
        'צריח': "צריחים אוהבים עמודות פתוחות ושורות פתוחות.",
        'פיל': "פילים מעדיפים אלכסונים ארוכים ופתוחים.",
        'סוס': "סוסים הם הכלים היחידים שיכולים לקפץ מעל כלים אחרים.",
        'רגלי': "רגלים הם נשמת המשחק - מבנה הרגלים קובע את האופי.",
        'פתיחה': "בפתיחה: פתח בכלים, תשלוט במרכז, הצרח מוקדם.",
        'אמצע': "במשחק האמצע: תאם בין כלים, צור תוכניות, חפש טקטיקות.",
        'סוף': "במשחק הסוף: פעיל את המלך, צור רגלים עוברים, חשב בדיוק."
    }
    
    for keyword in keywords:
        if keyword in tips_by_context:
            return tips_by_context[keyword]
    
    # טיפ כללי כברירת מחדל
    general_tips = [
        "שחמט הוא משחק של תבניות - לומד תבניות תשתפר!",
        "תרגול עושה מושלם - שחק הרבה ותנתח את המשחקים שלך.",
        "כל מהלך במשחק צריך לשרת מטרה - אל תזיז כלים בלי סיבה.",
        "זמן הוא משאב יקר - השתמש בו בחכמה."
    ]
    
    return random.choice(general_tips)