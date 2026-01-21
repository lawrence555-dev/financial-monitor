"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import TradingChart from "@/components/TradingChart";
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
    data: { time?: string; value: number }[];
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
                {data && data.length > 0 ? (
                    <div className="h-20 w-full pointer-events-none">
                        <TradingChart
                            data={data as { time: string; value: number }[]}
                            isUp={isUp}
                            height={80}
                            enableGrid={false}
                            enableCrosshair={false}
                            enableTimeScale={false}
                            enablePriceScale={false}
                            lineWidth={2}
                        />
                    </div>
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
