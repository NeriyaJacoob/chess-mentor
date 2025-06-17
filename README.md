# ♔ ChessMentor - Advanced Chess Training Platform

> פלטפורמת אימון שחמט מתקדמת עם מאמן AI חכם ומנוע ניתוח מקצועי

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org/)

## 🚀 הפעלה מהירה

```bash
# שכפול הפרויקט
git clone <repository-url>
cd ChessMentor

# הפעלה אוטומטית (מומלץ)
node start.js

# או הפעלה ידנית
npm run dev
```

**כתובות השירותים:**
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:5000  
- 🐍 **Python Engine**: http://localhost:5001
- 🩺 **Health Check**: http://localhost:5000/api/health

## ✨ תכונות

### ✅ מוכן לשימוש
- 🎮 **לוח שחמט אינטראקטיבי** - Drag & Drop מתקדם
- 🤖 **מאמן AI חכם** - מבוסס GPT עם ניתוח מעמיק
- 🔄 **משחק נגד מחשב** - מנוע Stockfish מתקדם
- 👥 **מולטיפלייר** - WebSocket real-time
- 📊 **מעקב ביצועים** - סטטיסטיקות מפורטות
- 🎨 **ממשק מודרני** - עיצוב רספונסיבי ומקצועי
- 🌓 **מצב כהה/בהיר** - תמיכה מלאה
- 🎵 **אפקטים קוליים** - משוב אודיו (אופציונלי)

### 🔧 תכונות טכניות
- ⚡ **ביצועים גבוהים** - React 18 + Redux Toolkit
- 🔒 **אבטחה מתקדמת** - JWT + Rate limiting
- 📱 **רספונסיבי** - תמיכה מלאה במובייל
- 🧪 **איכות קוד** - ESLint + Prettier
- 🐳 **Docker Ready** - containerization מוכן

### 🚧 בפיתוח
- 🧩 **פאזלים טקטיים** - מאגר עצום של בעיות
- 📈 **מערכת דירוג ELO** - מעקב התקדמות
- 📁 **ייבוא/ייצוא PGN** - תואמות מלאה
- 🎯 **אנליזה מתקדמת** - הערכות מעמיקות
- 📚 **מודולי למידה** - קורסים אינטראקטיביים

## 🏗️ ארכיטקטורה

```
ChessMentor/
├── 🌐 frontend-react/          # React 18 + Redux
│   ├── src/components/         # רכיבים מאוחדים ונקיים
│   ├── src/store/             # Redux Toolkit store
│   └── src/services/          # API ו-WebSocket clients
│
├── 🔧 backend-nodejs/         # Express.js API Server
│   ├── server.js              # Main API server
│   ├── chess-server.js        # WebSocket game server
│   └── services/              # Business logic
│
├── 🐍 backend-python/         # Chess Engine + AI
│   ├── chess_server.py        # FastAPI + WebSocket
│   ├── ChessGame.py           # Game logic + Stockfish
│   └── ChessCoach.py          # AI analysis engine
│
└── 📄 start.js               # Unified launcher script
```

## 🛠️ טכנולוגיות

### Frontend Stack
- **React 18** - UI framework עם Hooks מתקדמים
- **Redux Toolkit** - ניהול state מתקדם
- **Framer Motion** - אנימציות מקצועיות
- **Tailwind CSS** - עיצוב utility-first
- **Chess.js** - לוגיקת שחמט
- **Socket.IO Client** - תקשורת real-time

### Backend Stack
- **Node.js + Express** - API server ראשי
- **FastAPI + Python** - מנוע שחמט ו-AI
- **Stockfish** - מנוע שחמט מתקדם
- **WebSocket** - תקשורת real-time
- **OpenAI API** - מאמן AI חכם
- **JWT** - אותנטיקציה מאובטחת

### DevOps & Tools
- **Concurrently** - הרצת שירותים מקבילה
- **Nodemon** - פיתוח עם hot reload
- **ESLint + Prettier** - איכות קוד
- **Docker** - containerization (מוכן)

## 📋 דרישות מערכת

