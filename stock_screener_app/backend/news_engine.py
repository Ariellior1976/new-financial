import feedparser
import os
import time
from datetime import datetime, timedelta
import json
import google.generativeai as genai
import asyncio
import edge_tts

ARCHIVE_DIR = os.path.join(os.path.dirname(__file__), "archive")
os.makedirs(ARCHIVE_DIR, exist_ok=True)

RSS_FEEDS = {
    "ynet": "http://www.ynet.co.il/Integration/StoryRss2.xml",
    "globes": "https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=821"
}

def fetch_top_news():
    news_items = []
    try:
        feed = feedparser.parse(RSS_FEEDS["globes"])
        for entry in feed.entries[:3]:
            news_items.append(entry.title)
        
        feed2 = feedparser.parse(RSS_FEEDS["ynet"])
        for entry in feed2.entries[:2]:
            news_items.append(entry.title)
    except Exception as e:
        print(f"Error fetching RSS: {e}")
        
    if not news_items:
        news_items = [
            "מתיחות גיאופוליטית מחריפה ברחבי המזרח התיכון, הדולר מתחזק.",
            "הפדרל ריזרב מאותת על השארת הריבית ברמתה הנוכחית, מדדי וול סטריט בירידה.",
            "שוק השבבים העולמי רושם שוב שיאי הכנסות בהובלת סקטור הבינה המלאכותית."
        ]
        
    return news_items

def generate_podcast_script(news_items):
    months = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"]
    now = datetime.now()
    day = now.day
    month_name = months[now.month - 1]
    today_str = f"{day} ל{month_name}"
    
    # Determine edition focus based on hour
    if 5 <= now.hour < 17:
        edition_title = "מהדורת חצות"
        edition_focus = "סיכום נתוני סגירת המסחר בוול-סטריט, אירועי הלילה הגלובליים, והשפעתם הצפויה על פתיחת המסחר בבורסה בתל אביב בבוקר."
    else:
        edition_title = "מהדורת עשר בלילה"
        edition_focus = "סיכום אירועי היום בישראל ואירופה, ניתוח המתרחש במסחר בארצות הברית כעת, והערכות לקראת יום המחר."

    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3.1-flash-lite')
        
        prompt = f"""
        You are a senior macro-economic strategist and chief capital markets reporter for "הדופק של השוק" (The Pulse of the Market) financial podcast.
        Your delivery style is authoritative, professional, sharp yet accessible.
        
        Today's date: {today_str}.
        This is the: {edition_title}.
        Edition Focus: {edition_focus}
        
        Review these news headlines:
        {news_items}
        
        CRITICAL RULES:
        1. THE GATEKEEPER (Aggressive Filtering):
           - Strictly forbid general news, gossip, yellow politics, or security events with zero direct economic impact.
           - Include ONLY events that act as a direct catalyst for: major stock indices (TA-35, S&P 500, Nasdaq), yields, forex (USD/ILS, EUR/ILS), or key sectors (Tech, Defense, Energy, Banks).
           
        2. TRANSMISSION MECHANISM ANALYSIS (No summarization):
           - Do not just summarize. Analyze the step-by-step transmission chain (e.g., event -> shipping rates rise -> inflation expectations -> central bank rate pressure -> tech stock drop).
           - Rely only on facts and figures. If a rate, index value, or percentage is mentioned, use it. If uncertain, state the market pricing probabilities explicitly.
           
        3. SPEECH ENGINE OPTIMIZATION (For Hebrew TTS):
           - NO abbreviations or acronyms: write full words. E.g., write "ארצות הברית" instead of "ארה"ב", "יושב ראש" instead of "יו"ר", "מנכ"ל" as "מנכאל" or "מנהל כללי", "אחוזים" instead of "%", "דולרים" instead of "$".
           - NO math symbols: write numbers and percentages in full Hebrew words (e.g., write "שניים נקודה חמישה אחוזים" instead of "2.5%").
           - Punctuation: Use commas [,] and periods [.] frequently to break down long sentences so the digital voice stays dynamic and does not become monotone. Keep sentences short.
           - Verbal connectors: Include transition phrases to create human-like pacing and intonation (e.g., "מנגד", "חשוב לשים לב", "וכאן נמצא הסיפור האמיתי", "המשמעות בשטח היא").
           
        4. STRUCTURE & OUTPUT FORMAT:
           - Output ONLY the Hebrew script text.
           - Do NOT output any headings, subheadings, bullet points, or markdown titles that the speaker would read aloud.
           - Length: 2 to 3 minutes read time (about 300 to 400 words).
           - Must include:
             - Dynamic opening: date, edition time, and main headline.
             - Body (max 2-3 events): the events and their transmission chain.
             - Bottom line: tactical focus (support/resistance, earnings, macro releases).
        """
        try:
            time.sleep(3) # Prevent rate limits
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            import traceback
            print(f"Gemini podcast generation error: {e}")
            return f"Error: {str(e)}\n{traceback.format_exc()}"
            
    return f"מפתח הגישה לא מוגדר בשרת, ולכן הפודקאסט מנותק מהמוח הכלכלי ל-{today_str}."

