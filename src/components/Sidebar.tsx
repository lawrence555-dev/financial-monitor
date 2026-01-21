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

import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export default function Sidebar() {
    const pathname = usePathname();
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        window.dispatchEvent(new Event('theme-change'));
    };

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-8 bg-[#020617] border-r border-white/5 z-50">
            <div className="mb-12">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center font-black text-slate-950 text-2xl italic shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                    C
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
                                "group relative p-3.5 rounded-2xl transition-all duration-500",
                                isActive
                                    ? "bg-accent/10 text-accent shadow-[inset_0_0_15px_rgba(34,211,238,0.1)]"
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-transform duration-500", isActive && "scale-110")} />
                            <span className="absolute left-full ml-6 px-3 py-1.5 bg-slate-900 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-2xl">
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 whitespace-nowrap">
                                    <div className="w-1.5 h-7 bg-accent rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto flex flex-col items-center gap-6 pb-4">
                <button
                    onClick={toggleTheme}
                    className="p-3.5 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-300"
                    title={theme === 'light' ? "切換至暗色模式" : "切換至明亮模式"}
                >
                    {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
                </button>
                <div className="w-8 h-8 bg-slate-900 rounded-full border border-white/5" />
            </div>
        </aside>
    );
}
