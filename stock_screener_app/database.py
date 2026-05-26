import sqlite3
import pandas as pd
from typing import List, Optional
import os

DB_PATH = 'screener_data.db'

def get_connection():
    return sqlite3.connect(DB_PATH)

def initialize_db():
    conn = get_connection()
    cursor = conn.cursor()
    # Table to store tickers and their metadata
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tickers (
            symbol TEXT PRIMARY KEY,
            company_name TEXT,
            sector TEXT,
            industry TEXT,
            last_updated TIMESTAMP
        )
    ''')
    
    # Table to store weekly OHLCV data
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS weekly_ohlcv (
            symbol TEXT,
            date TEXT,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume REAL,
            PRIMARY KEY (symbol, date)
        )
    ''')
    conn.commit()
    conn.close()

def save_weekly_data(symbol: str, df: pd.DataFrame):
    if df.empty:
        return
    conn = get_connection()
    # Prepare the dataframe for SQL
    df_sql = df.copy()
    df_sql['symbol'] = symbol
    df_sql['date'] = df_sql.index.astype(str)
    
    records = df_sql[['symbol', 'date', 'Open', 'High', 'Low', 'Close', 'Volume']].values.tolist()
    
    cursor = conn.cursor()
    cursor.executemany('''
        REPLACE INTO weekly_ohlcv (symbol, date, open, high, low, close, volume)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', records)
    conn.commit()
    conn.close()

def get_weekly_data(symbol: str) -> Optional[pd.DataFrame]:
    conn = get_connection()
    query = "SELECT date, open, high, low, close, volume FROM weekly_ohlcv WHERE symbol = ? ORDER BY date ASC"
    df = pd.read_sql_query(query, conn, params=(symbol,))
    conn.close()
    
    if df.empty:
        return None
        
    # Reconstruct dataframe to match expected format
    df.set_index('date', inplace=True)
    df.index = pd.to_datetime(df.index)
    df.columns = ['Open', 'High', 'Low', 'Close', 'Volume']
    return df

if __name__ == '__main__':
    initialize_db()
    print("Database initialized successfully.")
