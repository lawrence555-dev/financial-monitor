"use client";

import { useState } from "react";
import { X, Plus, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddHoldingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (holding: { stockId: string; avgCost: number; quantity: number }) => void;
}

const STOCKS = [
    { id: "2881", name: "富邦金" },
    { id: "2882", name: "國泰金" },
    { id: "2886", name: "兆豐金" },
    { id: "2891", name: "中信金" },
    { id: "2880", name: "華南金" },
    { id: "2884", name: "玉山金" },
    { id: "2892", name: "第一金" },
    { id: "2885", name: "元大金" },
    { id: "2887", name: "台新金" },
    { id: "2890", name: "永豐金" },
    { id: "2883", name: "凱基金" },
    { id: "2889", name: "國票金" },
    { id: "5880", name: "合庫金" },
];

export default function AddHoldingModal({ isOpen, onClose, onAdd }: AddHoldingModalProps) {
    const [stockId, setStockId] = useState(STOCKS[0].id);
    const [avgCost, setAvgCost] = useState("");
    const [quantity, setQuantity] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            stockId,
            avgCost: parseFloat(avgCost),
            quantity: parseInt(quantity),
        });
        setAvgCost("");
        setQuantity("");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass max-w-md w-full p-8 border-white/10 shadow-2xl relative"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-rise/10 rounded-2xl flex items-center justify-center text-rise">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">新增持有股</h2>
                                <p className="text-slate-400 text-sm font-bold">記錄您的平均成本以便計算即時損益。</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">選擇金控股票</label>
                                <select
                                    value={stockId}
                                    onChange={(e) => setStockId(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rise/50 transition-all appearance-none"
                                >
                                    {STOCKS.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">平均成本 (NT$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={avgCost}
                                        onChange={(e) => setAvgCost(e.target.value)}
                                        placeholder="例如: 85.5"
                                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rise/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">持有股數</label>
                                    <input
                                        type="number"
                                        required
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="例如: 1000"
                                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rise/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 flex items-center gap-4">
                                <Calculator className="text-slate-500" size={20} />
                                <div className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                    此數據僅存儲於您的本機伺服器中，我們將結合 TWSE 即時數據計算您持有的<strong>未實現損益</strong>。
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-rise rounded-xl text-white font-black shadow-lg shadow-rise/20 hover:bg-rose-600 transition-all active:scale-95"
                            >
                                確認新增至投資組合
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
