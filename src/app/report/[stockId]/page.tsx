"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Download, Share2, Bell, Bot, Star } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";
import TradingChart from "@/components/TradingChart";

// 金控基礎資料
const FHC_INFO: Record<string, { name: string; category: string; dividend: number }> = {
    "2881": { name: "富邦金", category: "民營", dividend: 3.0 },
    "2882": { name: "國泰金", category: "民營", dividend: 2.5 },
    "2880": { name: "華南金", category: "官股", dividend: 1.2 },
    "2884": { name: "玉山金", category: "民營", dividend: 1.5 },
    "2885": { name: "元大金", category: "民營", dividend: 1.5 },
    "2886": { name: "兆豐金", category: "官股", dividend: 1.8 },
    "2887": { name: "台新新光金", category: "民營", dividend: 1.0 },
    "2889": { name: "國票金", category: "民營", dividend: 0.7 },
    "2890": { name: "永豐金", category: "民營", dividend: 1.2 },
    "2891": { name: "中信金", category: "民營", dividend: 1.8 },
    "2892": { name: "第一金", category: "官股", dividend: 1.3 },
    "2883": { name: "凱基金", category: "民營", dividend: 0.8 },
    "5880": { name: "合庫金", category: "官股", dividend: 1.1 },
};

// 歷史股息數據 (5年)
const DIVIDEND_HISTORY: Record<string, number[]> = {
    "2881": [2.5, 2.8, 3.0, 3.2, 3.0],
    "2882": [2.0, 2.2, 2.3, 2.5, 2.5],
    "2886": [1.5, 1.6, 1.7, 1.8, 1.8],
    "2891": [1.5, 1.6, 1.7, 1.8, 1.8],
    "2880": [1.0, 1.1, 1.1, 1.2, 1.2],
};

