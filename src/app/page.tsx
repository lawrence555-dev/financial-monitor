"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import TickerTape from "@/components/TickerTape";
import FhcCard from "@/components/FhcCard";
import StockListItem from "@/components/StockListItem";
import ChipChart from "@/components/ChipChart";
import { Search, Bell, Filter, X, TrendingUp, TrendingDown, BrainCircuit, LayoutGrid, List, Clock, Globe, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";

// 13 FHC Stocks - Initial structure only, prices loaded dynamically
const STOCK_IDS = [
  { id: "2881", name: "富邦金", category: "民營" as const },
  { id: "2882", name: "國泰金", category: "民營" as const },
  { id: "2886", name: "兆豐金", category: "官股" as const },
  { id: "2891", name: "中信金", category: "民營" as const },
  { id: "2880", name: "華南金", category: "官股" as const },
  { id: "2884", name: "玉山金", category: "民營" as const },
  { id: "2892", name: "第一金", category: "官股" as const },
  { id: "2885", name: "元大金", category: "民營" as const },
  { id: "2887", name: "台新新光金", category: "民營" as const },
  { id: "2890", name: "永豐金", category: "民營" as const },
  { id: "2883", name: "凱基金", category: "民營" as const },
  { id: "2889", name: "國票金", category: "民營" as const },
  { id: "5880", name: "合庫金", category: "官股" as const },
];

export default function DashboardPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [stocks, setStocks] = useState(
    STOCK_IDS.map(s => ({
      ...s,
      price: 0,
      diff: 0,
      change: 0,
      isUp: false,
      pbValue: 0,
      pbPercentile: 50,
      data: [] as any[],
      chipData: [] as any[]
    }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<{ summary: string; sentimentScore: number; highlight: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isChipLoading, setIsChipLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "民營" | "官股">("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const selectedStock = stocks.find(s => s.id === selectedId);

  // Filtered stocks based on search and category
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.name.includes(searchQuery) || stock.id.includes(searchQuery);
    const matchesFilter = filterCategory === "all" || stock.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  // Handle stock click
  const handleStockClick = (stockId: string) => {
    setSelectedId(stockId === selectedId ? null : stockId);
  };

  useEffect(() => {
    setMounted(true);

    const fetchRealtimePrices = async () => {
      try {
        const res = await fetch("/api/stock-prices/realtime");
        const realData = await res.json();
        if (Array.isArray(realData) && realData.length > 0) {
          setStocks(prev => prev.map(s => {
            const real = realData.find((r: any) => r.id === s.id);
            if (!real) return s;
            return {
              ...s,
              price: real.price || s.price,
              change: real.change || s.change,
              diff: real.diff || s.diff,
              isUp: (real.diff || 0) >= 0,
              pbValue: real.pbValue || s.pbValue,
              pbPercentile: real.pbPercentile || s.pbPercentile
            };
          }));
        }
      } catch (e) {
        console.error("Real-time poll failed", e);
      }
    };

    const fetchIntradayHistory = async () => {
      const intradayPromises = STOCK_IDS.map(async (s) => {
        try {
          const intraRes = await fetch(`/api/stock-prices/intraday?stockId=${s.id}`);
          const intraData = await intraRes.json();
          return { id: s.id, history: intraData };
        } catch (e) {
          return { id: s.id, history: [] };
        }
      });
      const allHistory = await Promise.all(intradayPromises);
      setStocks(prev => prev.map(s => {
        const historyItem = allHistory.find(h => h.id === s.id);
        const history = Array.isArray(historyItem?.history) ? historyItem.history : [];
        return { ...s, data: history };
      }));
    };

    const initData = async () => {
      setMounted(true);
      try {
        await fetchRealtimePrices();
        await fetchIntradayHistory();
      } catch (e) {
        console.error("Initial data fetch failed.", e);
      }
    };

    initData();

    // 實時更新系統時鐘 (每秒)
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 實時價格輪詢 (每 30 秒)
    const priceInterval = setInterval(fetchRealtimePrices, 30000);

    // 線圖走勢輪詢 (每 2 分鐘) - 從 5 分鐘縮短為 2 分鐘
    const historyInterval = setInterval(fetchIntradayHistory, 120000);

    // 圖表時間過濾更新 (每 1 分鐘) - 觸發 FhcCard 重新計算過濾後的數據
    const chartUpdateInterval = setInterval(() => {
      // Force re-render by updating a state that FhcCard depends on
      setStocks(prev => [...prev]);
    }, 60000);

    // 收盤後額外同步 (13:35 執行一次) - 確保獲取完整收盤數據
    const checkPostMarketSync = () => {
      const now = new Date();
      const taipeiTime = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Taipei'
      }).format(now);

      // 在 13:35 執行一次額外同步
      if (taipeiTime === '13:35') {
        console.log('[Post-Market Sync] Fetching final closing data...');
        fetchIntradayHistory();
      }
    };

    const postMarketCheckInterval = setInterval(checkPostMarketSync, 60000); // 每分鐘檢查一次

    return () => {
      clearInterval(clockInterval);
      clearInterval(priceInterval);
      clearInterval(historyInterval);
      clearInterval(chartUpdateInterval);
      clearInterval(postMarketCheckInterval);
    };
  }, []);

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('viewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  // Data backfill: Check for missing 13:30 data after market close
  useEffect(() => {
    const checkAndBackfillData = async () => {
      const now = new Date();
      const taipeiTime = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Taipei'
      }).format(now);

      const [hour, minute] = taipeiTime.split(':').map(Number);
      const currentMinutes = hour * 60 + minute;

      // Only check if time is past 13:35 (post-market sync time)
      if (currentMinutes >= 13 * 60 + 35) {
        // Check if any stock is missing 13:30 data
        const needsBackfill = stocks.some(stock => {
          if (stock.data.length === 0) return false;

          const lastDataPoint = stock.data[stock.data.length - 1];
          if (!lastDataPoint.time) return false;

          // Check if last data point is before 13:30
          const [lastHour, lastMinute] = lastDataPoint.time.split(':').map(Number);
          const lastMinutes = lastHour * 60 + lastMinute;
          const marketCloseMinutes = 13 * 60 + 30; // 13:30

          return lastMinutes < marketCloseMinutes;
        });

        if (needsBackfill) {
          console.log('[Backfill] Missing 13:30 data detected, fetching...');
          // Directly fetch intraday data
          const intradayPromises = STOCK_IDS.map(async (s) => {
            try {
              const intraRes = await fetch(`/api/stock-prices/intraday?stockId=${s.id}`);
              const intraData = await intraRes.json();
              return { id: s.id, history: intraData };
            } catch (e) {
              return { id: s.id, history: [] };
            }
          });
          const allHistory = await Promise.all(intradayPromises);
          setStocks(prev => prev.map(s => {
            const historyItem = allHistory.find(h => h.id === s.id);
            const history = Array.isArray(historyItem?.history) ? historyItem.history : [];
            return { ...s, data: history };
          }));
        }
      }
    };

    // Check once when stocks data changes
    if (stocks.length > 0 && stocks[0].data.length > 0) {
      checkAndBackfillData();
    }
  }, [stocks]);

  // Fetch AI Summary when selectedId changes
  useEffect(() => {
    if (selectedId && selectedStock) {
      const fetchAiSummary = async () => {
        setIsAiLoading(true);
        try {
          const response = await fetch("/api/ai-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stockName: selectedStock.name,
              stockId: selectedStock.id
            }),
          });
          const data = await response.json();
          setAiSummary(data);
        } catch (error) {
          console.error("Failed to fetch AI summary:", error);
          setAiSummary({
            summary: "目前無法取得 AI 摘要服務。",
            sentimentScore: 0,
            highlight: "連線超時"
          });
        } finally {
          setIsAiLoading(false);
        }
      };
      fetchAiSummary();
    } else {
      setAiSummary(null);
    }
  }, [selectedId, selectedStock]);

  // Fetch Real Chip Data when selectedId changes
  useEffect(() => {
    if (selectedId) {
      const fetchChipData = async () => {
        setIsChipLoading(true);
        try {
          const chipRes = await fetch(`/api/stock-chips?id=${selectedId}&days=10`);
          const realChipData = await chipRes.json();
          if (Array.isArray(realChipData)) {
            setStocks(prev => prev.map(s =>
              s.id === selectedId ? { ...s, chipData: realChipData } : s
            ));
          }
        } catch (error) {
          console.error("Failed to fetch real chip data:", error);
        } finally {
          setIsChipLoading(false);
        }
      };
      fetchChipData();
    }
  }, [selectedId]);

  // simulation: We've disabled the random walk as requested.
  // The system now only uses live data or the fixed production values.
  useEffect(() => {
    if (!mounted) return;
    // Periodic refresh logic could be added here in the future to call initData again
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] pl-20 transition-all duration-700 font-inter">
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <TickerTape />

        <main className="flex-1 p-8 pt-6 relative overflow-hidden">
          {/* Dashboard Header */}
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter mb-3 font-archivo italic">
                CORTEX <span className="text-accent">X13</span>
              </h1>
              {mounted && (
                <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black font-fira uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-2 py-1 rounded-md border border-accent/20">
                    <ShieldCheck size={12} />
                    <span>SECURE NODE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-accent/50" />
                    <span>SYSTIME: {currentTime.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={12} className="text-accent/50" />
                    <span>REGION: ASIA/TAIPEI</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="搜尋代號或名稱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rise/50 transition-all w-64"
                />
              </div>
              <div className="flex bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden p-1">
                {["all", "民營", "官股"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat as any)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-black transition-all",
                      filterCategory === cat ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                    )}
                  >
                    {cat === "all" ? "全部" : cat}
                  </button>
                ))}
              </div>
              <div className="flex bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    viewMode === 'grid' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                  )}
                  title="網格模式"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    viewMode === 'list' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                  )}
                  title="列表模式"
                >
                  <List size={18} />
                </button>
              </div>
              <button
                onClick={() => showToast("通知功能已啟動：當價值警報觸發時，系統將自動推播。", "success")}
                className="p-3 glass hover:glass-hover text-slate-400 hover:text-white transition-all relative"
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rise rounded-full" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Stock Display Area */}
            <div className={cn(
              "transition-all duration-500",
              // List mode: always full width, Grid mode: add padding for fixed panel
              viewMode === 'list'
                ? "xl:col-span-12"
                : (selectedId ? "xl:col-span-12 xl:pr-[420px]" : "xl:col-span-12")
            )}>
              {viewMode === 'grid' ? (
                // Bento Grid Mode
                <div className={cn(
                  "grid gap-6",
                  selectedId
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                )}>
                  {filteredStocks.map((stock, idx) => (
                    <div
                      key={stock.id}
                      onClick={() => handleStockClick(stock.id)}
                      className={cn(
                        "cursor-pointer",
                        !selectedId && (idx === 0 || idx === 7) ? "md:col-span-2 md:row-span-1" : ""
                      )}
                    >
                      <FhcCard
                        {...stock}
                        pbPercentile={stock.pbPercentile}
                      />
                    </div>
                  ))}

                  {!selectedId && (
                    <div className="glass bg-gradient-to-br from-accent/20 via-accent/5 to-transparent border-accent/30 p-8 flex flex-col justify-center items-center text-center group cursor-pointer hover:border-accent transition-all md:col-span-2">
                      <div className="w-20 h-20 bg-accent/20 rounded-3xl flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                        <BrainCircuit size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2 font-archivo uppercase">Neural Value Tracking</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed mb-8 opacity-60">
                        Institutional P/B divergence detected.<br />Deploy automated alerts on 5% percentile crosses.
                      </p>
                      <Link href="/subscription" className="w-full max-w-sm">
                        <button className="w-full py-4 bg-accent text-slate-950 rounded-2xl font-black shadow-lg shadow-accent/20 hover:bg-white active:scale-95 transition-all uppercase tracking-widest text-[11px]">
                          Initialize Elite Node
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
                </div>
              ) : (
                // List Mode
                <div className="flex flex-col gap-4">
                  {filteredStocks.map((stock) => (
                    <div key={stock.id} onClick={() => handleStockClick(stock.id)} className="cursor-pointer group">
                      <div className="glass p-6 flex justify-between items-center hover:glass-hover transition-all duration-300">
                        <div className="flex items-center gap-6">
                           <div className="flex flex-col">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/5 text-slate-500 font-fira tracking-widest">{stock.id}</span>
                               <span className={cn(
                                 "text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest font-fira",
                                 stock.category === "官股" ? "bg-accent/10 text-accent" : "bg-purple-500/10 text-purple-400"
                               )}>{stock.category}</span>
                             </div>
                             <h3 className="text-xl font-black text-white tracking-tighter font-archivo italic">{stock.name}</h3>
                           </div>
                        </div>
                        <div className="text-right flex items-center gap-12">
                           <div className="flex flex-col items-end">
                             <div className="text-2xl font-black font-fira tracking-tighter text-white">{stock.price.toFixed(2)}</div>
                             <div className={cn(
                               "flex items-center gap-1 text-[10px] font-black font-fira",
                               stock.change > 0 ? "text-rise" : "text-fall"
                             )}>
                               {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}%
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Stock Detail Panel (Multi-Chart Linkage) */}
            <AnimatePresence>
              {selectedId && selectedStock && viewMode === 'grid' && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="fixed right-0 top-0 w-[400px] h-screen glass border-white/10 bg-slate-900/60 p-8 flex flex-col gap-8 overflow-y-auto z-40"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tighter">{selectedStock.name}</h2>
                      <p className="text-slate-500 font-mono font-bold">{selectedStock.id} · {selectedStock.category}</p>
                    </div>
                    <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-10">
                    <div>
                      <p className="text-[10px] font-black text-accent/40 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        CHIP FLOW MATRIX (10D)
                        {isChipLoading && <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />}
                      </p>
                      <div className={cn("transition-opacity duration-300", isChipLoading ? "opacity-30" : "opacity-100")}>
                        <ChipChart data={selectedStock.chipData} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className={cn("p-5 bg-white/[0.02] rounded-[1.5rem] border transition-all duration-500", isChipLoading ? "border-accent/20 animate-pulse" : "border-white/5 hover:border-white/10")}>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 font-fira">Institutions (15D)</p>
                        <p className="text-2xl font-black text-accent font-fira tracking-tighter">
                          {isChipLoading ? "---" : selectedStock.chipData.reduce((acc, curr) => acc + curr.institutional, 0).toLocaleString()}
                          <span className="text-[10px] text-slate-600 font-bold ml-1 uppercase">Units</span>
                        </p>
                      </div>
                      <div className={cn("p-5 bg-white/[0.02] rounded-[1.5rem] border transition-all duration-500", isChipLoading ? "border-fall/20 animate-pulse" : "border-white/5 hover:border-white/10")}>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 font-fira">Government (15D)</p>
                        <p className="text-2xl font-black text-fall font-fira tracking-tighter">
                          {isChipLoading ? "---" : selectedStock.chipData.reduce((acc, curr) => acc + curr.government, 0).toLocaleString()}
                          <span className="text-[10px] text-slate-600 font-bold ml-1 uppercase">Units</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-accent/40 uppercase tracking-[0.3em] flex items-center gap-2">
                        GEMINI 1.5 PRO ANALYSIS
                        {isAiLoading && <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping ml-1" />}
                      </p>
                      <div className={cn(
                        "p-6 rounded-[2rem] border transition-all duration-700 leading-relaxed text-slate-300 text-[11px] font-medium font-space",
                        isAiLoading ? "bg-white/[0.02] border-white/5 animate-pulse" : "bg-gradient-to-br from-accent/5 to-transparent border-white/5"
                      )}>
                        {isAiLoading ? "Analyzing real-time market sentiment and financial disclosures..." : (
                          aiSummary ? (
                            <div className="space-y-4">
                              <p className="leading-6">「{aiSummary.summary}」</p>
                              <div className="flex items-center gap-4 pt-4 border-t border-white/5 mt-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] uppercase font-black text-slate-500 font-fira">Sentiment Map</span>
                                  <span className={cn(
                                    "text-xs font-black font-fira px-2 py-0.5 rounded",
                                    aiSummary.sentimentScore > 0 ? "bg-rise/10 text-rise" : "bg-fall/10 text-fall"
                                  )}>
                                    {aiSummary.sentimentScore > 0 ? "+" : ""}{aiSummary.sentimentScore}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : "Insufficient data for neural synthesis."
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-6 pt-6 border-t border-white/5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-fira">Retail FOMO Index</span>
                        <span className={cn(
                          "text-xs font-black font-fira",
                          Math.abs(selectedStock.change) > 2 ? "text-rise" : "text-fall"
                        )}>
                          {(() => {
                            const volatility = Math.abs(selectedStock.change);
                            const priceDeviation = selectedStock.isUp ? selectedStock.change : 0;
                            const fomoScore = Math.min(100, Math.round(volatility * 40 + priceDeviation * 30 + 20));
                            const level = fomoScore > 70 ? " (EXTREME)" : fomoScore > 50 ? " (HIGH)" : " (NOMINAL)";
                            return `${fomoScore}/100 ${level}`;
                          })()}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rise shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all duration-1000" style={{
                          width: `${Math.min(100, Math.round(
                            Math.abs(selectedStock.change) * 40 +
                            (selectedStock.isUp ? selectedStock.change * 30 : 0) +
                            20
                          ))}%`
                        }} />
                      </div>
                    </div>
                    <Link href={`/report/${selectedStock.id}`} className="w-full">
                      <button className="w-full py-5 bg-accent text-slate-950 rounded-2xl font-black shadow-lg shadow-accent/20 hover:bg-white active:scale-95 transition-all text-[11px] uppercase tracking-widest">
                        Access Deep Intelligence Report
                      </button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="p-8 border-t border-white/5 flex justify-between items-center text-slate-600 mt-auto">
          <div className="text-xs font-bold">
            © 2026 FHC-Elite. 專為金融股投資者打造的精密價值導航。
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Link href="/docs/product-guide" className="hover:text-white transition-colors">產品指南</Link>
            <Link href="/docs/data-sources" className="hover:text-white transition-colors">數據來源</Link>
            <Link href="/docs/changelog" className="hover:text-white transition-colors">開發日誌 (MVP v0.1)</Link>
          </div>
        </footer>
      </div >
    </div >
  );
}
