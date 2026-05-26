import yfinance as yf
import google.generativeai as genai
import os
import json
import time
from datetime import datetime, timedelta

# Simple in-memory cache to prevent rate limits
_cache = {}
CACHE_TTL = timedelta(minutes=30)

def get_cached_or_fetch(key, fetch_func):
    now = datetime.now()
    if key in _cache:
        cached_data, timestamp = _cache[key]
        if now - timestamp < CACHE_TTL:
            return cached_data
            
    # Need to fetch
    data = fetch_func()
    _cache[key] = (data, now)
    return data

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None

def get_live_screener_results():
    def _fetch():
        tickers = ["NVDA", "PLTR", "AAPL"]
        results = []
        
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                info = stock.info
                
                # Extract metrics safely
                eps_growth = info.get('earningsQuarterlyGrowth')
                eps_growth_val = eps_growth if eps_growth is not None else 0
                
                roe = info.get('returnOnEquity')
                roe_val = roe if roe is not None else 0
                
                rps = 85  # Mock RPS for simplicity, as calculating true RPS needs index comparisons
                
                # Dynamic Alert
                alert = "מעקב בלבד"
                if roe_val > 0.15:
                    alert = "חציית ממוצע נע"
                if eps_growth_val > 0.5:
                    alert = "פריצה שלב 2 + קניית מוסדיים"
                
                if model:
                    prompt = f"""
                    You are a senior financial analyst. Analyze the stock {ticker} with the following live data:
                    EPS Growth: {eps_growth_val * 100:.1f}%
                    ROE: {roe_val * 100:.1f}%
                    Current Technical Alert: {alert}
                    
                    Write two summaries in HEBREW:
                    1. "AI_Summary": A professional, institutional-grade technical and fundamental analysis (about 40 words).
                    2. "Simple_Explanation": A very simple, beginner-friendly explanation starting with "בשפה פשוטה:" (about 25 words).
                    
                    Return ONLY a valid JSON format with keys "AI_Summary" and "Simple_Explanation". Do NOT use markdown code blocks.
                    """
                    try:
                        time.sleep(2) # Avoid rate limits
                        response = model.generate_content(prompt)
                        text = response.text.strip()
                        if text.startswith("```json"): text = text[7:]
                        if text.startswith("```"): text = text[3:]
                        if text.endswith("```"): text = text[:-3]
                        
                        gen_data = json.loads(text.strip())
                        ai_summary = gen_data.get("AI_Summary", "שגיאה בניתוח AI.")
                        simple_exp = gen_data.get("Simple_Explanation", "לא ניתן לספק הסבר.")
                    except Exception as e:
                        print(f"Gemini error for {ticker}: {e}")
                        ai_summary = f"ניתוח מושהה זמנית עקב עומס בשרתי ה-AI. נתונים פיננסיים זמינים."
                        simple_exp = f"המערכת בעומס קל, נסה שוב בעוד מספר רגעים."
                else:
                    ai_summary = "מפתח GEMINI_API_KEY חסר במערכת. הניתוח המלאכותי מושהה."
                    simple_exp = "כדי להפעיל את המוח המלאכותי, אנא הזרק מפתח API לסביבה (set GEMINI_API_KEY=YOUR_KEY)."

                results.append({
                    "Ticker": ticker,
                    "EPS_Growth_Qtr": eps_growth_val,
                    "ROE": roe_val,
                    "RPS": rps,
                    "Alert": alert,
                    "AI_Summary": ai_summary,
                    "Simple_Explanation": simple_exp
                })
            except Exception as e:
                print(f"Error fetching {ticker}: {e}")
                
        return results
        
    return get_cached_or_fetch("screener_results", _fetch)

def get_live_ta100_recommendations():
    def _fetch():
        tickers = [
            {"symbol": "ENLT.TA", "name": "אנלייט אנרגיה"},
            {"symbol": "NICE.TA", "name": "נייס"}
        ]
        
        results = []
        for item in tickers:
            try:
                stock = yf.Ticker(item["symbol"])
                hist = stock.history(period="1mo")
                if hist.empty:
                    continue
                    
                start_price = hist['Close'].iloc[0]
                end_price = hist['Close'].iloc[-1]
                trend = (end_price - start_price) / start_price
                
                if trend > 0.05:
                    rec = "קנייה חזקה"
                elif trend > 0:
                    rec = "קנייה"
                elif trend > -0.05:
                    rec = "החזק"
                else:
                    rec = "מכירה"
                    
                if model:
                    prompt = f"""
                    Stock: {item['name']} ({item['symbol']})
                    1 Month Trend: {trend*100:.1f}%
                    Recommendation: {rec}
                    
                    Write a 30-word institutional logic for this recommendation in Hebrew. No markdown, just plain text.
                    """
                    try:
                        time.sleep(2) # Avoid rate limits
                        response = model.generate_content(prompt)
                        reason = response.text.strip()
                    except Exception as e:
                        print(f"Gemini error for TA100 {item['symbol']}: {e}")
                        reason = f"הניתוח במנוחה זמנית עקב עומס קל בשרת ה-AI. הנתונים הטכניים מצביעים על {rec}."
                else:
                    reason = f"המגמה בחודש האחרון היא {trend*100:.1f}%. ספק מפתח API להסבר מפורט."
                    
                results.append({
                    "Ticker": item["symbol"],
                    "Name": item["name"],
                    "Recommendation": rec,
                    "Reason": reason
                })
            except Exception as e:
                print(f"Error TA100 {item['symbol']}: {e}")
                
        return results
        
    return get_cached_or_fetch("ta100_results", _fetch)

