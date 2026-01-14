"use client";

import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockListItemProps {
    id: string;
    name: string;
    price: number;
    diff: number;
    change: number;
    isUp: boolean;
    category: "官股" | "民營";
    pbValue: number;
    pbPercentile: number;
    data: { time?: string; value: number }[];
}

export default function StockListItem({
    id, name, price, diff, change, isUp, category, pbValue, pbPercentile, data
}: StockListItemProps) {
    // Filter data for chart
    const chartData = data && data.length > 0 ? data.filter(d => d.value !== null) : [];

    return (
        <div className="glass p-4 flex items-center gap-6 hover:bg-white/5 transition-all">
            {/* Left: Stock Info */}
            <div className="flex items-center gap-3 min-w-[200px]">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-black text-slate-400 font-mono">{id}</span>
                        <span className={cn(
                            "text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest",
                            category === "官股" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                        )}>
                            {category}
                        </span>
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight">{name}</h3>
                </div>
            </div>

            {/* Middle: Mini Chart */}
            <div className="flex-1 h-16 min-w-[200px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`list-gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={change > 0 ? "#ef4444" : change < 0 ? "#22c55e" : "#94a3b8"} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={change > 0 ? "#ef4444" : change < 0 ? "#22c55e" : "#94a3b8"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <YAxis hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={change > 0 ? "#ef4444" : change < 0 ? "#22c55e" : "#94a3b8"}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#list-gradient-${id})`}
                                isAnimationActive={false}
                                connectNulls={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-slate-600">載入中...</span>
                    </div>
                )}
            </div>

            {/* Right: Price & Stats */}
            <div className="flex items-center gap-8 min-w-[300px]">
                {/* Price */}
                <div className="text-right">
                    <div className="text-2xl font-black font-mono text-white tracking-tight">
                        {price > 0 ? price.toFixed(2) : '---'}
                    </div>
                    <div className={cn(
                        "flex items-center justify-end gap-1 text-xs font-bold mt-1",
                        change > 0 ? "text-rise" : change < 0 ? "text-fall" : "text-slate-400"
                    )}>
                        {change > 0 ? <TrendingUp size={12} /> : change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                        <span>{typeof diff === 'number' && typeof change === 'number' ? `${change > 0 ? "+" : ""}${diff.toFixed(2)} (${change > 0 ? "+" : ""}${change.toFixed(2)}%)` : '---'}</span>
                    </div>
                </div>

                {/* P/B */}
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">P/B位階</p>
                        <p className={cn(
                            "text-lg font-black font-mono",
                            pbPercentile < 20 ? "text-fall" : pbPercentile > 80 ? "text-rise" : "text-slate-300"
                        )}>
                            {pbPercentile}%
                        </p>
                    </div>
                    <div className="group/info relative">
                        <Info size={14} className="text-slate-600 hover:text-white cursor-help transition-colors" />
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-3 glass bg-slate-900 border-white/10 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/info:translate-y-0 z-50 shadow-2xl">
                            <p className="text-[10px] font-bold leading-relaxed text-slate-300">
                                目前 P/B 為 <span className="text-white font-black">{typeof pbValue === 'number' ? pbValue.toFixed(2) : '--'}</span>，處於 5 年歷史位階的 <span className="text-white font-black">{pbPercentile}%</span>。
                                {pbPercentile < 15 ? " 目前極度低估，適合穩健投資者關注。" : ""}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
