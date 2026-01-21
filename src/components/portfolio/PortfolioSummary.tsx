"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioSummaryProps {
    totalValue: number;
    totalProfit: number;
    totalRoi: number;
    totalReturnRoi: number;
    estDividend: number;
}

export default function PortfolioSummary({ totalValue, totalProfit, totalRoi, totalReturnRoi, estDividend }: PortfolioSummaryProps) {
    const isProfit = totalProfit >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 border-white/5 relative overflow-hidden group"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <DollarSign size={20} />
                    </div>
                    <span className="text-slate-400 text-sm font-bold">總資產價值</span>
                </div>
                <div className="text-3xl font-black text-white">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={64} />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass p-6 border-white/5 relative overflow-hidden group"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className={cn(
                        "p-2 rounded-lg",
                        isProfit ? "bg-rise/10 text-rise" : "bg-fall/10 text-fall"
                    )}>
                        {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <span className="text-slate-400 text-sm font-bold">總損益 (未實現)</span>
                </div>
                <div className={cn(
                    "text-3xl font-black",
                    isProfit ? "text-rise" : "text-fall"
                )}>
                    {isProfit ? "+" : ""}${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={64} />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-6 border-white/5 relative overflow-hidden group"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                        <PieChart size={20} />
                    </div>
                    <span className="text-slate-400 text-sm font-bold">總報酬率 (ROI)</span>
                </div>
                <div className={cn(
                    "text-3xl font-black",
                    isProfit ? "text-rise" : "text-fall"
                )}>
                    {isProfit ? "+" : ""}{totalRoi.toFixed(2)}%
                </div>
                <div className="mt-1 text-[10px] font-bold text-blue-400/80 bg-blue-500/5 px-2 py-0.5 rounded inline-block uppercase tracking-wider">
                    Total Return (含息): {totalReturnRoi >= 0 ? "+" : ""}{totalReturnRoi.toFixed(2)}%
                </div>
                {estDividend > 0 && (
                    <div className="mt-2 text-[10px] font-black text-blue-400/80 bg-blue-500/5 px-2 py-1 rounded inline-block uppercase tracking-widest">
                        Est. Dividend: +${estDividend.toLocaleString()}
                    </div>
                )}
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <PieChart size={64} />
                </div>
            </motion.div>
        </div>
    );
}
