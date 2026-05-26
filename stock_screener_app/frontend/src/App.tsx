import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Activity, TrendingUp, Zap, Server, Globe, MessageSquare, Send, X, BarChart2, PieChart, Activity as ActivityIcon, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from 'recharts';
import './index.css';

interface ScreenerResult {
  Ticker: string;
  EPS_Growth_Qtr: number;
  ROE: number;
  RPS: number;
  Alert: string;
  AI_Summary: string;
  Simple_Explanation?: string;
}

interface TA100Recommendation {
  Ticker: string;
  Name: string;
  Recommendation: string;
  Reason: string;
}

interface SectorStock {
  symbol: string;
  name: string;
  change: string;
}

interface DeepDiveSector {
  sector: string;
  analysis: string;
  stocks: SectorStock[];
}

interface PodcastEdition {
  id: string;
  date: string;
  timestamp: number;
  title: string;
  script: string;
  mp3_url: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface ChartDataPoint {
  date: string;
  price: number;
  event?: string;
}

const translations = {
  he: {
    title: "חמ״ל אלפא",
    tracking: "עוקב אחרי",
    targets: "מטרות מוסדיות",
    analyzing: "מנתח נתוני זמן אמת...",
    noBreakouts: "לא נמצאו חריגות היום.",
    marketWeak: "המתן להזדמנויות ברורות.",
    epsGrowth: "צמיחת רווח (Q)",
    roe: "ROE",
    rps: "RPS",
    aiSummary: "ניתוח AI",
    langToggle: "EN",
    askAi: "פקודה ל-AI...",
    chatTitle: "טרמינל AI",
    overview: "מבט שוק",
    sentiment: "סנטימנט סוחרים",
    sectors: "סקטורים מובילים",
    ta100: "מעקב מדד תל אביב 100",
    viewChart: "היסטוריית מניה",
    close: "סגור",
    price: "מחיר",
    event: "אירוע מרכזי",
    podcastTitle: "מהדורת החדשות של אלפא",
    nextBroadcast: "השידור הבא בעוד:",
    archive: "ארכיון מהדורות (48 שעות)"
  },
  en: {
    title: "ALPHA TERMINAL",
    tracking: "Tracking",
    targets: "institutional targets",
    analyzing: "Analyzing Real-Time Data...",
    noBreakouts: "No anomalies detected.",
    marketWeak: "Wait for clear setups.",
    epsGrowth: "EPS (Qtr)",
    roe: "ROE",
    rps: "RPS",
    aiSummary: "AI Analysis",
    langToggle: "HE",
    askAi: "Command AI...",
    chatTitle: "AI Terminal",
    overview: "Market Overview",
    sentiment: "Trader Sentiment",
    sectors: "Leading Sectors",
    ta100: "TA-100 Recommendations",
    viewChart: "Stock History",
    close: "Close",
    price: "Price",
    event: "Key Event",
    podcastTitle: "Alpha News Edition",
    nextBroadcast: "Next broadcast in:",
    archive: "Edition Archive (48 Hours)"
  }
};

const mockHebrewData = [
  {
    Ticker: "NVDA",
    EPS_Growth_Qtr: 0.85,
    ROE: 0.45,
    RPS: 95,
    Alert: "פריצה שלב 2 + קניית מוסדיים",
    AI_Summary: "אנבידיה במומנטום חריג. אלגוריתם הסריקה שלנו מזהה 'פריצה שלב 2' קלאסית, המלווה במחזור מסחר כפול מהממוצע התלת-חודשי. ניתוח עמוק של תנועות ההון מראה כי גופים מוסדיים מבצעים קניות בלוקים (Block Trades) מאסיביות בשעה האחרונה. במקביל, החברה שומרת על עליונות טכנולוגית המשתקפת בזינוק של 85% ברווחים הרבעוניים. כל המתנדים הטכניים והפונדמנטליים תומכים בהמשך המגמה העולה.",
    Simple_Explanation: "בשפה פשוטה: החברה שברה שיאי רווחים לאחרונה, ו'הכרישים' (משקיעים גדולים מאוד) קונים עכשיו המון מניות שלה בבת אחת, מה שמעלה את המחיר ויוצר הזדמנות טובה להצטרף להצלחה."
  },
  {
    Ticker: "PLTR",
    EPS_Growth_Qtr: 0.40,
    ROE: 0.18,
    RPS: 88,
    Alert: "חציית ממוצע נע",
    AI_Summary: "פלאנטיר שוברת התנגדות מפתח היסטורית. זרימת כספים (Money Flow) חיובית במיוחד מצד קרנות גידור בשילוב עם תשואה להון (ROE) יציבה של 18%. המניה מתבססת מעל הממוצע הנע של 50 יום, והאנליזה מצביעה על סבירות גבוהה להמשך התרחבות מכפילי הרווח בעקבות צפי לחוזי ביטחון ממשלתיים חדשים.",
    Simple_Explanation: "בשפה פשוטה: פלאנטיר נמצאת במומנטום חיובי כי קרנות גדולות מאמינות שהיא הולכת לחתום על חוזים גדולים עם הממשלה. המניה עברה 'קו התנגדות' - כלומר מחיר שהיה קשה לה לעבור במשך זמן רב, ועכשיו הדרך למעלה פנויה יותר."
  }
];

const tickerItems = [
  { sym: "SPY", val: "+1.2%", up: true },
  { sym: "QQQ", val: "+1.8%", up: true },
  { sym: "IWM", val: "-0.4%", up: false },
  { sym: "VIX", val: "-5.2%", up: false },
  { sym: "AAPL", val: "+0.5%", up: true },
  { sym: "TSLA", val: "+3.1%", up: true },
  { sym: "BTC", val: "+4.5%", up: true },
  { sym: "META", val: "-1.1%", up: false }
];

const BackgroundSlideshow = () => {
  const [currentBg, setCurrentBg] = useState(0);
  const backgrounds = ['/bg1.png', '/bg2.png', '/bg3.png'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgrounds.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slideshow">
      {backgrounds.map((bg, idx) => (
        <div 
          key={bg} 
          className={`bg-image ${idx === currentBg ? 'active' : ''}`}
          style={{ backgroundImage: `url(${bg})` }}
        />
      ))}
      <div className="terminal-overlay" />
    </div>
  );
};

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label, t }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="label">{label}</p>
        <p className="price">{t.price}: ${data.price.toFixed(2)}</p>
        {data.event && (
          <div className="event-marker">
            <strong>{t.event}:</strong> {data.event}
          </div>
        )}
      </div>
    );
  }
  return null;
};

