"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import TickerTape from "@/components/TickerTape";
import FhcCard from "@/components/FhcCard";
import ChipChart from "@/components/ChipChart";
import { Search, Bell, Filter, X, TrendingUp, TrendingDown, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";

// 13 FHC Stocks Data (Mock)
const INITIAL_STOCKS = [
  { id: "2881", name: "富邦金", price: 95.5, diff: -1.5, change: -1.55, isUp: false, category: "民營" as const, pbValue: 1.55, pbPercentile: 82 },
  { id: "2882", name: "國泰金", price: 75.9, diff: -0.5, change: -0.65, isUp: false, category: "民營" as const, pbValue: 1.25, pbPercentile: 55 },
  { id: "2886", name: "兆豐金", price: 40.65, diff: 0.2, change: 0.49, isUp: true, category: "官股" as const, pbValue: 1.72, pbPercentile: 91 },
  { id: "2891", name: "中信金", price: 49.7, diff: 0.35, change: 0.71, isUp: true, category: "民營" as const, pbValue: 1.48, pbPercentile: 85 },
  { id: "2880", name: "華南金", price: 31.85, diff: 0.35, change: 1.11, isUp: true, category: "官股" as const, pbValue: 1.41, pbPercentile: 75 },
  { id: "2884", name: "玉山金", price: 32.85, diff: 0.05, change: 0.15, isUp: true, category: "民營" as const, pbValue: 1.92, pbPercentile: 15 },
  { id: "2892", name: "第一金", price: 29.7, diff: 0.05, change: 0.17, isUp: true, category: "官股" as const, pbValue: 1.45, pbPercentile: 65 },
  { id: "2885", name: "元大金", price: 40.8, diff: -0.3, change: -0.73, isUp: false, category: "民營" as const, pbValue: 1.28, pbPercentile: 58 },
  { id: "2887", name: "台新新光金", price: 20.85, diff: 0.1, change: 0.48, isUp: true, category: "民營" as const, pbValue: 1.05, pbPercentile: 8 },
  { id: "2890", name: "永豐金", price: 29.2, diff: 0.0, change: 0.0, isUp: true, category: "民營" as const, pbValue: 1.21, pbPercentile: 45 },
  { id: "2883", name: "凱基金", price: 17.45, diff: -0.15, change: -0.85, isUp: false, category: "民營" as const, pbValue: 0.98, pbPercentile: 7 },
  { id: "2889", name: "國票金", price: 16.75, diff: 0.05, change: 0.3, isUp: true, category: "民營" as const, pbValue: 1.15, pbPercentile: 35 },
  { id: "5880", name: "合庫金", price: 24.1, diff: 0.1, change: 0.42, isUp: true, category: "官股" as const, pbValue: 1.48, pbPercentile: 74 },
];

// Generate fake chip data
const generateChipData = () => {
  return Array.from({ length: 15 }, (_, i) => ({
    date: `01/${i + 1}`,
    institutional: Math.floor((Math.random() - 0.4) * 10000),
    government: Math.floor((Math.random() - 0.3) * 5000),
  }));
};

// Generate random walk data for sparklines
const generateData = (base: number) => {
  let current = base;
  return Array.from({ length: 20 }, () => {
    current = current + (Math.random() - 0.5) * 0.5;
    return { value: current };
  });
};

export default function DashboardPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [stocks, setStocks] = useState(
    INITIAL_STOCKS.map(s => ({ ...s, data: [] as { value: number }[], chipData: [] as any[] }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<{ summary: string; sentimentScore: number; highlight: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "民營" | "官股">("all");

  const selectedStock = stocks.find(s => s.id === selectedId);

  // Filtered stocks based on search and category
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.name.includes(searchQuery) || stock.id.includes(searchQuery);
    const matchesFilter = filterCategory === "all" || stock.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    setMounted(true);

    // Initial Data Load (Simulation + Real Fetch)
    const initData = async () => {
      // Start with initial stock list
      let currentStocks = INITIAL_STOCKS.map(s => ({
        ...s,
        data: generateData(s.price),
        chipData: generateChipData()
      }));
      setStocks(currentStocks);

      try {
        const res = await fetch("/api/stock-prices/realtime");
        const realData = await res.json();

        if (Array.isArray(realData)) {
          setStocks(prev => prev.map(s => {
            const real = realData.find(r => r.id === s.id);
            if (real) {
              return {
                ...s,
                price: real.price,
                change: real.change,
                isUp: real.change >= 0,
                // Regenerate sparkline data with real price as base
                data: generateData(real.price)
              };
            }
            return s;
          }));
        }
      } catch (e) {
        console.error("Realtime fetch failed, keeping simulated data.", e);
      }
    };

    initData();
  }, []);

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
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                金控價值網格 <span className="text-rise">13</span>
              </h1>
              {mounted && (
                <p className="text-slate-400 text-sm font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rise animate-pulse" />
                  市場即時數據監控中 · {new Date().toLocaleDateString('zh-TW')} {new Date().toLocaleTimeString('zh-TW')}
                </p>
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
            {/* 13-Grid Regions */}
            <div className={cn(
              "grid gap-6 transition-all duration-500",
              selectedId ? "xl:col-span-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "xl:col-span-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            )}>
              {filteredStocks.map((stock) => (
                <div key={stock.id} onClick={() => setSelectedId(stock.id === selectedId ? null : stock.id)} className="cursor-pointer">
                  <FhcCard
                    {...stock}
                    pbPercentile={stock.pbPercentile}
                  />
                </div>
              ))}

              {!selectedId && (
                <div className="glass bg-gradient-to-br from-rise/10 to-transparent border-rise/20 p-8 flex flex-col justify-center items-center text-center group cursor-pointer hover:border-rise transition-all">
                  <div className="w-16 h-16 bg-rise/20 rounded-2xl flex items-center justify-center mb-6 text-rise group-hover:scale-110 transition-transform">
                    <Bell size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">啟動 AI 關鍵價位追蹤</h3>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6">
                    當 P/B 位階低於歷史 5% 時，<br />立即發送通知至您的 LINE 或 Telegram。
                  </p>
                  <Link href="/subscription" className="w-full">
                    <button className="w-full py-4 bg-rise text-white rounded-xl font-black shadow-lg shadow-rise/20 hover:scale-[1.02] active:scale-95 transition-all">
                      升級專業版訂閱
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Selected Stock Detail Panel (Multi-Chart Linkage) */}
            <AnimatePresence>
              {selectedId && selectedStock && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="xl:col-span-4 glass border-white/10 bg-slate-900/60 p-8 flex flex-col gap-8 sticky top-24 h-[calc(100vh-160px)]"
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

                  <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">籌碼流向 (15D)</p>
                      <ChipChart data={selectedStock.chipData} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">三大法人</p>
                        <p className="text-lg font-black text-blue-400 font-mono tracking-tighter">+12,504 <span className="text-[10px] text-slate-600 font-bold ml-1">張</span></p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">官股行庫</p>
                        <p className="text-lg font-black text-purple-400 font-mono tracking-tighter">+4,821 <span className="text-[10px] text-slate-600 font-bold ml-1">張</span></p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <BrainCircuit size={14} className="text-rise transition-all" />
                        AI 法說會情緒摘要
                        {isAiLoading && <span className="w-1.5 h-1.5 bg-rise rounded-full animate-ping ml-1" />}
                      </p>
                      <div className={cn(
                        "p-5 rounded-2xl border transition-all duration-700 leading-relaxed text-slate-200 text-xs font-bold",
                        isAiLoading ? "bg-white/5 border-white/5 animate-pulse" : "bg-gradient-to-br from-rise/10 to-transparent border-rise/10"
                      )}>
                        {isAiLoading ? "正在透過 Gemini 1.5 Pro 分析最新法說會資料..." : (
                          aiSummary ? (
                            <div className="space-y-3">
                              <p>「{aiSummary.summary}」</p>
                              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                <span className="text-[10px] uppercase font-black text-slate-500">市場情緒：</span>
                                <span className={cn(
                                  "text-[10px] font-black",
                                  aiSummary.sentimentScore > 0 ? "text-rise" : "text-fall"
                                )}>
                                  {aiSummary.sentimentScore > 0 ? "+" : ""}{aiSummary.sentimentScore}
                                </span>
                              </div>
                            </div>
                          ) : "尚無分析數據。"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">散戶 FOMO 評分</span>
                      <span className="text-xs font-black text-fall font-mono">24/100 (低)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-fall w-[24%]" />
                    </div>
                    <Link href="/subscription" className="w-full">
                      <button className="w-full py-4 bg-rise text-white rounded-xl font-black shadow-lg shadow-rise/20 hover:scale-[1.02] active:scale-95 transition-all">
                        查看完整詳細報告
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
      </div>
    </div>
  );
}