def get_sector_deep_dives():
    def _fetch():
        sectors = []
        
        def get_stock_changes(tickers_list):
            stocks_data = []
            for t in tickers_list:
                try:
                    stock = yf.Ticker(t['symbol'])
                    hist = stock.history(period="5d")['Close'].dropna()
                    if not hist.empty and len(hist) >= 2:
                        prev_close = hist.iloc[-2]
                        last_close = hist.iloc[-1]
                        change_pct = ((last_close - prev_close) / prev_close) * 100
                        sign = "+" if change_pct >= 0 else ""
                        stocks_data.append({
                            "symbol": t['symbol'].replace(".TA", ""),
                            "name": t['name'],
                            "change": f"{sign}{change_pct:.2f}%"
                        })
                except Exception as e:
                    print(f"Error fetching deep dive stock {t['symbol']}: {e}")
            return stocks_data

        med_stocks = get_stock_changes([
            {"symbol": "NVO", "name": "נובו נורדיסק"},
            {"symbol": "LLY", "name": "אליי לילי"},
            {"symbol": "PFE", "name": "פייזר (Pfizer)"},
            {"symbol": "AMGN", "name": "אמג'ן (Amgen)"},
            {"symbol": "VKTX", "name": "ויקינג תרפיוטיקס"}
        ])
        
        def_stocks = get_stock_changes([
            {"symbol": "ESLT.TA", "name": "אלביט מערכות"},
            {"symbol": "NXSN.TA", "name": 'נקסט ויז\'ן (כטב"מים)'},
            {"symbol": "IMCO.TA", "name": "אימקו"},
            {"symbol": "THIR.TA", "name": "עין שלישית (חיישנים)"},
            {"symbol": "ISI.TA", "name": "אימאג'סט (לוויינים)"},
            {"symbol": "ARYT.TA", "name": "ערית תעשיות"},
            {"symbol": "RSL.TA", "name": "אר.אס.אל (RSL)"},
            {"symbol": "AVAV", "name": "AeroVironment (רחפנים תוקפים)"},
            {"symbol": "KTOS", "name": 'Kratos (כטב"מי סילון)'},
            {"symbol": "RTX", "name": 'Raytheon (טילים ומכ"מים)'}
        ])
        
        if not model:
            return [
                {"sector": "רפואה (תרופות הרזיה)", "analysis": "מפתח API חסר. הניתוח מושהה.", "stocks": med_stocks},
                {"sector": "ביטחון (תעשיות ישראל)", "analysis": "מפתח API חסר. הניתוח מושהה.", "stocks": def_stocks}
            ]
            
        try:
            prompt_med = "You are a top-tier biotech stock analyst. Analyze the current state of the Obesity / GLP-1 weight-loss drug market (focusing on Novo Nordisk, Eli Lilly, and emerging competitors). Mention any recent breakthroughs, pipeline news, or major market shifts. Write a concise, professional paragraph in Hebrew (around 40-50 words) that provides deep intelligence to an investor. No markdown, just plain text."
            res_med = model.generate_content(prompt_med)
            sectors.append({"sector": "רפואה (תרופות הרזיה)", "analysis": res_med.text.strip(), "stocks": med_stocks})
            
            time.sleep(2)
            
            prompt_def = "You are a top-tier defense industry analyst in Israel. Analyze the current state of the Israeli defense sector (focusing on Elbit Systems, IAI, Rafael, etc.) in light of the recent geopolitical situation and global arms race. Mention any major recent international contracts or significant shifts in backlog/orders. Write a concise, professional paragraph in Hebrew (around 40-50 words) that provides deep intelligence to an investor. No markdown, just plain text."
            res_def = model.generate_content(prompt_def)
            sectors.append({"sector": "ביטחון (תעשיות ישראל)", "analysis": res_def.text.strip(), "stocks": def_stocks})
            
        except Exception as e:
            print(f"Error generating deep dives: {e}")
            sectors = [
                {"sector": "רפואה (תרופות הרזיה)", "analysis": "הסקטור מתאפיין בתחרות עזה על פיתוח הדור הבא של תרופות להשמנת יתר, עם עליות מתמשכות למרות רמות התמחור הגבוהות.", "stocks": med_stocks},
                {"sector": "ביטחון (תעשיות ישראל)", "analysis": "התעשייה חווה גידול דרמטי בצבר ההזמנות הגלובלי, במקביל למעבר לייצור חימוש חכם ומערכות הגנה אוויריות. מומנטום חיובי ארוך טווח.", "stocks": def_stocks}
            ]
        return sectors
        
    return get_cached_or_fetch("sector_deep_dives", _fetch)
