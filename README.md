# ♔ ChessMentor - אפליקציית שחמט מתקדמת

אפליקציית שחמט חדשנית עם מאמן GPT חכם שתעזור לך להשתפר במשחק השחמט.

## 🚀 הפעלה מהירה

### דרך 1: הפעלה אוטומטית (מומלץ)

```bash
# הפעלת הפרויקט
chmod +x start.sh
./start.sh

# עצירת הפרויקט
chmod +x stop.sh
./stop.sh
```

### דרך 2: הפעלה ידנית

```bash
# Backend
cd backend-nodejs
npm install
npm run dev

# Frontend (בטרמינל נפרד)
cd frontend-react
npm install
npm start
```

## 🌐 כתובות

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🎯 תכונות

### ✅ כבר מוכן:
- 🎮 לוח שחמט אינטראקטיבי עם Drag & Drop
- 🤖 מאמן GPT חכם (דרוש מפתח OpenAI API)
- 📊 מעקב אחר מצב המשחק
- 🎨 ממשק משתמש מודרני ורספונסיבי
- 🔒 אבטחה מתקדמת

### 🚧 בפיתוח:
- 🧩 פאזלים טקטיים
- 📈 מערכת דירוג ELO
- 📁 ייבוא/ייצוא PGN
- 🎯 אנליזה מתקדמת

## 🛠️ טכנולוגיות

### Frontend:
- React 18
- Redux Toolkit
- Chess.js
- Framer Motion
- Tailwind CSS

### Backend:
- Node.js + Express
- OpenAI API
- MongoDB (עתידי)
- JWT Authentication (עתידי)

## 🔧 הגדרות

### מפתח OpenAI API
1. קבל מפתח מ: https://platform.openai.com/api-keys
2. הזן במסך ההתחברות באפליקציה
3. המפתח נשמר באופן זמני ומאובטח

### משתני סביבה
קובץ `.env` נוצר אוטומטית ב-`backend-nodejs/`:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=chessmentor-super-secret-key-2024
```

## 📁 מבנה הפרויקט

```
ChessMentor/
├── backend-nodejs/          # שרת Node.js
│   ├── services/
│   ├── server.js
│   └── package.json
├── frontend-react/          # אפליקציית React
│   ├── src/
│   │   ├── components/
│   │   ├── store/
│   │   └── App.js
│   └── package.json
├── start.sh                 # הפעלה אוטומטית
├── stop.sh                  # עצירת שרתים
└── README.md
```

## 🐛 פתרון בעיות

### השרת לא עולה?
```bash
# בדוק אם הפורטים תפוסים
lsof -i :3000
lsof -i :5000

# נקה תהליכים תקועים
./stop.sh
```

### בעיות עם תלויות?
```bash
# נקה והתקן מחדש
rm -rf backend-nodejs/node_modules
rm -rf frontend-react/node_modules
./start.sh
```

### לוח השחמט לא מוצג?
1. וודא ש-Tailwind CSS מותקן
2. בדוק שכל הרכיבים נטענים
3. פתח Developer Tools וחפש שגיאות

## 🤝 תרומה

הפרויקט פתוח לתרומות! אנא:
1. צור Fork
2. צור Branch חדש
3. שלח Pull Request

## 📄 רישיון

MIT License - ראה קובץ LICENSE

## 📞 תמיכה

לשאלות ותמיכה: פתח Issue ב-GitHub

---
**ChessMentor** - שחמט חכם לעידן המודרני 🎯