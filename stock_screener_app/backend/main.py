from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pydantic import BaseModel
import os
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.background import BackgroundScheduler
import backend.news_engine as news_engine
import backend.screener as screener

app = FastAPI(title="Advanced Stock Screener API")

os.makedirs(news_engine.ARCHIVE_DIR, exist_ok=True)
app.mount("/api/podcasts/audio", StaticFiles(directory=news_engine.ARCHIVE_DIR), name="audio")

@app.on_event("startup")
def startup_event():
    print("Starting background scheduler and generating initial podcast archive...")
    news_engine.setup_mock_history()
    scheduler = BackgroundScheduler()
    scheduler.add_job(news_engine.create_edition, 'cron', hour=12, minute=0)
    scheduler.add_job(news_engine.create_edition, 'cron', hour=22, minute=0)
    scheduler.start()

# Allow CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'screener_data.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/universe")
def get_universe():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT symbol FROM tickers")
    tickers = [row['symbol'] for row in cursor.fetchall()]
    conn.close()
    return {"tickers": tickers, "count": len(tickers)}

@app.get("/api/screener-results")
def get_screener_results():
    """
    Fetches real-time stock data from yfinance and uses Gemini AI to generate insights.
    """
    return screener.get_live_screener_results()

class ChatRequest(BaseModel):
    message: str
    language: str = 'he'

@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    """
    Mock AI Endpoint ready for MCP/Tool use integration.
    """
    msg = request.message.lower()
    
    if request.language == 'he':
        if 'טכנולוגיה' in msg or 'tech' in msg:
            response = "זיהיתי מגמה מעניינת: מניות הטכנולוגיה מראות היום חוזקה יוצאת דופן. אנבידיה (NVDA) ופלאנטיר (PLTR) פרצו את ממוצע ה-30 שבועות עם מחזור מסחר גבוה במיוחד. האם תרצה שאסנן לך מניות טכנולוגיה נוספות עם מאפיינים דומים?"
        elif 'פלנטיר' in msg or 'pltr' in msg:
            response = "פלאנטיר (PLTR) מציגה נתונים פונדמנטליים מצוינים: צמיחת רווחים של 40% ברבעון האחרון ו-ROE של 18%. טכנית, היא בפריצה קלאסית של שלב 2 (Stage 2 Breakout). זו נראית כמו הזדמנות קנייה ברמת סיכון נמוכה."
        else:
            response = f"שאלת לגבי: '{request.message}'. בתור עוזר ה-AI שלך, אני מסוגל לגשת בזמן אמת למסד הנתונים שלנו הכולל מעל 500 מניות. זוהי גרסת הדגמה, ולכן התשובות כרגע מתוכנתות מראש. בגרסה המלאה, כאן תופיע תשובה חכמה המבוססת על ניתוח הנתונים המדויקים שביקשת!"
    else:
        if 'tech' in msg:
            response = "I detected an interesting trend: Tech stocks are showing exceptional strength today. NVDA and PLTR broke out of their 30-week moving average on high volume. Would you like me to screen for more tech stocks with similar traits?"
        elif 'pltr' in msg or 'palantir' in msg:
            response = "Palantir (PLTR) shows excellent fundamentals: 40% EPS growth and 18% ROE. Technically, it's in a classic Stage 2 Breakout. This looks like a low-risk entry opportunity."
        else:
            response = f"You asked: '{request.message}'. As your AI Assistant, I can query our 500+ stock database in real time. This is a demo version, so answers are mocked. In the full version, a smart data-driven response will appear here!"
            
    return {"reply": response}

@app.get("/api/ta100")
def get_ta100_recommendations():
    """
    Live endpoint for Tel Aviv 100 (TA-125) daily recommendations using yfinance and Gemini.
    """
    return screener.get_live_ta100_recommendations()

@app.get("/api/sectors/deep-dive")
def get_sectors_deep_dive():
    """
    Live endpoint for deep dive sector analysis using Gemini.
    """
    return screener.get_sector_deep_dives()

@app.get("/api/chart/{ticker}")
def get_historical_chart_data(ticker: str):
    """
    Mock endpoint to return 10-year historical data for a ticker, including major events.
    """
    import random
    
    # Generate 10 years of monthly data
    years = list(range(2014, 2025))
    data = []
    
    base_price = 100 if ticker == 'NVDA' else 10
    
    events = {
        "2015-06": "השקת מוצר פורץ דרך (עליה במכירות)",
        "2018-12": "מלחמת סחר ארה\"ב-סין (ירידות חדות)",
        "2020-03": "פרוץ משבר הקורונה (התרסקות שווקים)",
        "2020-11": "הכרזה על חיסונים (ראלי התאוששות)",
        "2022-09": "העלאות הריבית של הפדרל ריזרב (אינפלציה)",
        "2023-05": "בום הבינה המלאכותית מתחיל (AI)",
        "2024-02": "דוחות שיא היסטוריים (קפיצת מדרגה)"
    }
    
    for year in years:
        for month in ["01", "06", "12"]:
            date_str = f"{year}-{month}"
            
            # Add some randomness and general upward trend
            base_price = base_price * random.uniform(0.9, 1.25)
            
            # Special manual overrides to make the chart look dramatic
            if date_str == "2020-03":
                base_price *= 0.6
            elif date_str == "2023-05":
                base_price *= 1.5
                
            data_point = {
                "date": date_str,
                "price": round(base_price, 2)
            }
            
            if date_str in events:
                data_point["event"] = events[date_str]
                
            data.append(data_point)
            
    return data

@app.get("/api/podcasts")
def get_podcasts():
    """
    Returns the archive of generated podcasts.
    """
    return news_engine.get_archive()

from fastapi.responses import FileResponse

frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="frontend-assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Ignore API routes that somehow fell through (they shouldn't if defined above)
        if full_path.startswith("api/"):
            return {"error": "API route not found"}
            
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
