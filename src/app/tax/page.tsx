"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TickerTape from "@/components/TickerTape";
import { Calculator, Info, RotateCcw, TrendingUp, Wallet, ShieldCheck, ReceiptText } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useToast } from "@/components/Toast";

const TAX_RATE = 0.085; // 所得稅可抵減稅額 8.5%
const TAX_LIMIT = 80000; // 每一申報戶抵減上限 8 萬
const NHI_RATE = 0.0211; // 二代健保補充保費 2.11%
const NHI_THRESHOLD = 20000; // 健保補費申報門檻 2 萬

const STOCKS_BASE = [
    { id: "2880", name: "華南金", dividend: 1.2 },
    { id: "2881", name: "富邦金", dividend: 3.0 },
    { id: "2882", name: "國泰金", dividend: 2.0 },
    { id: "2883", name: "凱基金", dividend: 1.0 },
    { id: "2884", name: "玉山金", dividend: 1.5 },
    { id: "2885", name: "元大金", dividend: 1.5 },
    { id: "2886", name: "兆豐金", dividend: 1.8 },
    { id: "2887", name: "台新金", dividend: 1.0 },
    { id: "2889", name: "國票金", dividend: 0.7 },
    { id: "2890", name: "永豐金", dividend: 1.2 },
    { id: "2891", name: "中信金", dividend: 1.8 },
    { id: "2892", name: "第一金", dividend: 1.1 },
    { id: "5880", name: "合庫金", dividend: 1.1 },
];

