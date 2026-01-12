"use client";

import { Home, LayoutGrid, Calculator, BrainCircuit, Briefcase, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { icon: Home, label: "總覽", href: "/" },
    { icon: LayoutGrid, label: "價值位階", href: "/valuation" },
    { icon: Briefcase, label: "投資組合", href: "/portfolio" },
    { icon: Calculator, label: "稅務計算", href: "/tax" },
    { icon: BrainCircuit, label: "AI 研究室", href: "/ai-lab" },
    { icon: Settings, label: "系統設定", href: "/settings" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-8 bg-[#020617] border-r border-white/5 z-50">
            <div className="mb-12">
                <div className="w-10 h-10 bg-rise rounded-xl flex items-center justify-center font-black text-white text-xl italic shadow-lg shadow-rise/20">
                    F
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-8">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative p-3 rounded-2xl transition-all duration-300",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                            )}
                        >
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 whitespace-nowrap">
                                    <div className="w-1.5 h-6 bg-rise rounded-full" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto">
                <button className="w-10 h-10 rounded-full border border-white/10 overflow-hidden hover:border-white/30 transition-colors">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                </button>
            </div>
        </aside>
    );
}
