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

import { FHC_STOCKS } from "@/lib/constants";

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
            const safeDividend = selectedStock.cashDividend || 0;
            const safeTotalDividend = totalDividend || 0;
            const safeNetDividend = netCash || 0;
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
                cashDividend: safeDividend,
                stockDividend: selectedStock.stockDividend || 0, // 新增：保存配股資訊
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
                // 顯示具體的錯誤原因 (如資料庫表不存在或連線問題)
                const errorMsg = errData.details || errData.error || "伺服器錯誤";
                showToast(`儲存失敗: ${errorMsg}`, "error");
            }
        } catch (error: any) {
            console.error("Save error:", error);
            showToast(`聯網失敗: ${error?.message || "請檢查網路連線"}`, "error");
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

    const STOCKS = FHC_STOCKS.map(s => ({
        ...s,
        price: livePrices[s.id] || 0
    }));

    const selectedStock = STOCKS.find(s => s.id === selectedId) || STOCKS[1];

    const totalCash = (shares || 0) * (selectedStock.cashDividend || 0);
    const sharesFromStockDividend = (shares || 0) * (selectedStock.stockDividend || 0) / 10; // 每股配發金額 / 10 = 配發股數比例 (例如配 0.5 元即 1:0.05)

    // 專業會計準則：配股部分以面額 $10 課稅
    const taxableStockValue = (shares || 0) * (selectedStock.stockDividend || 0); // 因為 stockDividend 通常以「元/股」表示，且台股面額為 $10，故 0.1 元 = 1% 配股
    const taxableDividend = totalCash + taxableStockValue;

    // 二代健保：以 20,000 為門檻，稅基為 (現金股利 + 配股面額)
    const nhiPremium = taxableDividend >= NHI_THRESHOLD ? taxableDividend * NHI_RATE : 0;

    // 可抵減稅額：稅基 * 8.5%，上限 8 萬
    const taxCredit = Math.min(taxableDividend * TAX_RATE, TAX_LIMIT);

    // 實拿現金：總現金 - 二代健保 (證券商通常從現金中扣除)
    const netCash = totalCash - nhiPremium;

    // 總投資收益 (含配股市值)：淨現金 + (配發股數 * 當前股價)
    const totalStockMarketValue = (shares > 0 && selectedStock.price > 0)
        ? (shares * (selectedStock.stockDividend || 0) / 10 * selectedStock.price)
        : 0;
    const totalDividend = netCash + totalStockMarketValue;

    // 修正：殖利率計算應基於當前股價，且排除 0 價情形
    const dividendYield = (selectedStock.price > 0 && shares > 0)
        ? (totalDividend / (shares * selectedStock.price)) * 100
        : 0;

    // 所得稅負擔
    const incomeTaxBurden = taxableDividend * userTaxRate;
    // 最終年度淨資產增加 (含配股、含稅務抵減)
    const netReturnWithTax = totalDividend - incomeTaxBurden + taxCredit;

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
                                整合二代健保補充保費與所得稅抵減演算法 • {new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: true })} (台北時間)
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
                                                type="text"
                                                inputMode="numeric"
                                                value={shares === 0 ? "" : shares}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "");
                                                    setShares(val === "" ? 0 : parseInt(val, 10));
                                                }}
                                                placeholder="請輸入持股數..."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-2xl font-black text-white focus:outline-none focus:ring-1 focus:ring-rise/50 font-mono"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xs">QTY</div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1.5 mt-3">
                                            {[1000, 5000, 10000, 50000].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => setShares(v)}
                                                    className={cn(
                                                        "py-2 rounded-lg text-[10px] font-black transition-all border outline-none",
                                                        shares === v
                                                            ? "bg-blue-600/30 border-blue-500/50 text-blue-400"
                                                            : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    {v / 1000}張
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
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block">預估總獲利 (含配股市值)</span>
                                            <span className="text-[9px] text-slate-600 font-bold">稅務級距基準: {formatCurrency(taxableDividend)}</span>
                                        </div>
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
                                            <span className="text-[9px] block text-slate-600 font-black uppercase mb-1">入帳現金股利</span>
                                            <span className="text-xl font-black text-white font-mono">{formatCurrency(netCash)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] block text-slate-600 font-black uppercase mb-1">二代健保扣費</span>
                                            <span className={cn("text-xl font-black font-mono", nhiPremium > 0 ? "text-rose-500" : "text-slate-500")}>
                                                -{formatCurrency(nhiPremium)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] block text-slate-600 font-black uppercase mb-1">所得稅抵減 (8.5%)</span>
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
                                            <span className="text-[9px] block text-slate-600 font-black uppercase mb-1">預估股息 (現金/股票)</span>
                                            <span className="text-lg font-black text-rise font-mono">
                                                {selectedStock.cashDividend.toFixed(2)} / {selectedStock.stockDividend.toFixed(2)}
                                            </span>
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

                            {/* 會計師節稅導航 - 深度優化版 (敏感度分析儀) */}
                            <section className="glass p-8 bg-slate-900/60 border-white/10 ring-1 ring-white/5 relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                            <ShieldCheck size={22} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white tracking-widest uppercase italic">節稅導航與敏感度分析 (Tax Sensitivity)</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">根據邊際稅率估算您的「實質收益」與「稅後殖利率」</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="text-right border-r border-white/10 pr-6">
                                            <span className="text-[10px] block text-slate-500 font-black uppercase mb-1">抵減效能評估</span>
                                            <span className={cn("text-xl font-black font-mono", taxCredit >= incomeTaxBurden ? "text-emerald-400" : "text-rose-400")}>
                                                {((taxCredit / (incomeTaxBurden || 1)) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] block text-slate-500 font-black uppercase mb-1">實質所得稅率</span>
                                            <span className="text-xl font-black text-white font-mono">
                                                {(((incomeTaxBurden - taxCredit) / (totalDividend || 1)) * 100).toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {/* 左側：深度策略建議 */}
                                    <div className="md:col-span-1 space-y-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden h-full flex flex-col justify-center">
                                            <ReceiptText className="absolute -right-2 -bottom-2 w-16 h-16 text-white/5 -rotate-12" />
                                            <div className="flex items-center gap-2 mb-2 text-blue-400">
                                                <Info size={14} />
                                                <span className="text-[10px] font-black uppercase">會計師觀點</span>
                                            </div>
                                            <p className="text-[12px] font-bold text-slate-300 leading-relaxed relative z-10">
                                                {taxCredit > incomeTaxBurden
                                                    ? `此配置處於「稅務溢價區」，您不僅無需繳稅，還能產生退稅效應，實質額外增加 ${((taxCredit - incomeTaxBurden) / (totalDividend || 1) * 100).toFixed(2)}% 收益。`
                                                    : `處於「稅務遞減區」，建議考慮 ${selectedStock.cashDividend + selectedStock.stockDividend > 1.5 ? "拆單持有" : "增加受供養人"} 以降低邊際稅率，或改配置資本利得股。`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 中右側：多維度對照表 */}
                                    <div className="md:col-span-3">
                                        <div className="grid grid-cols-5 gap-3">
                                            {[0.05, 0.12, 0.2, 0.3, 0.4].map(r => {
                                                const burden = taxableDividend * r;
                                                const credit = Math.min(taxableDividend * TAX_RATE, TAX_LIMIT);
                                                const net = totalDividend - burden + credit;
                                                const effYield = (net / (shares * selectedStock.price || 1)) * 100;
                                                const isActive = r === userTaxRate;

                                                return (
                                                    <div key={r} className={cn(
                                                        "p-4 rounded-2xl border flex flex-col items-center justify-between transition-all duration-300",
                                                        isActive
                                                            ? "bg-gradient-to-b from-blue-600/20 to-blue-900/40 border-blue-500/50 ring-1 ring-blue-500/20 scale-105 shadow-2xl shadow-blue-500/10"
                                                            : "bg-white/5 border-white/10 opacity-50 hover:opacity-80 hover:bg-white/10"
                                                    )}>
                                                        <div className="flex flex-col items-center mb-4">
                                                            <span className="text-[10px] font-black text-slate-500 mb-1">{r * 100}% 級距</span>
                                                            <div className={cn("h-1 w-8 rounded-full mb-3", isActive ? "bg-blue-400" : "bg-slate-700")} />
                                                        </div>

                                                        <div className="text-center space-y-3">
                                                            <div>
                                                                <span className="text-[9px] block text-slate-600 font-bold uppercase mb-0.5">稅後淨得</span>
                                                                <span className="text-lg font-black text-white font-mono italic">
                                                                    {formatCurrency(net).replace('NT$', '')}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] block text-slate-600 font-bold uppercase mb-0.5">實質殖利率</span>
                                                                <span className={cn(
                                                                    "text-sm font-black font-mono",
                                                                    effYield > (selectedStock.cashDividend / selectedStock.price * 100) ? "text-emerald-400" : "text-slate-400"
                                                                )}>
                                                                    {selectedStock.price > 0 ? effYield.toFixed(2) : "0.00"}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isActive && (
                                                            <div className="mt-4 flex items-center gap-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                                                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">當前落點</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* 底部進度條裝飾 */}
                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex-1 mr-10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">抵減上限使用率 ({formatCurrency(taxCredit)} / {formatCurrency(TAX_LIMIT)})</span>
                                            <span className="text-xs font-black text-slate-400 font-mono">{((taxCredit / TAX_LIMIT) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${(taxCredit / TAX_LIMIT) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[9px] font-black text-slate-500 uppercase">免繳區</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                                            <span className="text-[9px] font-black text-slate-500 uppercase">課稅區</span>
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
                                {scenarios.map((s, idx) => {
                                    const sharesNum = Number(s.shares || 0);
                                    const yieldVal = (s.price > 0 && sharesNum > 0)
                                        ? (s.totalDividend / (sharesNum * s.price)) * 100
                                        : 0;

                                    return (
                                        <motion.div
                                            key={s.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass p-5 bg-black/40 border-white/5 relative group hover:border-white/20 transition-all ring-1 ring-white/5 overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600 opacity-60" />

                                            <button
                                                onClick={() => handleDeleteScenario(s.id)}
                                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-rose-500 transition-all bg-white/5 rounded-lg z-20"
                                            >
                                                <RotateCcw size={12} className="rotate-45" />
                                            </button>

                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-lg font-black text-white">{s.stockName}</h4>
                                                    <span className="text-[10px] font-black text-emerald-400 font-mono italic">
                                                        {yieldVal.toFixed(2)}% Yield
                                                    </span>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-[10px] font-black text-slate-600 font-mono">#{s.stockId}</span>
                                                    <span className="text-[10px] font-black text-slate-400">{(sharesNum / 1000).toFixed(0)} 張</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3 py-4 border-y border-white/5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-600 uppercase">現金股利 (淨)</span>
                                                    <span className="text-sm font-black text-white font-mono">{formatCurrency(s.netDividend)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-600 uppercase">股票股利</span>
                                                    <span className="text-sm font-black text-blue-400 font-mono">+{s.stockDividend?.toFixed(2) || "0.00"}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                                    <span className="text-[11px] font-black text-slate-400 uppercase">綜合總獲利</span>
                                                    <span className="text-lg font-black text-rise font-mono">{formatCurrency(s.totalDividend)}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[9px] block text-slate-600 font-black mb-1 uppercase">二代健保</span>
                                                    <span className={cn("text-xs font-bold font-mono", s.nhiPremium > 0 ? "text-rose-500" : "text-emerald-500")}>
                                                        {s.nhiPremium > 0 ? `-${formatCurrency(s.nhiPremium)}` : "免扣"}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] block text-slate-600 font-black mb-1 uppercase">節稅評級</span>
                                                    <span className={cn(
                                                        "text-[10px] font-black px-2 py-0.5 rounded-full ring-1",
                                                        s.taxCredit > s.totalDividend * 0.05 ? "text-emerald-400 ring-emerald-500/30 bg-emerald-500/10" : "text-slate-400 ring-white/10"
                                                    )}>
                                                        {s.taxCredit > s.totalDividend * 0.05 ? "High Efficiency" : "Standard"}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
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
