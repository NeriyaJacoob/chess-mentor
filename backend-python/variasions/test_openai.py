# test_openai.py - בדיקת חיבור ל-OpenAI API
import asyncio
from openai import OpenAI

async def test_openai_connection():
    """בדיקה פשוטה של חיבור ל-OpenAI"""
    
    # הזן כאן את מפתח ה-API שלך
    api_key = input("הזן את מפתח OpenAI API שלך: ").strip()
    
    if not api_key:
        print("❌ לא הוזן מפתח API")
        return
    
    if not api_key.startswith('sk-'):
        print("❌ מפתח API צריך להתחיל ב-'sk-'")
        return
    
    print(f"🔑 מפתח API: {api_key[:10]}...")
    
    try:
        # יצירת client
        client = OpenAI(api_key=api_key)
        print("✅ Client נוצר בהצלחה")
        
        # בדיקת חיבור - רשימת מודלים
        print("🔍 בודק רשימת מודלים...")
        models = await asyncio.to_thread(client.models.list)
        print(f"✅ נמצאו {len(models.data)} מודלים")
        
        # הדפסת כמה מודלים
        available_models = [m.id for m in models.data]
        print("📋 מודלים זמינים:")
        for model in available_models[:5]:
            print(f"  • {model}")
        
        # בדיקת שיחה פשוטה
        print("\n🤖 בודק שיחה פשוטה...")
        
        # בחר מודל זמין
        test_model = "gpt-4o-mini" if "gpt-4o-mini" in available_models else available_models[0]
        print(f"🎯 משתמש במודל: {test_model}")
        
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=test_model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Respond in Hebrew when possible."},
                {"role": "user", "content": "שלום! אמר לי משהו קצר ויפה על שחמט"}
            ],
            max_tokens=100,
            temperature=0.7
        )
        
        assistant_message = response.choices[0].message.content
        print(f"✅ תגובת GPT: {assistant_message}")
        
        print("\n🎉 החיבור ל-OpenAI עובד מצוין!")
        return True
        
    except Exception as e:
        print(f"❌ שגיאה בחיבור ל-OpenAI: {e}")
        
        # בדיקות נוספות
        if "Incorrect API key" in str(e):
            print("💡 המפתח שגוי - בדוק ב-https://platform.openai.com/api-keys")
        elif "insufficient_quota" in str(e):
            print("💡 המכסה הסתיימה - בדוק ב-https://platform.openai.com/usage")
        elif "rate_limit" in str(e):
            print("💡 חרגת ממגבלת השימוש - נסה שוב עוד כמה דקות")
        else:
            print("💡 בדוק חיבור לאינטרנט ונסה שוב")
        
        return False

if __name__ == "__main__":
    print("🧪 בדיקת חיבור OpenAI API")
    print("=" * 40)
    
    result = asyncio.run(test_openai_connection())
    
    if result:
        print("\n✅ הכל מוכן! אתה יכול להשתמש ב-API")
    else:
        print("\n❌ יש בעיה עם החיבור - תקן את הבעיה ונסה שוב")