export default function ReportPage() {
    const params = useParams();
    const stockId = params.stockId as string;
    const stockInfo = FHC_INFO[stockId] || { name: "未知", category: "未知", dividend: 0 };

    const [stockData, setStockData] = useState<any>(null);
    const [chipData, setChipData] = useState<any[]>([]);
    const [priceHistory, setPriceHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 獲取即時股價數據
                const realtimeRes = await fetch("/api/stock-prices/realtime");
                const realtimeData = await realtimeRes.json();
                const stock = realtimeData.find((s: any) => s.id === stockId);
                if (stock) setStockData(stock);

                // 獲取籌碼數據 (10 個交易日)
                const chipRes = await fetch(`/api/stock-chips?id=${stockId}&days=10`);
                const chipJson = await chipRes.json();
                if (Array.isArray(chipJson)) setChipData(chipJson);

                // 獲取分時數據
                const historyRes = await fetch(`/api/stock-prices/intraday?stockId=${stockId}`);
                const historyJson = await historyRes.json();
                if (Array.isArray(historyJson)) setPriceHistory(historyJson);

            } catch (e) {
                console.error("Report data fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stockId]);

    // 計算殖利率
    const dividendYield = stockData?.price > 0
        ? ((stockInfo.dividend / stockData.price) * 100).toFixed(2)
        : "0.00";

    // 計算籌碼累積
    const totalInstitutional = chipData.reduce((acc, curr) => acc + (curr.institutional || 0), 0);
    const chipTrend = totalInstitutional > 0 ? "買超" : totalInstitutional < 0 ? "賣超" : "持平";

    // 生成股息歷史圖表數據
    const dividendChartData = (DIVIDEND_HISTORY[stockId] || [1, 1, 1, 1, 1]).map((d, i) => ({
        year: `${2022 + i}`,
        dividend: d
    }));

    // 計算 AI 建議
    const getAIRecommendation = () => {
        if (!stockData) return { action: "觀望", color: "text-slate-400", reason: "數據載入中" };

        const pb = stockData.pbPercentile || 50;
        const isUp = stockData.isUp;

        if (pb < 30 && totalInstitutional > 0) {
            return { action: "建議買入", color: "text-rise", reason: "低估區間 + 法人買超" };
        } else if (pb < 30) {
            return { action: "逢低佈局", color: "text-yellow-400", reason: "位階低估，等待確認訊號" };
        } else if (pb > 85) {
            return { action: "建議減碼", color: "text-fall", reason: "位階過高，風險溢價區" };
        } else if (pb > 60 && totalInstitutional < -1000) {
            return { action: "觀望", color: "text-slate-400", reason: "法人持續賣超" };
        } else {
            return { action: "持有", color: "text-blue-400", reason: "正常區間，維持配置" };
        }
    };

    const aiRec = getAIRecommendation();

    // 計算風險指標
    const getBeta = () => {
        // 簡化計算：官股較穩定
        return stockInfo.category === "官股" ? 0.85 : 1.15;
    };

    const getFOMOScore = () => {
        if (!stockData) return 20;
        const volatility = Math.abs(stockData.change || 0);
        const priceDeviation = stockData.isUp ? stockData.change : 0;
        return Math.min(100, Math.round(volatility * 40 + priceDeviation * 30 + 20));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-white text-xl font-bold animate-pulse">載入報告中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white p-6 md:p-10 font-inter">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        <span className="font-bold">返回首頁</span>
                    </Link>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                            title="下載 PDF 報告"
                        >
                            <Download size={18} />
                        </button>
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: `${stockInfo.name} 詳細報告`,
                                        text: `查看 ${stockInfo.name} 的完整投資分析報告`,
                                        url: window.location.href
                                    });
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('連結已複製到剪貼簿！');
                                }
                            }}
                            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                            title="分享報告"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Stock Title */}
                <div className="flex items-center justify-between mb-8 p-6 glass bg-slate-900/50 rounded-2xl border border-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold px-2 py-1 rounded bg-slate-700 text-slate-300">{stockId}</span>
                            <span className={cn(
                                "text-xs font-bold px-2 py-1 rounded",
                                stockInfo.category === "官股" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                            )}>{stockInfo.category}</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">{stockInfo.name}</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black font-mono">
                            {stockData?.price?.toFixed(2) || "---"}
                        </div>
                        <div className={cn(
                            "flex items-center justify-end gap-1 text-lg font-bold",
                            stockData?.isUp ? "text-rise" : "text-fall"
                        )}>
                            {stockData?.isUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            <span>
                                {stockData?.diff?.toFixed(2) || "0.00"} ({stockData?.change?.toFixed(2) || "0.00"}%)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {/* P/B 位階 */}
                    <div className="p-5 glass bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">P/B 位階</div>
                        <div className="text-3xl font-black font-mono mb-2">
                            {stockData?.pbPercentile || 50}%
                        </div>
                        <div className={cn(
                            "text-sm font-bold px-2 py-1 rounded inline-block",
                            (stockData?.pbPercentile || 50) < 30 ? "bg-rise/20 text-rise" :
                                (stockData?.pbPercentile || 50) > 85 ? "bg-fall/20 text-fall" :
                                    "bg-slate-700 text-slate-300"
                        )}>
                            {(stockData?.pbPercentile || 50) < 30 ? "歷史低估區" :
                                (stockData?.pbPercentile || 50) > 85 ? "風險溢價區" :
                                    (stockData?.pbPercentile || 50) > 60 ? "偏貴" : "合理區間"}
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-rise via-yellow-400 to-fall"
                                style={{ width: `${stockData?.pbPercentile || 50}%` }}
                            />
                        </div>
                    </div>

                    {/* 法人動向 */}
                    <div className="p-5 glass bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">法人動向 (10D)</div>
                        <div className={cn(
                            "text-3xl font-black font-mono mb-2",
                            totalInstitutional > 0 ? "text-rise" : "text-fall"
                        )}>
                            {totalInstitutional > 0 ? "+" : ""}{totalInstitutional.toLocaleString()} 張
                        </div>
                        <div className={cn(
                            "text-sm font-bold px-2 py-1 rounded inline-block",
                            totalInstitutional > 0 ? "bg-rise/20 text-rise" : "bg-fall/20 text-fall"
                        )}>
                            連續{chipTrend}
                        </div>
                    </div>

                    {/* 殖利率 */}
                    <div className="p-5 glass bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">現金殖利率</div>
                        <div className="text-3xl font-black font-mono text-rise mb-2">
                            {dividendYield}%
                        </div>
                        <div className={cn(
                            "text-sm font-bold px-2 py-1 rounded inline-block",
                            parseFloat(dividendYield) > 4 ? "bg-rise/20 text-rise" : "bg-slate-700 text-slate-300"
                        )}>
                            {parseFloat(dividendYield) > 4 ? "高息潛力股" : "優於定存"}
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    {/* 價格走勢 */}
                    <div className="p-5 glass bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">今日價格走勢 (Real-time)</div>
                        <div className="h-64 -mx-2">
                            <TradingChart
                                data={priceHistory}
                                isUp={stockData?.isUp ?? false}
                                height={256}
                                enableTimeScale={false}
                                enablePriceScale={false}
                            />
                        </div>
                    </div>

                    {/* 籌碼流向 */}
                    <div className="p-5 glass bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">籌碼流向 (10D)</div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chipData}>
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={10} />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                                        labelStyle={{ color: '#94a3b8' }}
                                    />
                                    <Bar dataKey="institutional" name="法人">
                                        {chipData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.institutional >= 0 ? "#ef4444" : "#22c55e"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Dividend & Risk Row */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    {/* 股息歷史 */}
                    <div className="p-5 glass bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">股息歷史 (5Y)</div>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dividendChartData}>
                                    <XAxis dataKey="year" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={10} />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                                        formatter={(value) => [`NT$ ${value ?? 0}`, '股息']}
                                    />
                                    <Bar dataKey="dividend" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <Link href="/tax" className="block mt-4">
                            <button className="w-full py-3 bg-amber-500/20 text-amber-400 rounded-lg font-bold hover:bg-amber-500/30 transition-colors">
                                前往稅後試算 →
                            </button>
                        </Link>
                    </div>

                    {/* 風險指標 */}
                    <div className="p-5 glass bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">風險指標</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-800/50 rounded-lg">
                                <div className="text-xs text-slate-400 mb-1">Beta 值</div>
                                <div className="text-xl font-black font-mono">{getBeta()}</div>
                                <div className="text-xs text-slate-500">{getBeta() < 1 ? "低於大盤波動" : "高於大盤波動"}</div>
                            </div>
                            <div className="p-3 bg-slate-800/50 rounded-lg">
                                <div className="text-xs text-slate-400 mb-1">殖利率穩定度</div>
                                <div className="flex gap-0.5 text-amber-400 my-0.5">
                                    <Star size={16} fill="currentColor" />
                                    <Star size={16} fill="currentColor" />
                                    <Star size={16} fill="currentColor" />
                                    <Star size={16} fill="currentColor" />
                                    <Star size={16} className="text-slate-600" />
                                </div>
                                <div className="text-xs text-slate-500">連續配息</div>
                            </div>
                            <div className="p-3 bg-slate-800/50 rounded-lg col-span-2">
                                <div className="text-xs text-slate-400 mb-1">散戶 FOMO 指數</div>
                                <div className="flex items-center gap-3">
                                    <div className="text-xl font-black font-mono">{getFOMOScore()}/100</div>
                                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-fall" style={{ width: `${getFOMOScore()}%` }} />
                                    </div>
                                    <div className={cn(
                                        "text-xs font-bold px-2 py-1 rounded",
                                        getFOMOScore() > 70 ? "bg-fall/20 text-fall" : "bg-slate-700 text-slate-400"
                                    )}>
                                        {getFOMOScore() > 70 ? "警戒" : "正常"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Recommendation */}
                <div className="p-6 glass bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl border border-white/10 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">AI 投資建議</div>
                            <div className="text-xs text-slate-500">綜合估值、籌碼、走勢分析</div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className={cn("text-3xl font-black", aiRec.color)}>
                                {aiRec.action}
                            </div>
                            <div className="text-slate-400 mt-1">{aiRec.reason}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-400">預估目標價</div>
                            <div className="text-2xl font-black font-mono text-white">
                                {stockData?.price ? (stockData.price * 1.1).toFixed(1) : "---"}
                            </div>
                            <div className="text-sm text-rise">潛在報酬 +10%</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <Link href="/tax" className="flex-1">
                        <button className="w-full py-4 bg-rise text-white rounded-xl font-black shadow-lg shadow-rise/20 hover:scale-[1.02] transition-all">
                            股息稅務試算
                        </button>
                    </Link>
                    <button className="flex-1 py-4 bg-slate-800 text-white rounded-xl font-black hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                        <Bell size={18} />
                        設定價位通知
                    </button>
                </div>
            </div>
        </div>
    );
}
