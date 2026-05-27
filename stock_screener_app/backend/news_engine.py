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
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""
        You are a top-tier financial analyst.
        Today's date is: {today_str}.
        Review these news headlines:
        {news_items}
        
        CRITICAL RULES:
        1. Read every headline. If it is gossip, crime, or general news with ZERO direct economic/stock market impact (e.g. "בן זוגה לשעבר של עורכת..."), you MUST IGNORE it completely. Do not mention it at all.
        2. If a headline has economic/market relevance (e.g., a stock dropping, interest rates, macro events), you must mention it and IMMEDIATELY explain the deep economic reasons behind it and its market impact. (Example: "מניית פוקס ירדה היום. המשמעות הכלכלית היא שמשקיעים חוששים מירידה בצריכה הפרטית בעקבות סביבת הריבית...")
        3. Do not just summarize. Analyze.
        
        Format the script exactly like a radio broadcast in HEBREW:
        Start with: "שלום לכולם וברוכים הבאים למהדורת החדשות הכלכליות של אלפא ל-{today_str}."
        Then transition between the selected news items, providing the deep analysis for each one immediately after mentioning it.
        End with: "עד כאן המהדורה. נתראה בעדכון הבא."
        
        Output ONLY the Hebrew script text.
        """
        try:
            time.sleep(3) # Prevent rate limits
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Gemini podcast generation error: {e}")
            return f"שלום לכולם. עקב עומס זמני על שרתי הניתוח, לא ניתן לספק את המהדורה הכלכלית המלאה ל-{today_str}. נשוב בקרוב."
            
    return f"מפתח הגישה לא מוגדר בשרת, ולכן הפודקאסט מנותק מהמוח הכלכלי ל-{today_str}."

async def create_edition():
    news = fetch_top_news()
    script = generate_podcast_script(news)
    
    timestamp = int(time.time())
    edition_id = f"edition_{timestamp}"
    mp3_filename = f"{edition_id}.mp3"
    mp3_path = os.path.join(ARCHIVE_DIR, mp3_filename)
    
    # Run edge-tts asynchronously
    communicate = edge_tts.Communicate(script, "he-IL-AvriNeural")
    await communicate.save(mp3_path)
    
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
