"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import TickerTape from "@/components/TickerTape";
import { useParams } from "next/navigation";
import { ChevronLeft, FileText, Book, Database, History } from "lucide-react";

const DOCS_CONTENT: Record<string, { title: string; category: string; icon: any; content: any }> = {
    "product-guide": {
        title: "產品使用指南",
        category: "Product Guide",
        icon: Book,
        content: (
            <div className="space-y-8">
                <section>
                    <h3 className="text-xl font-black text-white mb-4">1. 快速上手</h3>
                    <p className="text-slate-400 font-bold leading-relaxed">
                        登入系統後，首頁將即時顯示台灣 13 家核心金控公司的實時狀態。您可以透過頂部的跑馬燈快速瀏覽市場漲跌。
                    </p>
                </section>
                <section>
                    <h3 className="text-xl font-black text-white mb-4">2. 核心功能操作</h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-rise text-sm font-black mb-2 uppercase tracking-widest">儀表板監控</h4>
                            <p className="text-slate-400 font-bold leading-relaxed">點擊卡片可開啟右側面板，查看 Gemini 1.5 Pro 提供的 AI 摘要與 15 日籌碼動向。</p>
                        </div>
                        <div>
                            <h4 className="text-rise text-sm font-black mb-2 uppercase tracking-widest">估值熱力圖</h4>
                            <p className="text-slate-400 font-bold leading-relaxed">透過色彩深淺快速判斷全台金控股的整體水位，綠色代表具備安全邊際。</p>
                        </div>
                        <div>
                            <h4 className="text-rise text-sm font-black mb-2 uppercase tracking-widest">稅務計算機</h4>
                            <p className="text-slate-400 font-bold leading-relaxed">自動試算「二代健保補充保費」與「利得扣繳稅額」。</p>
                        </div>
                    </div>
                </section>
            </div>
        )
    },
    "data-sources": {
        title: "數據來源說明",
        category: "Data Sources",
        icon: Database,
        content: (
            <div className="space-y-8">
                <section>
                    <h3 className="text-xl font-black text-white mb-4">1. 股價數據 (Stock Prices)</h3>
                    <p className="text-slate-400 font-bold leading-relaxed">
                        來源：台灣證券交易所 (TWSE) Open Data API。每個交易日 09:00 - 13:30 每 5 分鐘同步一次。
                    </p>
                </section>
                <section>
                    <h3 className="text-xl font-black text-white mb-4">2. 財務指標與估值</h3>
                    <p className="text-slate-400 font-bold leading-relaxed">
                        來源：公開資訊觀測站 (MOPS)。回測 2021 - 2026 累計五年的日結數據進行 P/B Percentile 計算。
                    </p>
                </section>
                <section>
                    <h3 className="text-xl font-black text-white mb-4">3. AI 文本分析</h3>
                    <p className="text-slate-400 font-bold leading-relaxed">
                        技術供應商：Google Gemini 1.5 Pro API。包含 Google News 金融分項、鉅亨網實時新聞。
                    </p>
                </section>
            </div>
        )
    },
    "changelog": {
        title: "開發日誌",
        category: "MVP v0.1",
        icon: History,
        content: (
            <div className="space-y-12">
                <div className="border-l-2 border-rise pl-8 relative">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-rise rounded-full shadow-[0_0_15px_#ef4444]" />
                    <h3 className="text-xl font-black text-white mb-2">v0.1.0 (2026-01-10)</h3>
                    <p className="text-slate-500 text-xs font-black uppercase mb-4 tracking-tighter">精品化與數據校準</p>
                    <ul className="space-y-2 text-slate-400 font-bold list-disc list-inside">
                        <li>實作自定義 Toast 通知系統</li>
                        <li>校正 13 金控之市場數據 (基準日: 2026-01-10)</li>
                        <li>支援「漲跌塊數」與百分比雙顯</li>
                        <li>補齊全套技術文檔與產品指南</li>
                    </ul>
                </div>
                <div className="border-l-2 border-white/10 pl-8 relative">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white/10 rounded-full" />
                    <h3 className="text-xl font-black text-white/50 mb-2">v0.0.9 (2026-01-08)</h3>
                    <p className="text-slate-400 font-bold">集成 Google Gemini 1.5 Pro API 實現 AI 自動摘要。</p>
                </div>
            </div>
        )
    }
};

export default function DocPage() {
    const params = useParams();
    const slug = params.slug as string;
    const doc = DOCS_CONTENT[slug];

    if (!doc) return <div className="p-20 text-white">Document not found</div>;

    const Icon = doc.icon;

    return (
        <div className="flex h-screen bg-[#020617] text-slate-300 font-sans selection:bg-rise/30">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <TickerTape />
                <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 group"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">返回儀表板</span>
                        </Link>

                        <header className="mb-16">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 glass rounded-2xl text-rise">
                                    <Icon size={32} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-rise px-2 py-1 rounded bg-rise/10 uppercase tracking-widest block mb-1 w-fit">
                                        {doc.category}
                                    </span>
                                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">
                                        {doc.title}
                                    </h1>
                                </div>
                            </div>
                        </header>

                        <div className="glass p-8 lg:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <Icon size={200} />
                            </div>
                            <article className="relative z-10">
                                {doc.content}
                            </article>
                        </div>

                        <footer className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-slate-600">
                            <div className="text-[10px] font-black uppercase tracking-widest">
                                FHC-Elite Technical Documentation Center
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest">
                                Last Updated: 2026-01-10
                            </div>
                        </footer>
                    </div>
                </main>
            </div>
        </div>
    );
}
