"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, Time, AreaSeriesPartialOptions } from "lightweight-charts";
import { cn } from "@/lib/utils";

interface TradingChartProps {
    data: { time: string; value: number }[];
    isUp: boolean;
    height?: number;
}

export default function TradingChart({ data, isUp, height = 300 }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    // Color definitions based on ui-ux-pro-max financial standards
    const upColor = "#ef4444"; // Rise
    const downColor = "#22c55e"; // Fall (Taiwan market standards: Green is down)
    const lineColor = isUp ? upColor : downColor;
    const topColor = isUp ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)";
    const bottomColor = isUp ? "rgba(239, 68, 68, 0.0)" : "rgba(34, 197, 94, 0.0)";

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#94a3b8", // slate-400
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            grid: {
                vertLines: { color: "rgba(255, 255, 255, 0.05)" },
                horzLines: { color: "rgba(255, 255, 255, 0.05)" },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: "rgba(255, 255, 255, 0.1)",
            },
            rightPriceScale: {
                borderColor: "rgba(255, 255, 255, 0.1)",
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            crosshair: {
                vertLine: {
                    color: "#cbd5e1", // slate-300
                    width: 1,
                    style: 3,
                    labelBackgroundColor: "#1e293b",
                },
                horzLine: {
                    color: "#cbd5e1",
                    width: 1,
                    style: 3,
                    labelBackgroundColor: "#1e293b",
                },
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: false,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        });

        // Add Area Series
        const newSeries = (chart as any).addAreaSeries({
            lineColor: lineColor,
            topColor: topColor,
            bottomColor: bottomColor,
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        });

        // Convert data to lightweight-charts format
        // Note: Lightweight Charts expects sorted data without duplicates
        // For intraday, we typically use timestamps (seconds) as 'time'
        if (data.length > 0) {
            // Ensure data is sorted by time
            const sortedData = [...data].sort((a, b) => new Date(`2000/01/01 ${a.time}`).getTime() - new Date(`2000/01/01 ${b.time}`).getTime());

            // Map to LWC format
            // Since we use 5m intraday strings like "09:05", we might need to use a custom time mapping or full timestamps.
            // For simplicity in this demo, we'll try to use local timestamps if available, or just map carefully.
            // Recharts uses simple strings. Lightweight charts prefers Unix timestamps for time scale.

            // Let's assume we can map the "time" ("HH:MM") to today's timestamp for proper scaling
            const today = new Date();
            const chartData = sortedData.map(d => {
                const [h, m] = d.time.split(':').map(Number);
                const date = new Date(today);
                date.setHours(h, m, 0, 0);

                // Adjust for timezone if needed, but for visual we just need relative order usually.
                // However, LWC needs increasing Time.
                return {
                    time: (date.getTime() / 1000) as Time,
                    value: d.value
                };
            }).filter((item, index, self) =>
                // Filter distinct times to prevent LWC errors
                index === self.findIndex((t) => t.time === item.time)
            ).sort((a, b) => (a.time as number) - (b.time as number));

            newSeries.setData(chartData);
            chart.timeScale().fitContent();
        }

        chartRef.current = chart;

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, [data, isUp, height, lineColor, topColor, bottomColor]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full relative"
            style={{ height: height }}
        />
    );
}
