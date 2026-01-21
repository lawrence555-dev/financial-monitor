"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TickerTape from "@/components/TickerTape";
import PortfolioSummary from "@/components/portfolio/PortfolioSummary";
import HoldingList from "@/components/portfolio/HoldingList";
import AssetComposition from "@/components/portfolio/AssetComposition";
import AddHoldingModal from "@/components/portfolio/AddHoldingModal";
import { Plus, RefreshCcw, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/Toast";

import { FHC_STOCKS } from "@/lib/constants";

export default function PortfolioPage() {
    const [holdings, setHoldings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { showToast } = useToast();

    const fetchPortfolio = async () => {
        setLoading(true);
        try {
            // 1. Fetch holdings from our API (already enriched with live prices)
            const res = await fetch("/api/portfolio");
            const data = await res.json();

            if (Array.isArray(data)) {
                const enrichedHoldings = data.map((h: any) => {
                    const stockBase = FHC_STOCKS.find(s => s.id === h.stockId);

                    const marketValue = (h.currentPrice || 0) * h.quantity;
                    const costBasis = (h.avgCost || 0) * h.quantity;
                    const unrealizedProfit = marketValue - costBasis;

                    // 專業會計建議：追蹤預估配息能力 (股利收益)
                    const estCashDividend = stockBase ? (h.quantity * stockBase.cashDividend) : 0;
                    const estStockDividendShares = stockBase ? (h.quantity * stockBase.stockDividend / 10) : 0;

                    const totalReturn = unrealizedProfit + estCashDividend;
                    const totalReturnRoi = costBasis > 0 ? (totalReturn / costBasis) * 100 : 0;

                    return {
                        ...h,
                        marketValue,
                        costBasis,
                        unrealizedProfit,
                        unrealizedRoi: costBasis > 0 ? (unrealizedProfit / costBasis) * 100 : 0,
                        estCashDividend,
                        estStockDividendShares,
                        totalReturn,
                        totalReturnRoi
                    };
                });
                setHoldings(enrichedHoldings);
            } else {
                setHoldings([]);
                if (data && data.error) {
                    console.error("API Error:", data.error);
                }
            }
        } catch (error) {
            console.error("Fetch portfolio error:", error);
            showToast("無法獲獲投資組合數據", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const handleAddHolding = async (newHolding: any) => {
        try {
            const res = await fetch("/api/portfolio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newHolding),
            });
            if (res.ok) {
                showToast("持股已成功新增", "success");
                fetchPortfolio();
            } else {
                showToast("新增失敗，請稍後再試", "error");
            }
        } catch (error) {
            showToast("伺服器連線失敗", "error");
        }
    };

    const handleDeleteHolding = async (id: string) => {
        try {
            const res = await fetch(`/api/portfolio?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                showToast("已從投資組合移除", "success");
                fetchPortfolio();
            }
        } catch (error) {
            showToast("刪除失敗", "error");
        }
    };

    // Calculations
    const totalValue = holdings.reduce((acc, h) => acc + (h.marketValue || 0), 0);
    const totalCost = holdings.reduce((acc, h) => acc + (h.costBasis || 0), 0);
    const totalProfit = holdings.reduce((acc, h) => acc + (h.unrealizedProfit || 0), 0);
    const totalRoi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    // 專業會計觀點：計算總投報 (價差 + 股息)
    const totalEstDividend = holdings.reduce((acc, h) => acc + (h.estCashDividend || 0), 0);
    const totalEstReturn = totalProfit + totalEstDividend;
    const totalReturnRoi = totalCost > 0 ? (totalEstReturn / totalCost) * 100 : 0;

    const compositionData = holdings.map(h => ({
        name: h.stock.name,
        value: (h.currentPrice || 0) * h.quantity
    })).filter(d => d.value > 0);

    return (
        <div className="min-h-screen bg-[#020617] pl-20 transition-all duration-700 font-inter text-slate-200">
            <Sidebar />
            <div className="flex flex-col min-h-screen">
                <TickerTape />

                <main className="p-8 max-w-7xl mx-auto w-full">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-3 text-rise font-black uppercase tracking-[0.2em] text-[10px] mb-2">
                                <Wallet size={14} /> My Portfolio Assets
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tighter">投資組合監控</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchPortfolio()}
                                className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-slate-400"
                            >
                                <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-rise rounded-xl text-white font-black shadow-lg shadow-rise/20 hover:bg-rose-600 transition-all active:scale-95"
                            >
                                <Plus size={18} /> 新增持股
                            </button>
                        </div>
                    </header>

                    {loading && holdings.length === 0 ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-rise/20 border-t-rise rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <PortfolioSummary
                                totalValue={totalValue}
                                totalProfit={totalProfit}
                                totalRoi={totalRoi}
                                totalReturnRoi={totalReturnRoi}
                                estDividend={totalEstDividend}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 order-2 lg:order-1">
                                    <div className="glass border-white/5 overflow-hidden">
                                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">持股清單</h3>
                                            <span className="text-[10px] text-slate-500 font-black px-2 py-1 bg-white/5 rounded italic">
                                                Updated Live
                                            </span>
                                        </div>
                                        <HoldingList
                                            holdings={holdings}
                                            onDelete={handleDeleteHolding}
                                        />
                                    </div>
                                </div>

                                <div className="order-1 lg:order-2">
                                    <AssetComposition data={compositionData} />
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <AddHoldingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddHolding}
            />
        </div>
    );
}