export default function TaxPage() {
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [selectedId, setSelectedId] = useState("2881"); // 預設富邦金
    const [shares, setShares] = useState<number>(10000); // 預設 10 張
    const [userTaxRate, setUserTaxRate] = useState<number>(0.05); // 預設用戶稅率 5%
    const [livePrices, setLivePrices] = useState<Record<string, number>>({});
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        fetchPrices();
        fetchScenarios();
    }, []);

    const fetchPrices = async () => {
        try {
            const res = await fetch("/api/stock-prices/realtime");
            const data = await res.json();
            const prices: Record<string, number> = {};
            if (Array.isArray(data)) {
                data.forEach((s: any) => {
                    prices[s.id] = s.price;
                });
            }
            setLivePrices(prices);
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to fetch prices:", error);
            setIsLoading(false);
        }
    };

    const fetchScenarios = async () => {
        try {
            const res = await fetch("/api/tax/scenarios");
            const data = await res.json();
            if (Array.isArray(data)) {
                setScenarios(data);
            } else {
                setScenarios([]);
            }
        } catch (error) {
            console.error("Failed to fetch scenarios:", error);
            setScenarios([]);
        }
    };

    const handleSave = async () => {
        try {
            // 安全數值校準
            const safeShares = Math.floor(shares || 0);
            const safePrice = selectedStock.price || 0;
            const safeDividend = selectedStock.dividend || 0;
            const safeTotalDividend = totalDividend || 0;
            const safeNetDividend = netDividend || 0;
            const safeNhiPremium = nhiPremium || 0;
            const safeTaxCredit = taxCredit || 0;

            if (safeTotalDividend === 0) {
                showToast("無效的試算數據", "error");
                return;
            }

            const body = {
                stockId: selectedId,
                stockName: selectedStock.name,
                shares: safeShares,
                price: safePrice,
                dividend: safeDividend,
                totalDividend: safeTotalDividend,
                netDividend: safeNetDividend,
                nhiPremium: safeNhiPremium,
                taxCredit: safeTaxCredit
            };

            const res = await fetch("/api/tax/scenarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast("試算情境已儲存至分析中心", "success");
                await fetchScenarios();
            } else {
                const errData = await res.json();
                console.error("Save failed:", errData);
                showToast(`儲存失敗: ${errData.error || "伺服器錯誤"}`, "error");
            }
        } catch (error) {
            console.error("Save error:", error);
            showToast("聯網失敗，請稍後再試", "error");
        }
    };

    const handleDeleteScenario = async (id: string) => {
        try {
            const res = await fetch(`/api/tax/scenarios?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("情境已刪除", "info");
                await fetchScenarios();
            }
        } catch (error) {
            showToast("刪除失敗", "error");
        }
    };

    const STOCKS = STOCKS_BASE.map(s => ({
        ...s,
        price: livePrices[s.id] || 0
    }));

    const selectedStock = STOCKS.find(s => s.id === selectedId) || STOCKS[1];

    const totalDividend = (shares || 0) * (selectedStock.dividend || 0);
    const nhiPremium = totalDividend >= NHI_THRESHOLD ? totalDividend * NHI_RATE : 0;
    const taxCredit = Math.min(totalDividend * TAX_RATE, TAX_LIMIT);
    const netDividend = totalDividend - nhiPremium;
    const dividendYield = selectedStock.price > 0 ? (selectedStock.dividend / selectedStock.price) * 100 : 0;

    const incomeTaxBurden = totalDividend * userTaxRate;
    const netReturnWithTax = netDividend - incomeTaxBurden + taxCredit;

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#020617] pl-20 transition-all duration-700 font-inter text-slate-200">
            <Sidebar />
            <div className="flex flex-col min-h-screen">
                <TickerTape />

                <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full pb-20">
                    <header className="mb-8 flex items-end justify-between border-b border-white/10 pb-6">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                <Calculator className="text-rise w-10 h-10" />
                                財經終端：金控股息試算系統
                            </h1>
                            <p className="text-slate-500 text-sm font-bold">
                                整合二代健保補充保費與所得稅抵減演算法 • {new Date().toLocaleDateString('zh-TW')}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
                                <span className="text-[10px] block text-slate-500 font-black tracking-widest uppercase">系統狀態</span>
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    即時連線中
                                </span>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                        {/* 左：精簡控制器 */}
                        <div className="lg:col-span-1 space-y-6">
                            <section className="glass p-6 border-white/10 bg-slate-900/60 ring-1 ring-white/5">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">標的選擇</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {STOCKS.map(stock => (
                                                <button
                                                    key={stock.id}
                                                    onClick={() => setSelectedId(stock.id)}
                                                    className={cn(
                                                        "py-2 px-1 rounded-lg text-[11px] font-black transition-all border flex flex-col items-center",
                                                        selectedId === stock.id
                                                            ? "bg-rise border-rise text-white shadow-lg shadow-rise/20"
                                                            : "bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-white"
                                                    )}
                                                >
                                                    <span>{stock.name}</span>
                                                    <span className="text-[9px] opacity-40 font-mono">{stock.id}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">持股數量 (股)</label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={shares}
                                                onChange={(e) => setShares(Number(e.target.value))}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-2xl font-black text-white focus:outline-none focus:ring-1 focus:ring-rise/50 font-mono"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xs">QTY</div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1.5 mt-3">
                                            {[1000, 10000, 50000, 100000].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => setShares(v)}
                                                    className="py-2 rounded-lg bg-white/5 text-[10px] font-black text-slate-500 hover:bg-white/10 hover:text-white border border-white/5 transition-all outline-none"
                                                >
                                                    {v >= 10000 ? `${v / 10000}張` : `${v}股`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">個人邊際稅率</label>
                                        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 ring-1 ring-white/5">
                                            {[0.05, 0.12, 0.2, 0.3, 0.4].map(rate => (
                                                <button
                                                    key={rate}
                                                    onClick={() => setUserTaxRate(rate)}
                                                    className={cn(
                                                        "flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all",
                                                        userTaxRate === rate
                                                            ? "bg-blue-600 text-white shadow-inner"
                                                            : "text-slate-500 hover:text-white"
                                                    )}
                                                >
                                                    {rate * 100}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={isLoading || selectedStock.price === 0}
                                        className="w-full py-4 bg-rise text-white rounded-xl font-black text-sm shadow-xl shadow-rise/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        <TrendingUp size={16} /> 儲存至分析看板
                                    </button>
                                </div>
                            </section>

                            <div className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                                <div className="flex gap-3 text-blue-400 mb-2">
                                    <Info size={16} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">稅務提醒</span>
                                </div>
                                <p className="text-[12px] text-slate-400 font-bold leading-relaxed">
                                    單次配息達 NT$20,000 將觸發 2.11% 補充保費。目前配置: {nhiPremium > 0 ? "⚠️ 已觸發" : "✅ 未觸發"}
                                </p>
                            </div>
                        </div>

                        {/* 中與右：核心數據中心 */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* 大型主要數據卡 */}
                                <div className="md:col-span-2 glass bg-gradient-to-br from-slate-900 to-black p-8 border-white/10 ring-1 ring-white/5 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 block">預估年度配息總額</span>
                                        <div className="flex items-baseline gap-4">
                                            <h2 className="text-7xl font-black text-white font-mono tracking-tighter">
                                                {formatCurrency(totalDividend)}
                                            </h2>
                                            <span className="text-emerald-400 text-xl font-black font-mono">
                                                +{dividendYield.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                                        <div>
                                            <span className="text-[9px] block text-slate-600 font-black uppercase mb-1">稅後實領</span>
                                            <span className="text-xl font-black text-white font-mono">{formatCurrency(netDividend)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] block text-slate-600 font-black uppercase mb-1">二代健保</span>
                                            <span className={cn("text-xl font-black font-mono", nhiPremium > 0 ? "text-rose-500" : "text-slate-500")}>
                                                -{formatCurrency(nhiPremium)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] block text-slate-600 font-black uppercase mb-1">可抵減稅額</span>
                                            <span className="text-xl font-black text-blue-400 font-mono">+{formatCurrency(taxCredit)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 即時標的分析卡 */}
                                <div className="glass p-6 border-white/10 bg-slate-900/40 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-2xl font-black text-white">{selectedStock.name}</h3>
                                            <span className="text-xs font-bold text-slate-500 font-mono">{selectedId}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] block text-slate-600 font-black uppercase mb-1">預估股息</span>
                                            <span className="text-lg font-black text-rise font-mono">{selectedStock.dividend} <small className="text-[10px]">NT</small></span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">當前股價匯率</span>
                                            <span className="text-white font-mono">{selectedStock.price || "---"} TWD</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">所得稅負擔 ({userTaxRate * 100}%)</span>
                                            <span className="text-rose-400 font-mono">-{formatCurrency(incomeTaxBurden)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-black pt-4 border-t border-white/5">
                                            <span className="text-slate-400">真金白銀收益</span>
                                            <span className="text-white font-mono">{formatCurrency(netReturnWithTax)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 會計師節稅導航 - 更新佈局 */}
                            <section className="glass p-8 bg-slate-900/60 border-white/10 ring-1 ring-white/5 relative overflow-hidden group">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-fall/20 rounded-lg flex items-center justify-center text-fall">
                                        <TrendingUp size={18} />
                                    </div>
                                    <h3 className="text-lg font-black text-white tracking-widest uppercase italic">節稅導航 (Audit Insights)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[13px] font-bold text-slate-300 leading-relaxed">
                                                {taxCredit > incomeTaxBurden
                                                    ? `✅ 策略分析：您的股息可抵減稅額高於應繳稅額，實質上增加了 ${((taxCredit - incomeTaxBurden) / (totalDividend || 1) * 100).toFixed(2)}% 的顯性收益。`
                                                    : `⚠️ 策略建議：目前的邊際稅率較高，建議將申報戶分散，或優先選擇配發資本利得佔比較高的標的。`}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">稅務抵減效能 (Efficiency)</span>
                                            <span className={cn("text-xs font-black", taxCredit >= incomeTaxBurden ? "text-emerald-400" : "text-rose-400")}>
                                                {((taxCredit / (incomeTaxBurden || 1)) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className={cn("h-full transition-all duration-1000", taxCredit >= incomeTaxBurden ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${Math.min(100, (taxCredit / (incomeTaxBurden || 1)) * 100)}%` }} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-2">
                                        {[0.05, 0.12, 0.2, 0.3, 0.4].map(r => {
                                            const burden = totalDividend * r;
                                            const credit = Math.min(totalDividend * TAX_RATE, TAX_LIMIT);
                                            const net = netDividend - burden + credit;
                                            const isActive = r === userTaxRate;
                                            return (
                                                <div key={r} className={cn(
                                                    "p-3 rounded-xl border flex flex-col items-center justify-center transition-all",
                                                    isActive ? "bg-white/10 border-white/20 ring-1 ring-white/10" : "bg-white/5 border-transparent opacity-40 scale-95"
                                                )}>
                                                    <span className="text-[8px] font-black text-slate-500 mb-1">{r * 100}%</span>
                                                    <span className="text-[11px] font-black text-white font-mono">{(net / 1000).toFixed(1)}k</span>
                                                </div>
                                            );
                                        })}
                                        <div className="col-span-5 text-center mt-2">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">各級距稅後實領對照量 (單位: TWD)</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* 數據看板：橫向比對中心 */}
                    <div className="border-t border-white/10 pt-10">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-widest uppercase italic flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-fall rounded-full" />
                                    雲端分析看板 (Case Benchmarking)
                                </h3>
                                <p className="text-slate-600 text-xs font-bold mt-1">針對已儲存的多組配置進行交叉分析</p>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">資料承載量</span>
                                    <div className="flex gap-1 mt-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={cn("w-3 h-1 rounded-full", i <= scenarios.length ? "bg-rise shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-white/5")}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {scenarios.length === 0 ? (
                            <div className="h-60 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center text-slate-600 bg-white/[0.01]">
                                <RotateCcw size={32} className="mb-4 opacity-20" />
                                <p className="text-sm font-black uppercase tracking-widest opacity-40">目前尚無分析數據</p>
                                <p className="text-xs font-bold mt-1 opacity-20">請點擊上方儲存按鈕開始累積試算模型</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {scenarios.map((s, idx) => (
                                    <motion.div
                                        key={s.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass p-5 bg-black/40 border-white/5 relative group hover:border-white/20 transition-all ring-1 ring-white/5"
                                    >
                                        <button
                                            onClick={() => handleDeleteScenario(s.id)}
                                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-rose-500 transition-all bg-white/5 rounded-lg"
                                        >
                                            <RotateCcw size={12} className="rotate-45" />
                                        </button>
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-lg font-black text-white">{s.stockName}</h4>
                                                <span className="text-[10px] font-black text-rise font-mono">{(s.dividend / (s.price || 1) * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[10px] font-black text-slate-600 font-mono italic">#{s.stockId}</span>
                                                <span className="text-[10px] font-black text-slate-400">{((s.shares || 0) / 1000).toFixed(0)}張</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 py-3 border-y border-white/5">
                                            <div className="flex justify-between text-[11px] font-bold">
                                                <span className="text-slate-600">配息總領</span>
                                                <span className="text-white font-mono">{formatCurrency(s.totalDividend)}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold">
                                                <span className="text-slate-600">淨額實收</span>
                                                <span className="text-rise font-mono">{formatCurrency(s.netDividend)}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[9px] font-black text-slate-600 uppercase">避稅評級</span>
                                                <span className={cn("text-[9px] font-black", s.nhiPremium > 0 ? "text-rose-500" : "text-emerald-500")}>
                                                    {s.nhiPremium > 0 ? "TIER C" : "TIER A+"}
                                                </span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className={cn("h-full", s.nhiPremium > 0 ? "bg-rose-500 w-[30%]" : "bg-emerald-500 w-full")} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {scenarios.length < 5 && (
                                    <div className="glass border border-dashed border-white/5 flex items-center justify-center opacity-30 min-h-[180px]">
                                        <div className="text-center p-6">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Slot {scenarios.length + 1}</span>
                                            <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center mx-auto text-slate-700">
                                                +
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

waitForPreviousTools: true;
