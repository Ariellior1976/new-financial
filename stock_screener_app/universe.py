import pandas as pd
import sqlite3
import os

# Ensure DB_PATH points to the correct location
DB_PATH = 'screener_data.db'

def fetch_sp500_tickers():
    """
    Fetches S&P 500 tickers from Wikipedia and saves them to the DB.
    """
    url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
    print(f"Fetching S&P 500 from {url}...")
    
    try:
        import requests
        import io
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        tables = pd.read_html(io.StringIO(response.text))
        df = tables[0]
        
        # Wikipedia uses 'Symbol'
        tickers = df['Symbol'].tolist()
        # Replace dots with hyphens for APIs (e.g. BRK.B -> BRK-B)
        tickers = [t.replace('.', '-') for t in tickers]
        
        # Save to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Ensure table exists if DB wasn't initialized yet
        from database import initialize_db
        initialize_db()
        
        for symbol in tickers:
            cursor.execute("INSERT OR IGNORE INTO tickers (symbol) VALUES (?)", (symbol,))
        conn.commit()
        conn.close()
        
        print(f"Successfully loaded {len(tickers)} tickers into the database.")
        return tickers
    except Exception as e:
        print(f"Error fetching S&P 500 tickers. Exception type: {type(e).__name__}")
        return []

if __name__ == "__main__":
    fetch_sp500_tickers()