async def create_edition():
    news = fetch_top_news()
    script = generate_podcast_script(news)
    
    timestamp = int(time.time())
    edition_id = f"edition_{timestamp}"
    mp3_filename = f"{edition_id}.mp3"
    mp3_path = os.path.join(ARCHIVE_DIR, mp3_filename)
    
    # Run edge-tts asynchronously, with a fallback to gTTS on failure (e.g. cloud hosting block)
    try:
        communicate = edge_tts.Communicate(script, "he-IL-AvriNeural")
        await communicate.save(mp3_path)
    except Exception as e:
        print(f"Edge-TTS failed ({e}). Falling back to gTTS...")
        try:
            from gtts import gTTS
            tts = gTTS(text=script, lang='iw')
            tts.save(mp3_path)
            print("Successfully generated podcast audio using gTTS fallback.")
        except Exception as ge:
            print(f"gTTS fallback failed: {ge}")
            raise ge
    
    metadata = {
        "id": edition_id,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "timestamp": timestamp,
        "title": f"מבזק השוק היומי - {datetime.now().strftime('%H:%M')}",
        "script": script,
        "mp3_url": f"/api/podcasts/audio/{mp3_filename}"
    }
    
    meta_path = os.path.join(ARCHIVE_DIR, f"{edition_id}.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
        
    print(f"Generated edge-tts edition: {edition_id}")
    return metadata

def get_archive():
    editions = []
    if not os.path.exists(ARCHIVE_DIR):
        return editions
        
    for file in os.listdir(ARCHIVE_DIR):
        if file.endswith(".json"):
            with open(os.path.join(ARCHIVE_DIR, file), "r", encoding="utf-8") as f:
                editions.append(json.load(f))
    
    editions.sort(key=lambda x: x["timestamp"], reverse=True)
    return editions

async def setup_mock_history():
    if not os.path.exists(ARCHIVE_DIR) or len([f for f in os.listdir(ARCHIVE_DIR) if f.endswith('.json')]) < 1:
        await create_edition()

_updating = False

def get_latest_scheduled_slot():
    now = datetime.now()
    slot1 = now.replace(hour=12, minute=0, second=0, microsecond=0)
    slot2 = now.replace(hour=22, minute=0, second=0, microsecond=0)
    
    if now >= slot2:
        return slot2
    elif now >= slot1:
        return slot1
    else:
        yesterday = now - timedelta(days=1)
        return yesterday.replace(hour=22, minute=0, second=0, microsecond=0)

async def check_and_update_podcast():
    global _updating
    if _updating:
        return
    _updating = True
    try:
        archive = get_archive()
        latest_slot = get_latest_scheduled_slot()
        latest_slot_ts = int(latest_slot.timestamp())
        
        if not archive or archive[0]["timestamp"] < latest_slot_ts:
            print(f"Podcast archive is out of date. Latest slot: {latest_slot}. Creating new edition...")
            await create_edition()
        else:
            print("Podcast archive is up to date.")
    except Exception as e:
        print(f"Error checking/updating podcast: {e}")
    finally:
        _updating = False
