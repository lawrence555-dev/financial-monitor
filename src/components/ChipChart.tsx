"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface ChipChartProps {
    data: {
        date: string;
        institutional: number;
        government: number;
    }[];
}

export default function ChipChart({ data }: ChipChartProps) {
    return (
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} stackOffset="sign" margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        hide
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        labelStyle={{ fontSize: '10px', fontWeight: 'black', color: '#94a3b8', marginBottom: '4px' }}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                    <Bar
                        dataKey="institutional"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[2, 2, 0, 0]}
                        name="三大法人"
                    />
                    <Bar
                        dataKey="government"
                        stackId="a"
                        fill="#8b5cf6"
                        radius={[2, 2, 0, 0]}
                        name="官股行庫"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