function App() {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [ta100Results, setTa100Results] = useState<TA100Recommendation[]>([]);
  const [deepDiveSectors, setDeepDiveSectors] = useState<DeepDiveSector[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastEdition[]>([]);
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [universeCount, setUniverseCount] = useState(0);
  const [lang, setLang] = useState<'he' | 'en'>('he');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const universeRes = await axios.get('http://127.0.0.1:8000/api/universe');
        setUniverseCount(universeRes.data.count);
        
        const res = await axios.get('http://127.0.0.1:8000/api/screener-results');
        setResults(lang === 'he' ? mockHebrewData : res.data);

        const ta100Res = await axios.get('http://127.0.0.1:8000/api/ta100');
        setTa100Results(ta100Res.data);
        
        const sectorsRes = await axios.get('http://127.0.0.1:8000/api/sectors/deep-dive');
        setDeepDiveSectors(sectorsRes.data);
        
        const podcastsRes = await axios.get('http://127.0.0.1:8000/api/podcasts');
        setPodcasts(podcastsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Countdown Timer Logic
    const timer = setInterval(() => {
      const now = new Date();
      let target = new Date();
      if (now.getHours() < 12) {
        target.setHours(12, 0, 0, 0);
      } else if (now.getHours() < 22) {
        target.setHours(22, 0, 0, 0);
      } else {
        target.setDate(target.getDate() + 1);
        target.setHours(12, 0, 0, 0);
      }
      
      const diff = target.getTime() - now.getTime();
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  const toggleLang = () => setLang(prev => prev === 'he' ? 'en' : 'he');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: inputValue };
    setChatMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/chat', { message: newUserMsg.content, language: lang });
      setTimeout(() => {
        setIsTyping(false);
        setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: res.data.reply }]);
      }, 1000);
    } catch (err) {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: 'Network Error.' }]);
    }
  };

  const openChartModal = async (ticker: string) => {
    setSelectedTicker(ticker);
    setChartModalOpen(true);
    setChartLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/chart/${ticker}`);
      setChartData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChartLoading(false);
    }
  };

  return (
    <div className={`app-container ${lang === 'he' ? 'rtl' : 'ltr'}`} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <BackgroundSlideshow />
      
      <button className="lang-btn" onClick={toggleLang}>
        <Globe size={16} /> {t.langToggle}
      </button>

      {/* Top Ticker Tape */}
      <div className="ticker-tape-container">
        <div className="ticker-content">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
            <div key={idx} className={`ticker-item ${item.up ? 'up' : 'down'}`}>
              <span>{item.sym}</span>
              <span>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        
        {/* Left Sidebar (Overview) */}
        <div className="glass-panel sidebar">
          <h1 className="title-3d">{t.title}</h1>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={16} /> {t.tracking} {universeCount > 0 ? universeCount : '...'} {t.targets}
          </div>

          <h3 className="sidebar-title"><ActivityIcon size={16} style={{display:'inline', marginRight:'8px'}}/> {t.overview}</h3>
          <div className="sidebar-list">
            <div className="sidebar-item">
              <span className="sidebar-item-label">S&P 500 Trend</span>
              <span className="sidebar-item-value up">Bullish</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-item-label">Market Volatility</span>
              <span className="sidebar-item-value down">Low</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-item-label">Adv/Dec Ratio</span>
              <span className="sidebar-item-value up">2.4</span>
            </div>
          </div>

          <h3 className="sidebar-title" style={{marginTop: '2rem'}}><TrendingUp size={16} style={{display:'inline', marginRight:'8px'}}/> {t.ta100}</h3>
          <div className="sidebar-list" style={{flex: 1, overflowY: 'auto'}}>
            {ta100Results.map(stock => (
              <div key={stock.Ticker} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#fff' }}>{stock.Ticker}</strong>
                  <span className={stock.Recommendation.includes('קנייה') || stock.Recommendation.includes('Buy') ? 'success' : ''} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px', color: 'var(--success)' }}>
                    {stock.Recommendation}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stock.Name}</div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: '1.4' }}>{stock.Reason}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Center Feed */}
        <div className="glass-panel main-feed">
          
          {/* Podcast Player - Compact Bar */}
          {podcasts.length > 0 && (
            <div className="podcast-bar">
              <div className="podcast-bar-left">
                <div className="pulsing-live"></div>
                <span className="podcast-title"><Globe size={16} style={{display:'inline', marginRight:'4px'}}/> {t.podcastTitle}</span>
                <span className="podcast-divider">|</span>
                <audio controls src={`http://127.0.0.1:8000${podcasts[0].mp3_url}`} className="compact-audio" />
              </div>
              <div className="podcast-bar-right">
                <span className="countdown-small">{t.nextBroadcast} <strong>{countdown}</strong></span>
                <details className="archive-dropdown">
                  <summary>טקסט וארכיון</summary>
                  <div className="dropdown-content">
                     <div className="podcast-script-small">{podcasts[0].script}</div>
                     {podcasts.slice(1).map(p => (
                       <div key={p.id} className="dropdown-item">
                         <span style={{fontSize: '0.8rem', marginBottom: '4px', display:'block'}}>{p.title}</span>
                         <audio controls src={`http://127.0.0.1:8000${p.mp3_url}`} className="compact-audio" />
                       </div>
                     ))}
                  </div>
                </details>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <Activity size={48} className="spinner" />
              <h2>{t.analyzing}</h2>
            </div>
          ) : (
            <>
              {results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                  <h3>{t.noBreakouts}</h3>
                  <p>{t.marketWeak}</p>
                </div>
              ) : (
                results.map((stock) => (
                  <div key={stock.Ticker} className="stock-card">
                    <div className="stock-card-header">
                      <h2 className="stock-card-ticker">{stock.Ticker}</h2>
                      <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                        <button className="chart-btn" onClick={() => openChartModal(stock.Ticker)}>
                          <LineChartIcon size={16} /> {t.viewChart}
                        </button>
                        <div className="alert-badge">{stock.Alert}</div>
                      </div>
                    </div>
                    <div className="metrics-grid">
                      <div className="metric-box">
                        <span className="metric-label">{t.epsGrowth}</span>
                        <span className="metric-value success">+{Math.round(stock.EPS_Growth_Qtr * 100)}%</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">{t.roe}</span>
                        <span className="metric-value">{(stock.ROE * 100).toFixed(1)}%</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">{t.rps}</span>
                        <span className="metric-value">{stock.RPS}</span>
                      </div>
                    </div>
                    
                    <div className="ai-summaries-container">
                      <div className="ai-summary pro">
                        <h4><TrendingUp size={16} style={{display:'inline'}}/> {t.aiSummary} (Pro)</h4>
                        <p>{stock.AI_Summary}</p>
                      </div>
                      {stock.Simple_Explanation && (
                        <div className="ai-summary simple">
                          <h4><Zap size={16} style={{display:'inline'}}/> TL;DR (Beginner)</h4>
                          <p>{stock.Simple_Explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Right Sidebar (Analytics) */}
        <div className="glass-panel sidebar">
          <h3 className="sidebar-title"><PieChart size={16} style={{display:'inline', marginRight:'8px'}}/> {t.sentiment}</h3>
          <div className="sidebar-list" style={{marginBottom: '2rem'}}>
            <div className="sidebar-item">
              <span className="sidebar-item-label">Retail Traders</span>
              <span className="sidebar-item-value down">Fear (34%)</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-item-label">Institutions</span>
              <span className="sidebar-item-value up">Greed (78%)</span>
            </div>
          </div>

          <h3 className="sidebar-title"><BarChart2 size={16} style={{display:'inline', marginRight:'8px'}}/> {t.sectors}</h3>
          <div className="sidebar-list">
            <div className="sidebar-item">
              <span className="sidebar-item-label">Technology</span>
              <span className="sidebar-item-value up">+2.4%</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-item-label">Healthcare</span>
              <span className="sidebar-item-value up">+0.8%</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-item-label">Energy</span>
              <span className="sidebar-item-value down">-1.2%</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-item-label">Financials</span>
              <span className="sidebar-item-value up">+0.3%</span>
            </div>
          </div>

          <h3 className="sidebar-title" style={{marginTop: '2rem'}}><BarChart2 size={16} style={{display:'inline', marginRight:'8px'}}/> מעקב סקטורים עמוק</h3>
          <div className="sidebar-list">
            {deepDiveSectors.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>מנתח נתונים...</div>
            ) : (
              deepDiveSectors.map((s, i) => (
                <details key={i} className="deep-dive-item">
                  <summary className="deep-dive-summary">
                    <span className="sidebar-item-label" style={{fontWeight: 'bold', color: 'var(--accent)'}}>{s.sector}</span>
                    <span className="expand-icon">▾</span>
                  </summary>
                  <div className="deep-dive-content">
                    <p style={{marginBottom: '0.8rem'}}>{s.analysis}</p>
                    {s.stocks && s.stocks.length > 0 && (
                      <div className="deep-dive-stocks">
                        {s.stocks.map(st => (
                          <div key={st.symbol} className="deep-dive-stock-row">
                            <span className="stock-sym">{st.symbol}</span>
                            <span className="stock-name">{st.name}</span>
                            <span className={`stock-change ${st.change.startsWith('-') ? 'down' : 'up'}`}>{st.change}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Chat UI */}
      <div className={`chat-widget ${isChatOpen ? 'open' : ''}`}>
        {!isChatOpen ? (
          <button className="chat-toggle-btn" onClick={() => setIsChatOpen(true)}>
            <MessageSquare size={24} />
          </button>
        ) : (
          <div className="chat-window">
            <div className="chat-header">
              <h3><Activity size={18} /> {t.chatTitle}</h3>
              <button className="close-btn" onClick={() => setIsChatOpen(false)}><X size={20} /></button>
            </div>
            <div className="chat-messages">
              {chatMessages.length === 0 && (
                <div className="chat-empty">
                  <MessageSquare size={32} style={{marginBottom:'1rem'}}/>
                  <p>{t.askAi}</p>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`chat-message ${msg.role}`}>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
              {isTyping && (
                <div className="chat-message ai typing">
                  <div className="message-content">
                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={t.askAi}/>
              <button type="submit" disabled={!inputValue.trim()}><Send size={18} /></button>
            </form>
          </div>
        )}
      </div>

      {/* Historical Chart Modal */}
      {chartModalOpen && (
        <div className="modal-overlay" onClick={() => setChartModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTicker} {t.viewChart} (10 Years)</h2>
              <button className="close-btn" onClick={() => setChartModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              {chartLoading ? (
                <div className="chart-loading"><Activity size={48} className="spinner" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip lang={lang} t={t} />} />
                    <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                    {/* Render dots for events */}
                    {chartData.map((entry, index) => {
                      if (entry.event) {
                        return (
                          <ReferenceDot key={index} x={entry.date} y={entry.price} r={6} fill="#f59e0b" stroke="none" />
                        );
                      }
                      return null;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
