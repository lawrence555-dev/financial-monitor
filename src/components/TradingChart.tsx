"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, Time, AreaSeries, AreaSeriesPartialOptions, LineWidth } from "lightweight-charts";
import { cn } from "@/lib/utils";

interface TradingChartProps {
    data: { time?: string; value: number }[];
    isUp: boolean;
    height?: number;
    enableGrid?: boolean;
    enableCrosshair?: boolean;
    enableTimeScale?: boolean;
    enablePriceScale?: boolean;
    lineWidth?: number;
}

export default function TradingChart({
    data,
    isUp,
    height = 300,
    enableGrid = true,
    enableCrosshair = true,
    enableTimeScale = true,
    enablePriceScale = true,
    lineWidth = 2
}: TradingChartProps) {
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
                attributionLogo: false, // Remove TV logo
            } as any,
            width: chartContainerRef.current.clientWidth,
            height: height,
            grid: {
                vertLines: { visible: enableGrid, color: "rgba(255, 255, 255, 0.05)" },
                horzLines: { visible: enableGrid, color: "rgba(255, 255, 255, 0.05)" },
            },
            timeScale: {
                visible: enableTimeScale,
                timeVisible: true,
                secondsVisible: false,
                borderColor: "rgba(255, 255, 255, 0.1)",
            },
            rightPriceScale: {
                visible: enablePriceScale,
                borderColor: "rgba(255, 255, 255, 0.1)",
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            crosshair: {
                vertLine: {
                    visible: enableCrosshair,
                    color: "#cbd5e1", // slate-300
                    width: 1,
                    style: 3,
                    labelBackgroundColor: "#1e293b",
                },
                horzLine: {
                    visible: enableCrosshair,
                    color: "#cbd5e1",
                    width: 1,
                    style: 3,
                    labelBackgroundColor: "#1e293b",
                },
            },
            handleScroll: {
                mouseWheel: enableTimeScale,
                pressedMouseMove: enableTimeScale,
                horzTouchDrag: enableTimeScale,
                vertTouchDrag: false,
            },
            handleScale: {
                axisPressedMouseMove: enableTimeScale,
                mouseWheel: enableTimeScale,
                pinch: enableTimeScale,
            },
        });

        // Add Area Series (v5 API)
        const newSeries = chart.addSeries(AreaSeries, {
            lineColor: lineColor,
            topColor: topColor,
            bottomColor: bottomColor,
            lineWidth: lineWidth as LineWidth,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
            crosshairMarkerVisible: enableCrosshair,
        });

        // Convert data to lightweight-charts format
        if (data.length > 0) {
            // Validate and sort data
            const validData = data.filter(d => d && typeof d.time === 'string');
            const sortedData = [...validData].sort((a, b) => new Date(`2000/01/01 ${a.time || "00:00"}`).getTime() - new Date(`2000/01/01 ${b.time || "00:00"}`).getTime());

            const today = new Date();
            const chartData = sortedData.map(d => {
                const timeStr = d.time || "09:00";
                const [h, m] = timeStr.split(':').map(Number);
                const date = new Date(today);
                date.setHours(h, m, 0, 0);

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
    }, [data, isUp, height, lineColor, topColor, bottomColor, enableGrid, enableCrosshair, enableTimeScale, enablePriceScale, lineWidth]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full relative"
            style={{ height: height }}
        />
    );
}
