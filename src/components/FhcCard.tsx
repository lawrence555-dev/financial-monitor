"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface FhcCardProps {
    id: string;
    name: string;
    price: number;
    diff: number;
    change: number;
    isUp: boolean;
    category: "官股" | "民營";
    pbValue: number; // P/B Ratio
    pbPercentile: number; // 0-100, where low is cheap
    data: { time?: string; value: number }[];
}

export default function FhcCard({
    id, name, price, diff, change, isUp, category, pbValue, pbPercentile, data
}: FhcCardProps) {
    // Breathing light effect for low valuation (cheap Zone)
    const isCheap = pbPercentile < 15;

    // Prepare chart data: only real data from API, with full X-axis range
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Get current time in Taipei timezone
        const now = new Date();
        const taipeiTime = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Taipei'
        }).format(now);

        const [currentHour, currentMinute] = taipeiTime.split(':').map(Number);
        const currentMinutes = currentHour * 60 + currentMinute;

        // Trading hours: 9:00 (540 min) to 13:30 (810 min)
        const tradingStart = 9 * 60; // 540
        const tradingEnd = 13 * 60 + 30; // 810

        // Filter data within trading hours only (real data from API)
        const tradingData = data.filter(point => {
            if (!point.time) return false;
            const [hour, minute] = point.time.split(':').map(Number);
            const pointMinutes = hour * 60 + minute;
            return pointMinutes >= tradingStart && pointMinutes <= tradingEnd;
        });

        // Create complete time series with real data and null for missing/future times
        const completeTimeSeries: { time: string; value: number | null }[] = [];
        const dataMap = new Map<string, number>();

        tradingData.forEach(point => {
            if (point.time) {
                dataMap.set(point.time, point.value);
            }
        });

        // Generate all time slots from 9:00 to 13:30 (every 5 minutes)
        for (let minutes = tradingStart; minutes <= tradingEnd; minutes += 5) {
            const hour = Math.floor(minutes / 60);
            const minute = minutes % 60;
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

            // Only use real data from API, no forward fill
            const value = dataMap.get(timeStr) ?? null;

            completeTimeSeries.push({ time: timeStr, value });
        }

        return completeTimeSeries;
    }, [data]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "glass group relative overflow-hidden p-5 transition-all duration-500 outline-none focus:outline-none hover:glass-hover ring-1 ring-main",
                isCheap && "after:absolute after:inset-0 after:rounded-[1.5rem] after:border-2 after:border-accent/30 after:animate-pulse"
            )}
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-accent/5 text-mute font-fira tracking-widest">
                            {id}
                        </span>
                        <span className={cn(
                            "text-[10px] font-black px-1.5 py-0.5 rounded tracking-widest font-fira",
                            category === "官股" ? "bg-accent/10 text-accent" : "bg-purple-500/10 text-purple-400"
                        )}>
                            {category}
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-fg tracking-tighter font-archivo">{name}</h3>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black font-fira tracking-tighter text-fg">
                        {price > 0 ? price.toFixed(2) : '---'}
                    </div>
                    <div className={cn(
                        "flex items-center justify-end gap-1 text-[10px] font-black font-fira",
                        change > 0 ? "text-rise drop-shadow-[0_0_8px_var(--glow)]" : change < 0 ? "text-fall drop-shadow-[0_0_8px_var(--glow)]" : "text-mute"
                    )}>
                        {change > 0 ? <TrendingUp size={10} /> : change < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                        <span>{typeof diff === 'number' && typeof change === 'number' ? `${change > 0 ? "+" : ""}${diff.toFixed(2)} (${change > 0 ? "+" : ""}${change.toFixed(2)}%)` : '---'}</span>
                    </div>
                </div>
            </div>

            <div className="h-20 w-full mb-4">
                {chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} className="focus:outline-none outline-none">
                            <defs>
                                <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={change > 0 ? "var(--color-rise)" : change < 0 ? "var(--color-fall)" : "var(--fg-mute)"} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={change > 0 ? "var(--color-rise)" : change < 0 ? "var(--color-fall)" : "var(--fg-mute)"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="time"
                                tick={{ fill: 'var(--fg-mute)', fontSize: 9, fontWeight: 'bold' }}
                                tickLine={false}
                                id={`xaxis-${id}`}
                                axisLine={{ stroke: 'var(--border)' }}
                                ticks={['09:00', '11:00', '13:30']}
                            />
                            <YAxis hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                            <Tooltip
                                trigger="hover"
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length && payload[0].value !== null) {
                                        return (
                                            <div className="glass bg-slate-950/90 border-main p-2 rounded-lg shadow-[0_0_20px_var(--glow)]">
                                                <p className="text-[10px] font-black text-white px-1 mb-1 font-fira tracking-tighter">
                                                    {Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-[8px] font-black text-accent/50 uppercase px-1 font-fira tracking-widest">
                                                    {payload[0].payload.time}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={change > 0 ? "var(--color-rise)" : change < 0 ? "var(--color-fall)" : "var(--fg-mute)"}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#gradient-${id})`}
                                isAnimationActive={true}
                                animationDuration={1500}
                                connectNulls={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex items-center justify-center border border-dashed border-main rounded-xl bg-accent/2">
                        <span className="text-[10px] font-black text-mute uppercase tracking-widest animate-pulse">
                            數據同步中...
                        </span>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-main">
                <div className="flex items-center gap-1.5 font-fira">
                    <span className="text-[9px] font-black text-mute uppercase tracking-widest leading-none">P/B 歷史分位</span>
                    <span className={cn(
                        "text-xs font-black",
                        pbPercentile < 20 ? "text-fall" : pbPercentile > 80 ? "text-rise" : "text-fg"
                    )}>
                        {pbPercentile}%
                    </span>
                </div>
                <div className="group/info relative">
                    <button className="w-8 h-8 rounded-full border border-main flex items-center justify-center text-mute hover:text-accent hover:border-accent transition-all">
                        <Info size={14} />
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 w-56 p-4 glass opacity-0 group-hover/info:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/info:translate-y-0 z-50 shadow-2xl">
                        <p className="text-[10px] font-bold leading-relaxed text-mute">
                            目前 P/B 為 <span className="text-fg font-black">{typeof pbValue === 'number' ? pbValue.toFixed(2) : '--'}</span>，處於 5 年歷史位階的 <span className="text-fg font-black">{pbPercentile}%</span>。
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
