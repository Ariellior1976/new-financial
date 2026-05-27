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
        You are a senior macro-economic strategist and chief capital markets reporter, acting as "עורך תסריטים ומומחה הנדסת קול (Audio Script Engineer)" for "הדופק של השוק" (The Pulse of the Market) financial podcast.
        Your goal is to translate macro-economic updates and headlines into a phonetic, fully vocalized (with Hebrew Nikkud) script that eliminates any robotic tone from TTS engines.
        
        Today's date: {today_str}.
        This is the: {edition_title}.
        Edition Focus: {edition_focus}
        
        Review these news headlines:
        {news_items}
        
        CRITICAL RULES:
        1. THE GATEKEEPER (Aggressive Filtering):
           - Include ONLY events that act as a direct catalyst for: major stock indices (TA-35, S&P 500, Nasdaq), yields, forex (USD/ILS, EUR/ILS), or key sectors (Tech, Defense, Energy, Banks).
           
        2. TRANSMISSION MECHANISM ANALYSIS (No summarization):
           - Analyze the step-by-step transmission chain (e.g., event -> shipping rates rise -> inflation expectations -> central bank rate pressure -> tech stock drop).
           
        3. PROTOCOL NIKKUD (Absolute Nikkud):
           - Every single word in the Hebrew script MUST be fully and accurately vocalized with Hebrew Nikkud vowel signs (Kamatz, Patach, Chirik, Shva, Dagesh, Segol, Cholam, Kubutz, etc.). This is critical for correct TTS pronunciation.
           
        4. PHONETIC WRITING & NO SYMBOLS:
           - NEVER use acronyms, abbreviations, numbers, or symbols. Write everything out in full words as they are pronounced.
           - E.g., write "אַרְצוֹת הַבְּרִית" instead of "ארה"ב", "אֵס אֶנְד פִּי חֲמֵשׁ מֵאוֹת" instead of "S&P 500", "נַאסְדָּאק" instead of "Nasdaq", "אַרְבָּעָה נְקֻדָּה חֲמִישָׁה אֲחוּזִים" instead of "4.5%", "דּוֹלָרִים" instead of "דולר" or "$", "מְנַהֵל כְּלָלִי" instead of "מנכ"ל".
           
        5. PACING & BREATH CONTROL:
           - Use commas [ , ] for short half-second pauses.
           - Use ellipses [ ... ] to create dramatic pauses.
           - Use long dashes [ — ] to separate concepts and force changes in pitch.
           - Use conversational human connectors at the start of sentences (e.g., "וְכָאן...", "אֲבָל חַכּוּ...", "הַמַּשְׁמָעוּת בַּשֶּׁטַח הִיא...").
           
        6. OUTPUT STRUCTURE:
           - Output ONLY the Hebrew script text. Do not output any headings (like "פתיח" or "סיכום"), bullet points, or markdown formatting.
           - Absolute limit: 300 vocalized words.
           
        EXAMPLE OF COMPLIANT SCRIPT:
        שָׁלוֹם לָכֶם, וּבְרוּכִים הַבָּאִים אֶל הַדּוֹפֶק שֶׁל הַשּׁוּק...
        וְהַיּוֹם... דְּרָמָה שֶׁל מַמָּשׁ בְּווֹל סְטְרִיט.
        נְתוּנֵי הָאִינְפְלַצְיָה הַחֲדָשִׁים בְּאַרְצוֹת הַבְּרִית הִפְתִּיעוּ אֶת הָאֲנָלִיסְטִים כְּלַפֵּי מַעְלָה — וְהֵם מַצְבִּיעִים עַל קֶצֶב שֶׁל שְׁלֹשָׁה נְקֻדָּה שִׁבְעָה אֲחוּזִים.
        הַמַּשְׁמָעוּת בַּשֶּׁטַח הִיא... בְּרוּרָה לְגַמְרֵי.
        הַבַּנְק הַמֶּרְכָּזִי — הַפֶדֶרַל רִיזֶרְב — לֹא יְמַהֵר לְהוֹרִיד אֶת הָרִיבִּית הַגְּבוֹהָה.
        אֲבָל חַכּוּ... זֶה לֹא הַכֹּל.
        הַתְּשׁוּאוֹת עַל אִגְּרוֹת הַחוֹב הַמֶּמְשַׁלְתִּיּוֹת לְעֶשֶׂר שָׁנִים, זִנְּקוּ מִיָּד לְאַרְבָּעָה נְקֻדָּה שִׁשָּׁה אֲחוּזִים.
        וְכָאן... הַשּׁוּק מַתְחִיל לְהָגִיב בִּכְאֵב.
        מַדָּד אֵס אֶנְד פִּי חֲמֵשׁ מֵאוֹת אִיבֵּד אָחוּז נְקֻדָּה שְׁמוֹנָה בְּתוֹךְ שָׁעוֹת בּוֹדְדוֹת, וּמַדַּד הַנַּאסְדָּאק נָפַל בִּשְׁנֵי אֲחוּזִים שְׁלֵמִים.
        הַמַּשְׁמָעוּת הִיא שֶׁהַכֶּסֶף יִשָּׁאֵר יָקָר לִזְמַן מְמֻשָּׁךְ יוֹתֵר — וְהַלַּחַץ עוֹבֵר עַכְשָׁו יְשִׁירוֹת אֶל חֶבְרוֹת הַטֶּכְנוֹלוֹגְיָה הַגְּדוֹלוֹת, שֶׁיִּצְטָרְכוּ לְהוֹכִיחַ כִּי הֵן מְסֻגָּלוֹת לְהַצְדִּיק אֶת מַכְפִּילֵי הָרֶוַח הַגְּבוֹהִים שֶׁלָּהֶן, גַּם בִּתְנָאֵי מִימּוּן מַעִיקִים.
        אֲנַחְנוּ נַמְשִׁיךְ לַעֲקֹב.
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
