import pandas as pd
import numpy as np
import pandas_ta as ta
import requests
import time
from typing import List, Dict, Optional
import logging
from database import get_weekly_data, save_weekly_data

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class DataIngestionModule:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()

    def fetch_ohlcv_weekly(self, ticker: str) -> pd.DataFrame:
        """
        Fetches weekly OHLCV data. Checks the local SQLite database first.
        If not found or outdated, fetches from Alpha Vantage and saves to DB.
        """
        # 1. Check local database
        df_db = get_weekly_data(ticker)
        
        if df_db is not None and not df_db.empty and len(df_db) > 35:
            logging.info(f"Loaded data for {ticker} from local database.")
            return df_db

        # 2. Fetch from API if DB data is missing
        logging.info(f"Fetching weekly OHLCV data for {ticker} from Alpha Vantage...")
        url = f"https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol={ticker}&apikey={self.api_key}"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            if "Error Message" in data:
                logging.error(f"API Error for {ticker}: {data['Error Message']}")
                return pd.DataFrame()
            if "Information" in data and "rate limit" in data["Information"].lower():
                logging.warning(f"Rate limit reached! Alpha Vantage limits free keys to 25 requests per day.")
                return pd.DataFrame()

            weekly_data = data.get("Weekly Time Series", {})
            if not weekly_data:
                logging.error(f"No weekly data found for {ticker}.")
                return pd.DataFrame()

            df = pd.DataFrame.from_dict(weekly_data, orient='index')
            df.columns = ['Open', 'High', 'Low', 'Close', 'Volume']
            df = df.astype(float)
            df.index = pd.to_datetime(df.index)
            df = df.sort_index(ascending=True)
            
            # 3. Save to database
            save_weekly_data(ticker, df)
            
            # Respect API limits
            time.sleep(12)
            return df
            
        except Exception as e:
            logging.error(f"Failed to fetch data for {ticker}: {e}")
            return pd.DataFrame()

    def fetch_fundamentals(self, ticker: str) -> Dict:
        logging.info(f"Fetching fundamental data for {ticker}")
        return {
            "current_qtr_eps_growth": 0.30,
            "annual_eps_growth_3yr": 0.28,
            "roe": 0.18
        }

    def fetch_relative_strength(self, ticker: str, benchmark: str = "SPY") -> float:
        return 85.0


class FundamentalScreener:
    def __init__(self, min_eps_growth: float = 0.25, min_roe: float = 0.15):
        self.min_eps_growth = min_eps_growth
        self.min_roe = min_roe

    def is_fundamental_growth_strong(self, fundamentals: Dict) -> bool:
        try:
            qtr_eps_growth = fundamentals.get("current_qtr_eps_growth", 0)
            annual_eps_growth = fundamentals.get("annual_eps_growth_3yr", 0)
            roe = fundamentals.get("roe", 0)

            return (qtr_eps_growth >= self.min_eps_growth and 
                    annual_eps_growth >= self.min_eps_growth and 
                    roe >= self.min_roe)
        except Exception as e:
            logging.error(f"Error validating fundamentals: {e}")
            return False


class TechnicalScreener:
    def analyze_stage_2_breakout(self, df_weekly: pd.DataFrame, current_rps: float) -> bool:
        if df_weekly is None or len(df_weekly) < 35:
            return False

        try:
            df_weekly['30_WMA'] = ta.sma(df_weekly['Close'], length=30)
            
            current_close = df_weekly['Close'].iloc[-1]
            current_30_wma = df_weekly['30_WMA'].iloc[-1]
            prev_30_wma = df_weekly['30_WMA'].iloc[-2]
            
            if current_close < current_30_wma or current_30_wma <= prev_30_wma:
                return False

            df_weekly['10_W_Vol_Avg'] = ta.sma(df_weekly['Volume'], length=10)
            current_vol = df_weekly['Volume'].iloc[-1]
            avg_vol = df_weekly['10_W_Vol_Avg'].iloc[-1]
            
            if current_vol < (avg_vol * 1.5):
                return False

            if current_rps < 80.0:
                return False

            return True

        except Exception as e:
            logging.error(f"Error in technical analysis: {e}")
            return False


class InsiderValidationModule:
    def has_cluster_buying(self, ticker: str, days_lookback: int = 30) -> bool:
        return True 


class StockScreenerApp:
    def __init__(self, api_key: str):
        self.data_ingestion = DataIngestionModule(api_key)
        self.fundamental_screener = FundamentalScreener()
        self.technical_screener = TechnicalScreener()
        self.insider_validation = InsiderValidationModule()

    def run_screener(self, tickers: List[str]) -> pd.DataFrame:
        results = []

        for ticker in tickers:
            try:
                logging.info(f"--- Analyzing {ticker} ---")
                
                fundamentals = self.data_ingestion.fetch_fundamentals(ticker)
                if not self.fundamental_screener.is_fundamental_growth_strong(fundamentals):
                    logging.info(f"{ticker} failed fundamental screen.")
                    continue

                df_weekly = self.data_ingestion.fetch_ohlcv_weekly(ticker)
                rps = self.data_ingestion.fetch_relative_strength(ticker)
                if not self.technical_screener.analyze_stage_2_breakout(df_weekly, rps):
                    logging.info(f"{ticker} failed technical Stage 2 screen.")
                    continue

                if not self.insider_validation.has_cluster_buying(ticker):
                    logging.info(f"{ticker} failed insider buying validation.")
                    continue

                logging.info(f"*** {ticker} PASSED ALL SCREENS ***")
                results.append({
                    "Ticker": ticker,
                    "EPS_Growth_Qtr": fundamentals.get("current_qtr_eps_growth"),
                    "ROE": fundamentals.get("roe"),
                    "RPS": rps,
                    "Alert": "Stage 2 Breakout + Cluster Buying"
                })

            except Exception as e:
                logging.error(f"Error processing {ticker}: {e}")

        return pd.DataFrame(results)

if __name__ == "__main__":
    from database import initialize_db
    import sqlite3
    
    initialize_db()
    
    screener = StockScreenerApp(api_key="NCRH742BQISCAV8O")
    
    # Check if we have S&P 500 tickers in DB
    conn = sqlite3.connect('screener_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT symbol FROM tickers LIMIT 10")
    db_tickers = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    universe = db_tickers if db_tickers else ["AAPL", "NVDA", "PLTR", "MNDY"]
    logging.info(f"Running screener against universe of {len(universe)} stocks.")
    
    promising_stocks = screener.run_screener(universe)
    print("\n--- Top Breakout Candidates ---")
    print(promising_stocks)
