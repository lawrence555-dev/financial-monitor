"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STOCKS = [
    { id: "2881", name: "富邦金", price: 95.5, diff: -1.5, change: -1.55, isUp: false },
    { id: "2882", name: "國泰金", price: 75.9, diff: -0.5, change: -0.65, isUp: false },
    { id: "2886", name: "兆豐金", price: 40.65, diff: 0.2, change: 0.49, isUp: true },
    { id: "2891", name: "中信金", price: 49.7, diff: 0.35, change: 0.71, isUp: true },
    { id: "2880", name: "華南金", price: 31.85, diff: 0.35, change: 1.11, isUp: true },
    { id: "2884", name: "玉山金", price: 32.85, diff: 0.05, change: 0.15, isUp: true },
    { id: "2892", name: "第一金", price: 29.7, diff: 0.05, change: 0.17, isUp: true },
    { id: "2885", name: "元大金", price: 40.8, diff: -0.3, change: -0.73, isUp: false },
    { id: "2887", name: "台新新光金", price: 20.85, diff: 0.1, change: 0.48, isUp: true },
    { id: "2890", name: "永豐金", price: 29.2, diff: 0.0, change: 0.0, isUp: true },
    { id: "2883", name: "凱基金", price: 17.45, diff: -0.15, change: -0.85, isUp: false },
    { id: "2889", name: "國票金", price: 16.75, diff: 0.05, change: 0.3, isUp: true },
    { id: "5880", name: "合庫金", price: 24.1, diff: 0.1, change: 0.42, isUp: true },
];

export default function TickerTape() {
    return (
        <div className="h-10 glass rounded-none border-x-0 border-t-0 border-main overflow-hidden flex items-center z-40 bg-transparent">
            <div className="flex animate-[ticker_60s_linear_infinite] hover:[animation-play-state:paused] h-full">
                {[...STOCKS, ...STOCKS].map((stock, i) => (
                    <div key={`${stock.id}-${i}`} className="flex items-center gap-6 px-8 border-r border-main h-full group opacity-90 hover:opacity-100 transition-opacity flex-shrink-0 whitespace-nowrap">
                        <span className="text-mute text-[10px] font-black font-fira tracking-widest group-hover:text-accent transition-colors">
                            {stock.id}
                        </span>
                        <span className="text-[11px] font-black tracking-tight font-archivo whitespace-nowrap">
                            {stock.name}
                        </span>
                        <span className="text-xs font-fira font-black tracking-tighter">
                            {stock.price.toFixed(2)}
                        </span>
                        <div className={cn(
                            "flex items-center gap-0.5 text-[9px] font-black font-fira leading-none px-1.5 py-0.5 rounded whitespace-nowrap",
                            stock.isUp ? 'text-rise bg-rise/5' : 'text-fall bg-fall/5'
                        )}>
                            {stock.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            <span>{Math.abs(stock.change || 0).toFixed(2)}%</span>
                        </div>
                        <span className="text-[8px] font-black text-mute opacity-40 font-archivo tracking-[0.2em] whitespace-nowrap">
                            即時數據
                        </span>
                    </div>
                ))}
            </div>

            <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
}
