"use client";

import { Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Holding {
    id: string;
    stockId: string;
    avgCost: number;
    quantity: number;
    stock: {
        name: string;
    };
    currentPrice?: number;
}

interface HoldingListProps {
    holdings: Holding[];
    onDelete: (id: string) => void;
}

export default function HoldingList({ holdings, onDelete }: HoldingListProps) {
    if (holdings.length === 0) {
        return (
            <div className="glass p-12 border-white/5 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-4">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">尚未建立投資組合</h3>
                <p className="text-slate-400 max-w-sm">點擊「新增持股」按鈕，開始追蹤您的金融核心持股與損益。</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/5">
                        <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">股票</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">平均成本</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">當前市價</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">持有股數</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">當前市值</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">未實現損益</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {holdings.map((holding) => {
                        const currentPrice = holding.currentPrice || 0;
                        const currentValue = currentPrice * holding.quantity;
                        const costBasis = holding.avgCost * holding.quantity;
                        const profit = currentValue - costBasis;
                        const roi = costBasis > 0 ? (profit / costBasis) * 100 : 0;
                        const isProfit = profit >= 0;

                        return (
                            <tr key={holding.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <td className="py-4 px-4">
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold">{holding.stock.name}</span>
                                        <span className="text-[10px] text-slate-500 font-bold">{holding.stockId}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-slate-300 font-bold">${holding.avgCost.toFixed(2)}</td>
                                <td className="py-4 px-4 text-white font-bold">${currentPrice.toLocaleString()}</td>
                                <td className="py-4 px-4 text-slate-300 font-bold">{holding.quantity.toLocaleString()}</td>
                                <td className="py-4 px-4 text-white font-black">${currentValue.toLocaleString()}</td>
                                <td className="py-4 px-4">
                                    <div className={cn(
                                        "flex flex-col font-bold",
                                        isProfit ? "text-rise" : "text-fall"
                                    )}>
                                        <span>{isProfit ? "+" : ""}{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        <span className="text-[10px]">{isProfit ? "+" : ""}{roi.toFixed(2)}%</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <button
                                        onClick={() => onDelete(holding.id)}
                                        className="p-2 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
