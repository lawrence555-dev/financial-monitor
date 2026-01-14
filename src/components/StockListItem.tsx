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
        <div className="glass border-b border-white/5 last:border-b-0 py-3 px-4 flex items-center gap-3 hover:bg-white/3 transition-all duration-200">
            {/* Left: Stock Code & Name */}
            <div className="flex items-center gap-2 min-w-[140px]">
                <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-black text-slate-400 font-mono">{id}</span>
                        <span className={cn(
                            "text-[8px] font-black px-1 py-0.5 rounded tracking-wider",
                            category === "官股" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"
                        )}>
                            {category}
                        </span>
                    </div>
                    <h3 className="text-sm font-bold text-white/90">{name}</h3>
                </div>
            </div>

            {/* Middle: Compact Chart */}
            <div className="h-12 w-[200px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`list-gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={change > 0 ? "#ef4444" : change < 0 ? "#22c55e" : "#94a3b8"} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={change > 0 ? "#ef4444" : change < 0 ? "#22c55e" : "#94a3b8"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <YAxis hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={change > 0 ? "#ef4444" : change < 0 ? "#22c55e" : "#94a3b8"}
                                strokeWidth={1.5}
                                fillOpacity={1}
                                fill={`url(#list-gradient-${id})`}
                                isAnimationActive={false}
                                connectNulls={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <span className="text-[10px] text-slate-600">載入中...</span>
                    </div>
                )}
            </div>

            {/* Right: Price & Stats */}
            <div className="flex items-center gap-5 ml-auto">
                {/* Price */}
                <div className="text-right min-w-[110px]">
                    <div className="text-xl font-black font-mono text-white tracking-tight leading-none">
                        {price > 0 ? price.toFixed(2) : '---'}
                    </div>
                    <div className={cn(
                        "flex items-center justify-end gap-1 text-[11px] font-bold mt-1",
                        change > 0 ? "text-rise" : change < 0 ? "text-fall" : "text-slate-400"
                    )}>
                        {change > 0 ? <TrendingUp size={11} /> : change < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                        <span>{typeof diff === 'number' && typeof change === 'number' ? `${change > 0 ? "+" : ""}${diff.toFixed(2)} (${change > 0 ? "+" : ""}${change.toFixed(2)}%)` : '---'}</span>
                    </div>
                </div>

                {/* P/B */}
                <div className="flex items-center gap-1.5 min-w-[85px]">
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-0.5">P/B位階</p>
                        <p className={cn(
                            "text-sm font-black font-mono leading-none",
                            pbPercentile < 20 ? "text-fall" : pbPercentile > 80 ? "text-rise" : "text-slate-300"
                        )}>
                            {pbPercentile}%
                        </p>
                    </div>
                    <div className="group/info relative">
                        <Info size={12} className="text-slate-600 hover:text-white cursor-help transition-colors" />
                        <div className="absolute bottom-full right-0 mb-2 w-44 p-2.5 glass bg-slate-900 border-white/10 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/info:translate-y-0 z-50 shadow-2xl rounded-lg">
                            <p className="text-[9px] font-bold leading-relaxed text-slate-300">
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
