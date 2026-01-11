"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
    data: { value: number }[];
}

export default function FhcCard({
    id, name, price, diff, change, isUp, category, pbValue, pbPercentile, data
}: FhcCardProps) {
    // Breathing light effect for low valuation (cheap Zone)
    const isCheap = pbPercentile < 15;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={cn(
                "glass group relative overflow-hidden p-5 transition-all duration-500",
                "hover:glass-hover hover:shadow-2xl hover:shadow-rise/10",
                isCheap && "after:absolute after:inset-0 after:rounded-[1rem] after:border-2 after:border-fall/30 after:animate-pulse"
            )}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10 text-slate-400 uppercase tracking-widest">
                            {id}
                        </span>
                        <span className={cn(
                            "text-[10px] font-black px-1.5 py-0.5 rounded tracking-widest",
                            category === "官股" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                        )}>
                            {category}
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tighter">{name}</h3>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black font-mono tracking-tighter text-white">
                        {price.toFixed(2)}
                    </div>
                    <div className={cn(
                        "flex items-center justify-end gap-1 text-[10px] font-bold",
                        change > 0 ? "text-rise" : change < 0 ? "text-fall" : "text-slate-400"
                    )}>
                        {change > 0 ? <TrendingUp size={10} /> : change < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                        <span>{change > 0 ? "+" : ""}{diff.toFixed(2)} ({change > 0 ? "+" : ""}{change.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>

            <div className="h-20 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={change > 0 ? "#ef4444" : change < 0 ? "#22c55e" : "#94a3b8"} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={change > 0 ? "#ef4444" : change < 0 ? "#22c55e" : "#94a3b8"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <YAxis hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                        <Tooltip
                            trigger="hover"
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="glass bg-slate-950/90 border-white/10 p-2 rounded-lg shadow-2xl">
                                            <p className="text-[10px] font-black text-white px-1 mb-1">
                                                {payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase px-1">
                                                即時報價
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
                            stroke={change > 0 ? "#ef4444" : change < 0 ? "#22c55e" : "#94a3b8"}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#gradient-${id})`}
                            isAnimationActive={true}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">P/B位階</span>
                    <span className={cn(
                        "text-xs font-black font-mono",
                        pbPercentile < 20 ? "text-fall" : pbPercentile > 80 ? "text-rise" : "text-slate-300"
                    )}>
                        {pbPercentile}%
                    </span>
                </div>
                <div className="group/info relative">
                    <Info size={14} className="text-slate-600 hover:text-white cursor-help transition-colors" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-3 glass bg-slate-900 border-white/10 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/info:translate-y-0 z-50 shadow-2xl">
                        <p className="text-[10px] font-bold leading-relaxed text-slate-300">
                            目前 P/B 為 <span className="text-white font-black">{pbValue.toFixed(2)}</span>，處於 5 年歷史位階的 <span className="text-white font-black">{pbPercentile}%</span>。
                            {pbPercentile < 15 ? " 目前極度低估，適合穩健投資者關注。" : ""}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
