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
        <div className="glass border-b-0 py-2.5 px-6 flex items-center group hover:glass-hover transition-all duration-300 gap-8">
            {/* Left: Stock Code & Name */}
            <div className="flex items-center gap-4 min-w-[200px]">
                <div className="w-10 h-10 rounded-xl glass border-main flex items-center justify-center font-black text-accent text-xs italic group-hover:scale-110 transition-transform">
                    {id.slice(-1)}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black text-mute font-mono">{id}</span>
                        <span className={cn(
                            "text-[8px] font-black px-1 py-0.5 rounded tracking-widest uppercase",
                            category === "官股" ? "bg-accent/10 text-accent" : "bg-purple-500/10 text-purple-400"
                        )}>
                            {category}
                        </span>
                    </div>
                    <h3 className="text-base font-black font-archivo italic group-hover:text-accent transition-colors tracking-tight">{name}</h3>
                </div>
            </div>

            {/* Middle: Compact Chart - Full Horizontal Width */}
            <div className="h-10 flex-1 max-w-[400px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`list-gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={change > 0 ? "var(--color-rise)" : change < 0 ? "var(--color-fall)" : "var(--fg-mute)"} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={change > 0 ? "var(--color-rise)" : change < 0 ? "var(--color-fall)" : "var(--fg-mute)"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={change > 0 ? "var(--color-rise)" : change < 0 ? "var(--color-fall)" : "var(--fg-mute)"}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#list-gradient-${id})`}
                                isAnimationActive={false}
                                connectNulls={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center border border-dashed border-main rounded-lg opacity-30">
                        <span className="text-[8px] font-black uppercase tracking-widest">Loading...</span>
                    </div>
                )}
            </div>

            {/* Price & Change - Horizontal */}
            <div className="flex items-center gap-8 ml-auto">
                <div className="flex flex-col items-end">
                    <span className="text-xl font-black font-fira tracking-tighter leading-none">
                        {price > 0 ? price.toFixed(2) : '---'}
                    </span>
                    <div className={cn(
                        "flex items-center gap-1 text-[10px] font-black font-fira mt-1",
                        change > 0 ? "text-rise" : change < 0 ? "text-fall" : "text-mute"
                    )}>
                        {change > 0 ? <TrendingUp size={10} /> : change < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                        <span>{typeof diff === 'number' && typeof change === 'number' ? `${change > 0 ? "+" : ""}${diff.toFixed(2)} (${change > 0 ? "+" : ""}${change.toFixed(2)}%)` : '---'}</span>
                    </div>
                </div>

                {/* P/B Position */}
                <div className="flex items-center gap-3 border-l border-main pl-8">
                    <div className="text-right">
                        <p className="text-[8px] font-black text-mute uppercase tracking-widest mb-1 leading-none">P/B 位階</p>
                        <p className={cn(
                            "text-lg font-black font-fira leading-none",
                            pbPercentile < 20 ? "text-fall" : pbPercentile > 80 ? "text-rise" : "text-fg"
                        )}>
                            {pbPercentile}%
                        </p>
                    </div>
                    <div className="group/info relative">
                        <Info size={14} className="text-mute hover:text-accent cursor-help transition-colors" />
                        <div className="absolute bottom-full right-0 mb-3 w-56 p-4 glass opacity-0 group-hover/info:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/info:translate-y-0 z-50 shadow-2xl">
                            <p className="text-[9px] font-bold leading-relaxed text-mute">
                                目前 P/B 為 <span className="text-fg font-black">{typeof pbValue === 'number' ? pbValue.toFixed(2) : '--'}</span>，處於 5 年歷史位階的 <span className="text-fg font-black">{pbPercentile}%</span>。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
