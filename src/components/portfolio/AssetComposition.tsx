"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AssetData {
    name: string;
    value: number;
}

interface AssetCompositionProps {
    data: AssetData[];
}

const COLORS = ["#f43f5e", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function AssetComposition({ data }: AssetCompositionProps) {
    return (
        <div className="glass p-6 border-white/5 h-[400px] w-full">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6">資產佔比分析</h3>
            <div className="h-full pb-10">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}
                            itemStyle={{ color: "#fff", fontWeight: "bold" }}
                            formatter={(value: number) => `$${value.toLocaleString()}`}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ paddingTop: "20px" }}
                            formatter={(value) => <span className="text-slate-400 text-[10px] font-bold uppercase">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
