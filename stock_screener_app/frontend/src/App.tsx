import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Activity, TrendingUp, Zap, Server, Globe, MessageSquare, Send, X, BarChart2, PieChart, Activity as ActivityIcon, LineChart as LineChartIcon, Sun, Moon, Play, Pause, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from 'recharts';
import './index.css';

interface ScreenerResult {
  Ticker: string;
  Name: string;
  ROIC_5Yr: string;
  FCF_Growth: string;
  EPS_Growth_Qtr: number;
  ROE: number;
  RPS: number;
  Alert: string;
  AI_Summary: string;
  Simple_Explanation?: string;
}

interface InvestmentThesis {
  Ticker: string;
  Name: string;
  Sector: string;
  WhyTracked: string;
  WhereIsEdge: string;
  TimingValuation: string;
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
    podcastTitle: "הדופק של השוק",
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
    podcastTitle: "The Pulse of the Market",
    nextBroadcast: "Next broadcast in:",
    archive: "Edition Archive (48 Hours)"
  }
};

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
  const [activePodcast, setActivePodcast] = useState<PodcastEdition | null>(null);
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

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedStock, setSelectedStock] = useState<ScreenerResult | null>(null);

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('alpha-theme') as 'dark' | 'light' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('alpha-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.error("Audio play error:", err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedToggle = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setPlaybackRate(nextRate);
    audioRef.current.playbackRate = nextRate;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.playbackRate = playbackRate;
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const loadPodcast = (podcast: PodcastEdition) => {
    setActivePodcast(podcast);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.src = podcast.mp3_url;
      audioRef.current.load();
      setTimeout(() => {
        audioRef.current?.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error("Audio play error:", err));
      }, 100);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const getBearCase = (ticker: string) => {
    const bearCases: Record<string, string> = {
      "PLTR": lang === 'he' 
        ? "הערכת שווי גבוהה במיוחד ביחס למכירות (High P/S multiple), תלות רבה בחוזים ממשלתיים שעשויים להצטמצם, וקושי בחדירה לשוק הארגוני האזרחי מול ענקיות הענן הוותיקות." 
        : "Extremely high valuation multiple (P/S), heavy reliance on government contracts which may face budgetary headwinds, and friction in commercial scaling against legacy SaaS players.",
      "NVDA": lang === 'he' 
        ? "תחרות גוברת מצד מעבדי AI עצמאיים של גוגל (TPU) ואמזון (Trainium), מחזוריות של שוק השבבים, ורמת ציפיות היסטורית שאינה משאירה מקום לטעויות בדוחות הבאים." 
        : "Growing internal silicon threats from cloud hyperscalers (Google TPU, Amazon Trainium), cyclical nature of semiconductors, and priced-for-perfection valuation with no margin for error.",
      "ESLT.TA": lang === 'he' 
        ? "שחיקת רווחיות תפעולית עקב עליית עלויות שכר חריגה בישראל, פגיעה במוניטין בשווקים אירופאיים מסוימים עקב רגישות פוליטית, ותלות תקציבית במשרד הביטחון." 
        : "Operational margin contraction due to high domestic wage inflation, potential geopolitical pushback in European markets, and heavy dependency on Israeli Defense Ministry budgets.",
      "RTX": lang === 'he' 
        ? "עלויות קרקוע מנועי GTF של חטיבת פראט אנד ויטני שמובילות להפרשות כבדות, וקצב צמיחה מתון בהשוואה לסקטור הטכנולוגי." 
        : "Long-term liability overhang from Pratt & Whitney GTF engine recalls leading to heavy cash outflows, and structural lag in commercial aviation relative to tech growth.",
      "NXSN.TA": lang === 'he' 
        ? "סיכון ריכוזיות לקוחות גבוה (תלות במספר קטן של אינטגרטורים), תחרות גוברת מצד רכיבי הרכבה זולים מסין, ורגולציה מחמירה על ייצוא טכנולוגיות כטב\"מים." 
        : "Significant customer concentration risk (dependency on key defense aggregators), rising cheap component competition from Chinese manufacturers, and tight regulatory export controls."
    };
    return bearCases[ticker] || (lang === 'he' ? "לא הוגדרו סיכונים ספציפיים עבור מנייה זו." : "No specific risks defined for this asset.");
  };

  const t = translations[lang];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const universeRes = await axios.get('/api/universe');
        setUniverseCount(universeRes.data.count);
        
        const res = await axios.get('/api/screener-results');
        setResults(res.data);

        const ta100Res = await axios.get('/api/ta100');
        setTa100Results(ta100Res.data);
        
        const sectorsRes = await axios.get('/api/sectors/deep-dive');
        setDeepDiveSectors(sectorsRes.data);
        
        const podcastsRes = await axios.get('/api/podcasts');
        setPodcasts(podcastsRes.data);
        if (podcastsRes.data.length > 0) {
          setActivePodcast(podcastsRes.data[0]);
        }
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
    if (isChatOpen && chatMessages.length === 0) {
      const initialMsg = lang === 'he'
        ? "┌────────────────────────────────────────────────────────┐\n**[ALPHA ANALYST TERMINAL]**\nאנא הזן סימול מניה (Ticker) לניתוח (למשל: NVDA, PLTR, או מניה ישראלית כמו ESLT.TA):\n└────────────────────────────────────────────────────────┘"
        : "┌────────────────────────────────────────────────────────┐\n**[ALPHA ANALYST TERMINAL]**\nPlease enter a stock Ticker to analyze (e.g., NVDA, PLTR, or Israeli stock like ESLT.TA):\n└────────────────────────────────────────────────────────┘";
      setChatMessages([{ id: 'init', role: 'ai', content: initialMsg }]);
    }
  }, [isChatOpen, lang, chatMessages.length]);

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
    const updatedMessages = [...chatMessages, newUserMsg];
    setChatMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    // Map messages to the history format expected by the API
    const historyPayload = chatMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [msg.content]
    }));

    try {
      const res = await axios.post('/api/chat', { 
        message: newUserMsg.content, 
        history: historyPayload, 
        language: lang 
      });
      setTimeout(() => {
        setIsTyping(false);
        setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: res.data.reply }]);
      }, 500);
    } catch (err) {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: 'Network Error.' }]);
    }
  };

  const [selectedThesis, setSelectedThesis] = useState<InvestmentThesis | null>(null);
  const [thesisModalOpen, setThesisModalOpen] = useState(false);
  const [thesisLoading, setThesisLoading] = useState(false);

  const openChartModal = async (ticker: string) => {
    setSelectedTicker(ticker);
    setChartModalOpen(true);
    setChartLoading(true);
    try {
      const res = await axios.get(`/api/chart/${ticker}`);
      setChartData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChartLoading(false);
    }
  };

  const openThesisModal = async (ticker: string) => {
    setSelectedThesis(null);
    setThesisModalOpen(true);
    setThesisLoading(true);
    try {
      const res = await axios.get(`/api/thesis/${ticker}`);
      setSelectedThesis(res.data);
    } catch (err) {
      console.error("Error fetching thesis:", err);
    } finally {
      setThesisLoading(false);
    }
  };

  return (
    <div className={`app-container ${lang === 'he' ? 'rtl' : 'ltr'}`} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <BackgroundSlideshow />
      
      {/* Premium Top Action Bar */}
      <div className="top-actions">
        <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          {theme === 'dark' ? <Sun size={16} className="sun-icon" /> : <Moon size={16} className="moon-icon" />}
        </button>
        <button className="lang-btn-modern" onClick={toggleLang}>
          <Globe size={16} /> <span>{t.langToggle}</span>
        </button>
      </div>

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
          
          {/* Collapsible Transcript & Podcast Card */}
          {podcasts.length > 0 && (
            <div className="podcast-transcript-card">
              <div className="podcast-card-header-flex">
                <div className="podcast-live-indicator">
                  <div className="pulsing-live"></div>
                  <span className="podcast-card-title">
                    <Globe size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> 
                    {lang === 'he' ? 'הדופק של השוק - מהדורה קולית' : 'The Market Pulse - Audio Edition'}
                  </span>
                </div>
                <span className="countdown-small">{t.nextBroadcast} <strong>{countdown}</strong></span>
              </div>
              
              <div className="podcast-card-body">
                <div className="active-podcast-meta">
                  <span className="active-podcast-title">{activePodcast?.title || podcasts[0].title}</span>
                  <span className="active-podcast-date">{activePodcast?.date || podcasts[0].date}</span>
                </div>
                
                <details className="podcast-script-details" open>
                  <summary className="script-summary-btn">
                    <span>{lang === 'he' ? 'תמלול השידור הכלכלי' : 'View Broadcast Transcript'}</span>
                    <span className="arrow-down">▾</span>
                  </summary>
                  <div className="podcast-script-text">
                    {activePodcast?.script || podcasts[0].script}
                  </div>
                </details>

                <details className="podcast-archive-details">
                  <summary className="archive-summary-btn">
                    <span>{t.archive}</span>
                    <span className="arrow-down">▾</span>
                  </summary>
                  <div className="archive-list-container">
                    {podcasts.map(p => (
                      <div key={p.id} className={`archive-podcast-item ${activePodcast?.id === p.id ? 'active' : ''}`} onClick={() => loadPodcast(p)}>
                        <div className="archive-item-info">
                          <span className="archive-item-title">{p.title}</span>
                          <span className="archive-item-date">{p.date}</span>
                        </div>
                        <button className="archive-play-btn" onClick={(e) => { e.stopPropagation(); loadPodcast(p); }}>
                          {activePodcast?.id === p.id && isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
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
                  <div 
                    key={stock.Ticker} 
                    className="stock-card clickable-card"
                    onClick={() => setSelectedStock(stock)}
                  >
                    <div className="stock-card-header">
                      <h2 className="stock-card-ticker">{stock.Ticker}</h2>
                      <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                        <button className="chart-btn" onClick={(e) => { e.stopPropagation(); openChartModal(stock.Ticker); }}>
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
                      {stock.Simple_Explanation ? (
                        <div className="ai-summary simple" style={{ padding: '1rem', marginTop: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid #10b981' }}>
                          <h4 style={{ color: '#10b981', margin: '0 0 0.5rem 0' }}><Zap size={16} style={{display:'inline'}}/> TL;DR (Beginner)</h4>
                          <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: 0 }}>{stock.Simple_Explanation}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="card-click-prompt">
                      <span>{lang === 'he' ? 'לחץ לניתוח ROIC, תזרים חופשי וסיכונים ➔' : 'Click for ROIC, FCF, & Risk deep dive ➔'}</span>
                      <Info size={12} />
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
              <span className="sidebar-item-label">Defense (ביטחון)</span>
              <span className="sidebar-item-value up">+1.5%</span>
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
                          <div 
                            key={st.symbol} 
                            className="deep-dive-stock-row clickable-row"
                            onClick={() => openThesisModal(st.symbol)}
                            title={lang === 'he' ? 'לחץ לצפייה בתזת השקעות' : 'Click to view investment thesis'}
                          >
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

      {/* Bottom Sheet Drawer for Selected Stock */}
      {selectedStock && (
        <div className="bottom-sheet-overlay" onClick={() => setSelectedStock(null)}>
          <div className="bottom-sheet-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-header">
              <div className="bottom-sheet-meta">
                <h3 className="bottom-sheet-ticker">{selectedStock.Ticker}</h3>
                <span className="bottom-sheet-name">{selectedStock.Name || selectedStock.Ticker}</span>
              </div>
              <button className="bottom-sheet-close-btn" onClick={() => setSelectedStock(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="bottom-sheet-body">
              <div className="bottom-sheet-section">
                <h4 className="section-title"><TrendingUp size={16} /> {lang === 'he' ? 'אנליזה טכנית ומומנטום (הספרינטר)' : 'Technical & Momentum Analysis'}</h4>
                <div className="info-grid">
                  <div className="info-card">
                    <span className="info-label">{t.rps}</span>
                    <span className="info-value">{selectedStock.RPS}</span>
                  </div>
                  <div className="info-card">
                    <span className="info-label">{lang === 'he' ? 'סטטוס פריצה' : 'Breakout Status'}</span>
                    <span className="info-value text-accent">{selectedStock.Alert}</span>
                  </div>
                </div>
              </div>

              <div className="bottom-sheet-section">
                <h4 className="section-title"><Zap size={16} /> {lang === 'he' ? 'ערך איכותי לטווח ארוך (המרתוניסט)' : 'Long-Term Moat & Quality'}</h4>
                <div className="info-grid">
                  <div className="info-card">
                    <span className="info-label">ROIC (5 Years)</span>
                    <span className="info-value text-success">{selectedStock.ROIC_5Yr || "N/A"}</span>
                  </div>
                  <div className="info-card">
                    <span className="info-label">FCF Growth</span>
                    <span className="info-value text-success">{selectedStock.FCF_Growth || "N/A"}</span>
                  </div>
                  <div className="info-card">
                    <span className="info-label">ROE</span>
                    <span className="info-value">{(selectedStock.ROE * 100).toFixed(1)}%</span>
                  </div>
                  <div className="info-card">
                    <span className="info-label">EPS Growth (Qtr)</span>
                    <span className="info-value">+{Math.round(selectedStock.EPS_Growth_Qtr * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="bottom-sheet-section bear-case-container">
                <h4 className="section-title bear"><ActivityIcon size={16} /> {lang === 'he' ? 'תרחיש דובי וסיכוני מפתח (Bear Case)' : 'Bear Case & Downside Risks'}</h4>
                <p className="bear-case-text">{getBearCase(selectedStock.Ticker)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investment Thesis Modal */}
      {thesisModalOpen && (
        <div className="modal-overlay" onClick={() => setThesisModalOpen(false)}>
          <div className="modal-content thesis-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  {selectedThesis ? `${selectedThesis.Ticker} - ${selectedThesis.Name}` : lang === 'he' ? 'טוען תזת השקעה...' : 'Loading Investment Thesis...'}
                </h2>
                {selectedThesis && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold', marginTop: '0.2rem' }}>
                    {selectedThesis.Sector}
                  </span>
                )}
              </div>
              <button className="close-btn" onClick={() => setThesisModalOpen(false)}><X size={24} /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '1.5rem 2rem' }}>
              {thesisLoading ? (
                <div className="chart-loading">
                  <Activity size={48} className="spinner" />
                </div>
              ) : selectedThesis ? (
                <div className="thesis-popup-body">
                  <div className="thesis-popup-section">
                    <h4 className="thesis-popup-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-main)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.4rem', margin: '0 0 0.5rem 0' }}>
                      <TrendingUp size={16} /> 
                      {lang === 'he' ? 'א. סיבת המעקב (Why Tracked)' : 'A. Why Tracked'}
                    </h4>
                    <p className="thesis-popup-text" style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)', margin: '0 0 1.5rem 0' }}>{selectedThesis.WhyTracked}</p>
                  </div>

                  <div className="thesis-popup-section">
                    <h4 className="thesis-popup-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-main)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.4rem', margin: '0 0 0.5rem 0' }}>
                      <Zap size={16} />
                      {lang === 'he' ? 'ב. מיקום הפוטנציאל והקטליזטור (Where is the Edge)' : 'B. Where is the Edge'}
                    </h4>
                    <p className="thesis-popup-text" style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)', margin: '0 0 1.5rem 0' }}>{selectedThesis.WhereIsEdge}</p>
                  </div>

                  <div className="thesis-popup-section">
                    <h4 className="thesis-popup-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--success)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.4rem', margin: '0 0 0.5rem 0' }}>
                      <ActivityIcon size={16} />
                      {lang === 'he' ? 'ג. למה עכשיו (Timing & Valuation Rationale)' : 'C. Timing & Valuation Rationale'}
                    </h4>
                    <p className="thesis-popup-text" style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)', margin: 0 }}>{selectedThesis.TimingValuation}</p>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
                  {lang === 'he' ? 'שגיאה בטעינת הנתונים.' : 'Error loading thesis data.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Custom Audio Player */}
      {podcasts.length > 0 && activePodcast && (
        <div className="floating-audio-player">
          <div className="player-container">
            <div className="player-left">
              <button className="player-play-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              </button>
              <div className="player-track-info">
                <span className="player-track-title">{activePodcast.title}</span>
                <span className="player-track-subtitle">{lang === 'he' ? 'הדופק של השוק' : 'The Market Pulse'}</span>
              </div>
            </div>

            {/* Waveform visualizer */}
            <div className="waveform-container" onClick={handleProgressBarClick} title={lang === 'he' ? 'לחץ לניווט בשמע' : 'Click to seek audio'}>
              <div className="progress-bar-overlay" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
              <div className="wave-bars">
                {[12, 18, 10, 24, 16, 28, 20, 14, 26, 12, 8, 16, 22, 18, 14, 20, 24, 10, 16, 12, 28, 18].map((height, i) => {
                  const percentOfAudio = (i / 22) * 100;
                  const currentPercent = (currentTime / duration) * 100;
                  const isActive = currentPercent >= percentOfAudio;
                  return (
                    <div 
                      key={i} 
                      className={`wave-bar ${isActive ? 'wave-active' : ''} ${isPlaying ? 'wave-animated' : ''}`}
                      style={{ 
                        height: `${height}px`,
                        animationDelay: `${i * 50}ms`
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="player-right">
              <button className="speed-badge" onClick={handleSpeedToggle}>
                {playbackRate}x
              </button>
              <div className="time-indicator">
                <span>{formatTime(currentTime)}</span>
                <span className="time-divider">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
          {/* Audio element itself */}
          <audio 
            ref={audioRef}
            src={activePodcast.mp3_url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
          />
        </div>
      )}

    </div>
  );
}

export default App;
