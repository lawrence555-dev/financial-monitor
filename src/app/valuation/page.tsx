"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import TickerTape from "@/components/TickerTape";
import { Info, ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useToast } from "@/components/Toast";

const getHeatmapColor = (percentile: number) => {
    if (percentile < 10) return "bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
    if (percentile < 25) return "bg-emerald-500/40";
    if (percentile < 40) return "bg-emerald-500/20";
    if (percentile < 60) return "bg-slate-700/50";
    if (percentile < 75) return "bg-rose-500/20";
    if (percentile < 90) return "bg-rose-500/40";
    return "bg-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]";
};

const getValuationLabel = (percentile: number) => {
    if (percentile < 15) return { text: "極度低估", color: "text-emerald-400" };
    if (percentile < 30) return { text: "價值區間", color: "text-emerald-500" };
    if (percentile < 70) return { text: "合理區間", color: "text-slate-400" };
    if (percentile < 85) return { text: "稍微過熱", color: "text-rose-400" };
    return { text: "極度高估", color: "text-rose-500" };
};

export default function ValuationPage() {
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [stocks, setStocks] = useState<any[]>([]);
    const [selectedStock, setSelectedStock] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);

        // 從真實 API 獲取數據
        const fetchStocks = async () => {
            try {
                const res = await fetch("/api/stock-prices/realtime");
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setStocks(data);
                    setSelectedStock(data[0]);
                }
            } catch (e) {
                console.error("Failed to fetch stocks:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchStocks();
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] pl-20 transition-all duration-700 font-inter">
            <Sidebar />
            <div className="flex flex-col min-h-screen">
                <TickerTape />

                <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Heatmap Grid */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <header className="flex justify-between items-end">
                            <div>
                                <div>
                                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">5 年 P/B 價值熱力圖</h1>
                                    {mounted && (
                                        <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            數據更新日：{new Date().toLocaleDateString('zh-TW')} · 歷史數據涵蓋 2021 - 2026
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 glass px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Info size={14} /> 分位數越高代表目前股價相對淨值較貴
                            </div>
                        </header>

                        <div className="glass p-8 border-white/5 bg-slate-900/40 relative min-h-[500px] flex items-center justify-center overflow-hidden">
                            {/* Valuation Scale Background */}
                            <div className="absolute inset-x-8 top-8 flex justify-between text-[10px] font-black tracking-widest text-slate-600 uppercase">
                                <span>便宜 (Cheap)</span>
                                <span>合理 (Fair)</span>
                                <span>昂貴 (Expensive)</span>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-4 w-full max-w-3xl">
                                {loading ? (
                                    // Professional Skeleton Loader
                                    Array.from({ length: 14 }).map((_, i) => (
                                        <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                                    ))
                                ) : stocks.length === 0 ? (
                                    // Empty / Error State
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                                        <Info size={48} className="mb-4 opacity-50" />
                                        <p className="font-bold">暫時無法取得估值數據</p>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-black transition-all"
                                        >
                                            重新整理
                                        </button>
                                    </div>
                                ) : (
                                    stocks.sort((a: any, b: any) => a.pbPercentile - b.pbPercentile).map((stock: any) => (
                                        <motion.div
                                            key={stock.id}
                                            whileHover={{ scale: 1.05, zIndex: 10 }}
                                            onClick={() => setSelectedStock(stock)}
                                            className={cn(
                                                "aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 border border-white/10 group relative",
                                                getHeatmapColor(stock.pbPercentile),
                                                selectedStock?.id === stock.id ? "ring-4 ring-white/20 scale-105" : ""
                                            )}
                                        >
                                            <span className="text-[10px] font-black text-white/40 mb-1 group-hover:text-white/80">{stock.id}</span>
                                            <span className="text-sm font-black text-white">{stock.name}</span>
                                            <span className="text-[10px] font-mono font-bold text-white/60 mt-1">{stock.pbPercentile}%</span>

                                            {selectedStock?.id === stock.id && (
                                                <div className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full" />
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="glass p-5 flex flex-col items-center text-center">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">最被低估</span>
                                <span className="text-xl font-black text-white">
                                    {stocks.length > 0 ? `${stocks.sort((a: any, b: any) => a.pbPercentile - b.pbPercentile)[0]?.name} (${stocks[0]?.id})` : '---'}
                                </span>
                                <span className="text-xs font-bold text-slate-400 mt-1">
                                    位階 {stocks.length > 0 ? stocks[0]?.pbPercentile : 0}%
                                </span>
                            </div>
                            <div className="glass p-5 flex flex-col items-center text-center">
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">最被高估</span>
                                <span className="text-xl font-black text-white">
                                    {stocks.length > 0 ? `${stocks.sort((a: any, b: any) => b.pbPercentile - a.pbPercentile)[0]?.name} (${stocks.sort((a: any, b: any) => b.pbPercentile - a.pbPercentile)[0]?.id})` : '---'}
                                </span>
                                <span className="text-xs font-bold text-slate-400 mt-1">
                                    位階 {stocks.length > 0 ? stocks.sort((a: any, b: any) => b.pbPercentile - a.pbPercentile)[0]?.pbPercentile : 0}%
                                </span>
                            </div>
                            <div className="glass p-5 flex flex-col items-center text-center">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">價格最高</span>
                                <span className="text-xl font-black text-white">
                                    {stocks.length > 0 ? `${stocks.sort((a: any, b: any) => b.price - a.price)[0]?.name} (${stocks.sort((a: any, b: any) => b.price - a.price)[0]?.id})` : '---'}
                                </span>
                                <span className="text-xs font-bold text-slate-400 mt-1">
                                    NT$ {stocks.length > 0 ? stocks.sort((a: any, b: any) => b.price - a.price)[0]?.price?.toFixed(2) : '0.00'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detail Panel */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {selectedStock ? (
                            <div className="glass p-8 border-rise/20 bg-gradient-to-b from-slate-900 to-slate-900/50 sticky top-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black text-white tracking-widest">{selectedStock.name} <span className="text-slate-600 font-mono text-lg">{selectedStock.id}</span></h2>
                                    <ExternalLink size={18} className="text-slate-600 hover:text-white cursor-pointer" />
                                </div>

                                <div className="space-y-8">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">目前價值位階</p>
                                            <p className={cn("text-3xl font-black tracking-tighter transition-colors duration-500", getValuationLabel(selectedStock.pbPercentile).color)}>
                                                {getValuationLabel(selectedStock.pbPercentile).text}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">歷史分位點</p>
                                            <p className="text-3xl font-black font-mono text-white tracking-tighter">{selectedStock.pbPercentile}%</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs font-bold mb-2">
                                            <span className="text-slate-500">當前股價</span>
                                            <span className="text-white font-mono">{selectedStock.price} TWD</span>
                                        </div>
                                        <div className="w-full h-1.5 relative my-2">
                                            <div className="absolute inset-0 rounded-full overflow-hidden flex">
                                                <div className="bg-emerald-500" style={{ width: '25%' }} />
                                                <div className="bg-slate-700" style={{ width: '50%' }} />
                                                <div className="bg-rose-500" style={{ width: '25%' }} />
                                            </div>
                                            <motion.div
                                                initial={{ left: 0 }}
                                                animate={{ left: `${selectedStock.pbPercentile}%` }}
                                                className="absolute w-3 h-3 bg-white border-2 border-slate-900 rounded-full -translate-x-1/2 top-1/2 -translate-y-1/2 shadow-lg shadow-white/20 transition-all duration-700 z-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-800/30 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                                <TrendingDown size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">安全邊際 (Margin of Safety)</p>
                                                <p className="text-sm font-bold text-slate-100">目前價格低於 5 年平均線 8.5%,適合長期分批佈局。</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">籌碼慣性</p>
                                                <p className="text-sm font-bold text-slate-100">官股行庫近三日連續承接,顯示政策性底部信號。</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Link href={`/report/${selectedStock.id}`} className="flex-1">
                                            <button className="w-full py-4 bg-rise text-white rounded-xl font-black shadow-lg shadow-rise/20 hover:scale-[1.02] active:scale-95 transition-all text-xs">
                                                查看深度分析報告
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => window.open(`https://tw.stock.yahoo.com/quote/${selectedStock.id}.TW`, "_blank")}
                                            className="p-4 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                                        >
                                            <ExternalLink size={20} />
                                        </button>
                                    </div>
                                    <Link href={`/chips/${selectedStock.id}`} className="w-full">
                                        <button className="w-full py-4 bg-rise hover:bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rise/20 transition-all active:scale-95 group overflow-hidden relative">
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                深入籌碼追蹤 <ExternalLink size={16} />
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="glass p-8 border-white/5 bg-slate-900/40 flex items-center justify-center min-h-[400px]">
                                <p className="text-slate-400">載入中...</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
