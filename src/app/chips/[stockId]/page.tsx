"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FHC_STOCKS } from "@/lib/constants";
import { ArrowLeft, TrendingUp, TrendingDown, Layers, Landmark, Building2, Download, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Area } from "recharts";

export default function DeepChipTrackingPage() {
    const params = useParams();
    const stockId = params.stockId as string;
    const stockInfo = FHC_STOCKS.find(s => s.id === stockId) || { name: "未知", category: "未知", id: stockId };

    const [chipData, setChipData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [priceData, setPriceData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch 60 days of chip data
                const chipRes = await fetch(`/api/stock-chips?id=${stockId}&days=60`);
                const chipJson = await chipRes.json();

                // Fetch price history for correlation
                const priceRes = await fetch(`/api/stock-prices/intraday?stockId=${stockId}`);
                const priceJson = await priceRes.json();

                if (Array.isArray(chipJson)) {
                    // Sort by date ascending
                    setChipData(chipJson.reverse());
                }
                if (Array.isArray(priceJson)) {
                    setPriceData(priceJson);
                }
            } catch (e) {
                console.error("Failed to fetch chip data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [stockId]);

    // Calculate Summary Metrics (Last 5 days vs 20 days)
    const last5Days = chipData.slice(-5);
    const netInst5 = last5Days.reduce((acc, curr) => acc + (curr.institutional || 0), 0);
    const netGov5 = last5Days.reduce((acc, curr) => acc + (curr.government || 0), 0);

    // Prepare Combined Data for Chart (Price + Chips)
    // Note: This is a hacky join since priceData is intraday and chipData is daily. 
    // Ideally we need DAILY price history. 
    // For now, we visualize Chip Data solely, maybe with Price if available in Chip API?
    // Assuming Chip API only has inst/gov.

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-6 md:p-10">
            {/* Navigation & Header */}
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <Link
                        href="/valuation"
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
                    >
                        <div className="p-2 rounded-full border border-slate-800 bg-slate-900 group-hover:bg-slate-800 transition-colors">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="text-sm font-bold tracking-wide">返回價值儀表板</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest hidden md:block">
                            FHC Elite / Pro Data Analytics
                        </span>
                        <button className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white hover:border-slate-700 transition-all">
                            <Download size={18} />
                        </button>
                    </div>
                </header>

                {/* Title Section */}
                <div className="glass bg-slate-900/40 p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className={cn(
                                    "px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase",
                                    (stockInfo as any).category === "官股" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                                )}>
                                    {(stockInfo as any).category}
                                </span>
                                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-black tracking-widest">
                                    {stockId}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                                {(stockInfo as any).name} <span className="text-xl md:text-2xl text-slate-600 font-light">籌碼深度透視</span>
                            </h1>
                            <p className="text-slate-500 font-medium max-w-xl">
                                追蹤機構法人與官股行庫的資金流向，識別主力佈局與出貨軌跡。數據涵蓋近 60 個交易日。
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">近5日法人買賣超</div>
                                <div className={cn("text-2xl font-black font-mono tracking-tight", netInst5 > 0 ? "text-rose-500" : "text-emerald-500")}>
                                    {netInst5 > 0 ? "+" : ""}{(netInst5 / 1000).toFixed(1)} <span className="text-sm text-slate-500">張</span>
                                </div>
                            </div>
                            <div className="w-px bg-slate-800 h-10 self-center" />
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">近5日官股動向</div>
                                <div className={cn("text-2xl font-black font-mono tracking-tight", netGov5 > 0 ? "text-rose-500" : "text-emerald-500")}>
                                    {netGov5 > 0 ? "+" : ""}{(netGov5 / 1000).toFixed(1)} <span className="text-sm text-slate-500">張</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Decorative bg gradient */}
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass p-6 rounded-2xl border border-white/5 bg-slate-900/60 min-h-[400px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Layers size={18} className="text-blue-500" />
                                    主力資金流向趨勢 (60D)
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                        <span className="w-2 h-2 rounded-sm bg-blue-500" /> 機構法人
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                        <span className="w-2 h-2 rounded-sm bg-purple-500" /> 官股行庫
                                    </span>
                                </div>
                            </div>

                            {/* Recharts Composition */}
                            <div className="h-[350px] w-full">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center text-slate-600 animate-pulse">載入數據中...</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chipData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorInst" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorGov" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#64748b"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(str) => str.slice(5)} // Show MM/DD
                                            />
                                            <YAxis
                                                stroke="#64748b"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                                labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold' }}
                                            />
                                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', opacity: 0.7 }} />
                                            <Bar dataKey="institutional" name="法人買賣超" barSize={8} fill="url(#colorInst)" stroke="#3b82f6" radius={[2, 2, 0, 0]} />
                                            <Bar dataKey="government" name="官股買賣超" barSize={8} fill="url(#colorGov)" stroke="#8b5cf6" radius={[2, 2, 0, 0]} />
                                            <Line type="monotone" dataKey="institutional" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} hide />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Recent Transactions Table */}
                        <div className="glass p-6 rounded-2xl border border-white/5 bg-slate-900/40">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Filter size={18} className="text-slate-400" />
                                近期交易明細
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-xs font-black text-slate-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">日期</th>
                                            <th className="py-3 px-4 text-right">法人動向</th>
                                            <th className="py-3 px-4 text-right">官股動向</th>
                                            <th className="py-3 px-4 text-center">訊號</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {chipData.slice(-10).reverse().map((row, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-4 font-mono text-slate-300">{row.date}</td>
                                                <td className={cn("py-3 px-4 text-right font-mono font-bold", row.institutional > 0 ? "text-rose-500" : "text-emerald-500")}>
                                                    {row.institutional > 0 ? "+" : ""}{(row.institutional / 1000).toFixed(1)}k
                                                </td>
                                                <td className={cn("py-3 px-4 text-right font-mono font-bold", row.government > 0 ? "text-rose-500" : "text-emerald-500")}>
                                                    {row.government > 0 ? "+" : ""}{(row.government / 1000).toFixed(1)}k
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {row.institutional > 0 && row.government > 0 ? (
                                                        <span className="inline-block px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-black">雙買超</span>
                                                    ) : row.institutional < 0 && row.government < 0 ? (
                                                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black">雙賣超</span>
                                                    ) : (
                                                        <span className="text-slate-600">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Analysis Cards */}
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-900/50">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Building2 size={16} /> 機構法人觀點
                            </h3>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-3xl font-black text-rose-500">偏多</span>
                                <span className="text-xs font-bold bg-rose-500/20 text-rose-500 px-2 py-1 rounded">強烈買進</span>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed mb-6">
                                機構法人近 5 日合計買超 <span className="text-white font-bold">{netInst5 > 0 ? "+" : ""}{(netInst5 / 1000).toFixed(1)}k張</span>，顯示主力資金持續流入，籌碼面具備支撐。
                            </p>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500" style={{ width: '75%' }} />
                            </div>
                        </div>

                        <div className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-900/50">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Landmark size={16} /> 官股行庫動向
                            </h3>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-3xl font-black text-slate-300">中立</span>
                                <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">觀望</span>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed mb-6">
                                官股行庫操作相對保守，近 5 日動向不明顯，可能正在等待市場進一步明確訊號。
                            </p>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-500" style={{ width: '50%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
