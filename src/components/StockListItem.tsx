"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import TradingChart from "@/components/TradingChart";
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
        <div className="glass border-b-0 py-2.5 px-4 flex items-center group hover:glass-hover transition-all duration-300 gap-4">
            {/* Left: Stock Code & Name */}
            <div className="flex items-center gap-3 min-w-[140px]">
                <div className="w-8 h-8 rounded-lg glass border-main flex items-center justify-center font-black text-accent text-[10px] group-hover:scale-110 transition-transform shrink-0">
                    {id.slice(-2)}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-black text-mute font-mono">代號 {id}</span>
                        <span className={cn(
                            "text-[8px] font-black px-1 py-0.5 rounded tracking-widest uppercase shrink-0",
                            category === "官股" ? "bg-accent/10 text-accent" : "bg-purple-500/10 text-purple-400"
                        )}>
                            {category}
                        </span>
                    </div>
                    <h3 className="text-sm font-black font-archivo group-hover:text-accent transition-colors tracking-tight truncate">{name}</h3>
                </div>
            </div>

            {/* Middle: Compact Chart - Full Horizontal Width */}
            <div className="h-10 flex-1 max-w-[400px] focus:outline-none -mx-4">
                {chartData.length > 0 ? (
                    <div className="h-10 w-full pointer-events-none transition-opacity">
                        <TradingChart
                            data={chartData as { time: string; value: number }[]}
                            isUp={isUp}
                            height={40}
                            enableGrid={false}
                            enableCrosshair={false}
                            enableTimeScale={false}
                            enablePriceScale={false}
                            lineWidth={2}
                        />
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center border border-dashed border-main rounded-lg opacity-30">
                        <span className="text-[8px] font-black uppercase tracking-widest">Loading...</span>
                    </div>
                )}
            </div>

            {/* Price & Change - Horizontal */}
            <div className="flex items-center gap-4 ml-auto">
                <div className="flex flex-col items-end">
                    <span className="text-lg font-black font-fira tracking-tighter leading-none text-fg">
                        {price > 0 ? price.toFixed(2) : '---'}
                    </span>
                    <div className={cn(
                        "flex items-center gap-1 text-[9px] font-black font-fira mt-1",
                        change > 0 ? "text-rise" : change < 0 ? "text-fall" : "text-mute"
                    )}>
                        {change > 0 ? <TrendingUp size={8} /> : change < 0 ? <TrendingDown size={8} /> : <Minus size={8} />}
                        <span>{typeof diff === 'number' && typeof change === 'number' ? `${change > 0 ? "+" : ""}${diff.toFixed(2)} (${change > 0 ? "+" : ""}${change.toFixed(2)}%)` : '---'}</span>
                    </div>
                </div>

                {/* P/B Position */}
                <div className="flex items-center gap-2 border-l border-main pl-4">
                    <div className="text-right">
                        <p className="text-[8px] font-black text-mute uppercase tracking-widest mb-1 leading-none">P/B 位階</p>
                        <p className={cn(
                            "text-base font-black font-fira leading-none",
                            pbPercentile < 20 ? "text-fall" : pbPercentile > 80 ? "text-rise" : "text-fg"
                        )}>
                            {pbPercentile}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