### בסיסי
- **Node.js** 16.0+ ([הורדה](https://nodejs.org/))
- **Python** 3.8+ ([הורדה](https://python.org/))
- **npm** 8.0+ (מגיע עם Node.js)

### מומלץ
- **Git** ([הורדה](https://git-scm.com/))
- **VS Code** + Extensions מומלצות
- **Stockfish** ([הורדה](https://stockfishchess.org/download/))

### אופציונלי
- **Docker** ([הורדה](https://docker.com/))
- **OpenAI API Key** ([קבלת מפתח](https://platform.openai.com/api-keys))

## 🚀 התקנה מפורטת

### 1. שכפול והתקנה
```bash
# שכפול הפרויקט
git clone <repository-url>
cd ChessMentor

# התקנה אוטומטית של כל התלויות
npm run install:all

# או התקנה ידנית
npm install
cd frontend-react && npm install
cd ../backend-nodejs && npm install
cd ../backend-python && pip install -r requirements.txt
```

### 2. התקנת Stockfish (חובה)
**Windows:**
```bash
# הורד מ: https://stockfishchess.org/download/
# חלץ ל: C:\stockfish\
# עדכן נתיב ב: backend-python/chess_server.py
```

**macOS:**
```bash
brew install stockfish
```

**Ubuntu/Debian:**
```bash
sudo apt install stockfish
```

### 3. הגדרת משתני סביבה
```bash
# backend-nodejs/.env נוצר אוטומטית
# אופציונלי: הוסף OpenAI API key
echo "OPENAI_API_KEY=your_key_here" >> backend-nodejs/.env
```

## 🎮 שימוש

### הפעלה בסיסית
```bash
# הפעלה מהירה
node start.js

# או עם npm
npm run dev

# הפעלה של שירות בודד
npm run dev:frontend    # רק React
npm run dev:backend     # רק Node.js
npm run dev:python      # רק Python
```

### שימוש מתקדם
```bash
# בניה לייצור
npm run build

# הפעלת production
npm run start:prod

# בדיקות
npm test

# ניקוי
npm run clean

# עדכון תלויות
npm run update-deps
```

## 🔧 הגדרות ותצורה

### הגדרת מאמן AI
1. קבל API key מ-[OpenAI Platform](https://platform.openai.com/api-keys)
2. פתח את האפליקציה ב-http://localhost:3000
3. לך להגדרות → AI Coach
4. הזן את המפתח ולחץ "התחבר"

### הגדרת Stockfish
```python
# backend-python/chess_server.py - עדכן נתיב
STOCKFISH_PATH = "C:\\path\\to\\stockfish.exe"  # Windows
STOCKFISH_PATH = "/usr/local/bin/stockfish"     # macOS/Linux
```

### הגדרות נוספות
- **פורטים**: ניתן לשנות ב-`.env` files
- **זמני חשיבה**: ניתן להגדיר ב-UI
- **רמת קושי**: בחירה ב-lobby

## 🐛 פתרון בעיות

### שרתים לא עולים
```bash
# בדוק פורטים תפוסים
netstat -an | findstr "3000 5000 5001"  # Windows
lsof -i :3000,5000,5001                  # macOS/Linux

# נקה תהליכים תקועים
npm run clean
```

### בעיות עם תלויות
```bash
# נקה והתקן מחדש
npm run clean
npm run install:all

# בדוק גרסאות
node --version    # צריך 16+
python --version  # צריך 3.8+
```

### Stockfish לא עובד
```bash
# בדוק התקנה
stockfish
# צריך להראות את prompt של Stockfish

# Windows: וודא נתיב נכון ב-chess_server.py
# Linux/Mac: וודא שבmדת ב-PATH
```

### בעיות במאמן AI
- וודא שהוזן מפתח API נכון
- בדוק שיש חיבור אינטרנט
- בדוק מכסת OpenAI API

## 📚 מדריכים

### הוספת סגנון כלי חדש
```javascript
// frontend-react/src/components/ChessBoard/ChessPiece.jsx
const newPieceStyle = {
  name: 'modern',
  getImagePath: (piece, color) => `/assets/images/pieces/modern/${color}/${piece}.svg`,
  fallback: 'unicode'
};

// הוסף ב-Redux store
dispatch(setPieceStyle('modern'));
```

### יצירת אלגוריתם AI משלך
```python
# backend-python/custom_ai.py
class CustomAI:
    def __init__(self, difficulty=5):
        self.difficulty = difficulty
    
    def get_best_move(self, board):
        # הלוגיקה שלך כאן
        return best_move
```

### הוספת נושא עיצוב חדש
```css
/* frontend-react/src/index.css */
[data-theme="custom"] {
  --board-light: #e8f4f8;
  --board-dark: #4a90a4;
  --primary-500: #2563eb;
}
```

## 🧪 בדיקות ואיכות

### הרצת בדיקות
```bash
# בדיקות Frontend
cd frontend-react
npm test

# בדיקות Backend
cd backend-nodejs  
npm test

# בדיקות Python
cd backend-python
pytest

# בדיקת לוגיקת משחק
npm run test:game
```

### בדיקות אינטגרציה
```bash
# בדיקת WebSocket
npm run test:socket

# בדיקת AI Coach
npm run test:coach

# בדיקת Stockfish
npm run test:engine
```

### איכות קוד
```bash
# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Type checking (אם מותקן TypeScript)
npm run type-check
```

## 📈 ביצועים ואופטימיזציה

### Frontend Optimization
- ✅ Code splitting באמצעות React.lazy()
- ✅ Memoization עם React.memo()
- ✅ Virtual scrolling ברשימות גדולות
- ✅ Image lazy loading
- ✅ Bundle analysis עם webpack-bundle-analyzer

### Backend Optimization
- ✅ Connection pooling
- ✅ Redis caching (עתידי)
- ✅ Rate limiting
- ✅ Compression middleware
- ✅ Memory leak monitoring

### Chess Engine Optimization
- ✅ Stockfish multi-threading
- ✅ Position caching
- ✅ Move tree pruning
- ✅ Opening book integration

## 🚀 פריסה (Deployment)

### Development
```bash
# הפעלה מקומית
npm run dev
```

### Production
```bash
# בניה
npm run build

# הפעלה
npm run start:prod
```

### Docker (מומלץ)
```bash
# בניה
docker-compose build

# הפעלה
docker-compose up

# עצירה
docker-compose down
```

### Cloud Deployment
```bash
# Heroku
git push heroku main

# Vercel (Frontend only)
vercel --prod

# AWS/GCP/Azure
# ראה מדריכי deployment ספציפיים
```

## 🤝 תרומה לפרויקט

### השתתפות
1. **Fork** את הפרויקט
2. צור **branch** חדש (`git checkout -b feature/amazing-feature`)
3. **Commit** את השינויים (`git commit -m 'Add amazing feature'`)
4. **Push** ל-branch (`git push origin feature/amazing-feature`)
5. פתח **Pull Request**

### קוד Style Guide
- שמות משתנים באנגלית
- פונקציות בעברית בתגובות
- ESLint + Prettier configuration
- קבצי tests לכל feature חדש

### באג Reports
השתמש ב-[GitHub Issues](../../issues) עם:
- תיאור הבעיה
- צעדים לשחזור
- סביבת ההפעלה
- צילומי מסך (אם רלוונטי)

## 📄 רישיון ומידע משפטי

### רישיון
פרויקט זה מופץ תחת רישיון MIT. ראה [LICENSE](LICENSE) לפרטים נוספים.

### תלויות
- **Chess.js**: BSD-2-Clause
- **Stockfish**: GPL v3
- **React**: MIT
- **OpenAI API**: Commercial

### הגבלות
- שימוש במאמן AI דורש מפתח OpenAI API
- Stockfish דורש התקנה נפרדת
- חלק מהתכונות דורשות חיבור אינטרנט

## 📞 תמיכה וקהילה

### קבלת עזרה
- 📚 **תיעוד**: [Wiki](../../wiki)
- 💬 **דיונים**: [GitHub Discussions](../../discussions)
- 🐛 **באגים**: [Issues](../../issues)
- 📧 **מייל**: support@chessmentor.com

### קהילה
- 🌍 **Discord**: [הצטרף לשרת](https://discord.gg/chessmentor)
- 🐦 **Twitter**: [@ChessMentorApp](https://twitter.com/chessmentorapp)
- 📺 **YouTube**: [ערוץ ChessMentor](https://youtube.com/chessmentor)

### תודות מיוחדות
- Stockfish team עבור המנוע המדהים
- Chess.js עבור ספריית השחמט
- React team עבור הפריימוורק
- הקהילה המדהימה של מפתחי שחמט

---

## 🏆 סטטוס פרויקט

**גרסה נוכחית**: 1.0.0  
**סטטוס**: Active Development  
**תאימות דפדפנים**: Chrome 90+, Firefox 88+, Safari 14+  
**פלטפורמות**: Windows 10+, macOS 10.15+, Ubuntu 20.04+  

**עדכון אחרון**: דצמבר 2024  
**תכונות חדשות בפיתוח**: 
- 🔄 מצב אנליזה מתקדם
- 🏆 מערכת טורנירים  
- 📱 אפליקציית מובייל
- 🎯 AI מאמן מותאם אישית

---

<div align="center">
  <strong>🚀 ChessMentor - Where Chess Meets AI Excellence</strong>
  <br>
  <sub>Built with ❤️ by Chess enthusiasts for Chess players</sub>
</div>
  '