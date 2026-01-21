import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

const CACHE_PATH = path.join(process.cwd(), "public/data/stock_cache.json");

import { FHC_STOCKS } from "@/lib/constants";

/**
 * 獲取台灣目前的日期 (YYYY-MM-DD 格式)
 */
function getTaiwanDate() {
    return new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date()).replace(/\//g, '-');
}

/**
 * 執行全域同步：更新資料庫並產生 JSON 快取
 */
export async function performGlobalSync() {
    console.log(`[Global-Sync] 開始於 ${new Date().toISOString()}`);
    const twDateStr = getTaiwanDate();
    const cacheData: any = {
        lastUpdated: new Date().toISOString(),
        twDate: twDateStr,
        stocks: {}
    };

    for (const stock of FHC_STOCKS) {
        try {
            const symbol = `${stock.id}.TW`;
            const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`);
            if (!res.ok) continue;

            const data = await res.json();
            const result = data.chart.result[0];
            const meta = result.meta;
            const timestamps = result.timestamp || [];
            const quotes = result.indicators.quote[0].close || [];

            const currentPrice = meta.regularMarketPrice;
            // 修正：收盤後 previousClose 可能為 null，改用 chartPreviousClose
            const prevClose = meta.previousClose || meta.chartPreviousClose || currentPrice;
            const diff = currentPrice - prevClose;
            const change = prevClose > 0 ? (diff / prevClose) * 100 : 0;

            // 處理今日分時數據 (僅顯示今日 09:00 以後的點位)
            const todayStr = getTaiwanDate();
            const timeline = timestamps.map((ts: number, i: number) => {
                const date = new Date(ts * 1000);
                const itemDateStr = new Intl.DateTimeFormat('zh-TW', {
                    timeZone: 'Asia/Taipei',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                }).format(date).replace(/\//g, '-');

                return {
                    dateStr: itemDateStr,
                    time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei' }).format(date),
                    value: quotes[i] || null
                };
            }).filter((item: any) => item.value !== null && item.dateStr === todayStr);

            let pbValue = 1.5;  // 預設值
            let pbPercentile = 50;  // 預設中位數

            const estimatedBookValue = stock.estimatedBookValue;
            if (estimatedBookValue && currentPrice > 0) {
                const realPB = currentPrice / estimatedBookValue;
                pbValue = Number(realPB.toFixed(2));

                // 簡化的位階計算：假設正常 P/B 範圍為 0.8 - 2.5
                // 低於 1.0 = 便宜（0-30%）
                // 1.0-1.5 = 合理（30-60%）  
                // 1.5-2.0 = 偏貴（60-85%）
                // 高於 2.0 = 昂貴（85-100%）
                if (realPB < 1.0) {
                    pbPercentile = Math.round(realPB * 30);
                } else if (realPB < 1.5) {
                    pbPercentile = Math.round(30 + (realPB - 1.0) * 60);
                } else if (realPB < 2.0) {
                    pbPercentile = Math.round(60 + (realPB - 1.5) * 50);
                } else {
                    pbPercentile = Math.min(100, Math.round(85 + (realPB - 2.0) * 15));
                }
                console.log(`[PB Estimated] ${stock.id} - Price: ${currentPrice}, BookValue: ${estimatedBookValue}, P/B: ${pbValue}, Percentile: ${pbPercentile}%`);
            } else {
                console.warn(`[PB Estimation] ${stock.id} - No estimated book value available`);
            }

            cacheData.stocks[stock.id] = {
                id: stock.id,
                name: stock.name,
                price: currentPrice,
                diff: diff,
                change: change,
                isUp: diff >= 0,
                category: stock.category,
                pbPercentile: pbPercentile,
                pbValue: pbValue,
                data: timeline
            };

            // 非同步寫入資料庫：將今日所有分時點位持久化
            if (timestamps.length > 0) {
                const upsertPromises = timestamps.map((ts: number, i: number) => {
                    const price = quotes[i];
                    if (price === null || price === undefined) return null;
                    return prisma.dailyPrice.upsert({
                        where: {
                            stockId_timestamp: {
                                stockId: stock.id,
                                timestamp: new Date(ts * 1000)
                            }
                        },
                        create: {
                            stockId: stock.id,
                            timestamp: new Date(ts * 1000),
                            price: price,
                            volume: BigInt(0)
                        },
                        update: { price: price }
                    });
                }).filter((p: any) => p !== null);

                Promise.all(upsertPromises).catch(err => {
                    console.error(`[Global-Sync] DB Batch Upsert Failed for ${stock.id}:`, err);
                });
            }

        } catch (error) {
            console.error(`[Global-Sync] 同步 ${stock.id} 失敗:`, error);
        }
    }

    // 寫入快取文件
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cacheData, null, 2));
    return cacheData;
}

/**
 * 從快取中獲取即時數據 (全站通用)
 * 策略：若為新的一天或數據嚴重過時 (>15分)，則等待同步；其餘情況採用 SWR (背景刷新)
 */
export async function getCachedStocks() {
    const currentDay = getTaiwanDate();

    // 如果快取存在
    if (fs.existsSync(CACHE_PATH)) {
        try {
            const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
            const lastUpdated = new Date(data.lastUpdated || 0);
            const now = new Date();
            const diffMs = now.getTime() - lastUpdated.getTime();
            const cacheDay = data.twDate;

            // 1. 嚴重過時：如果是新的一天，或者資料超過 15 分鐘沒更新，則強制等待同步 (防止用戶看到昨日舊資料)
            if (cacheDay !== currentDay || diffMs > 900000) {
                console.log(`[Cache] Data critically stale (${diffMs / 1000}s/Day:${cacheDay}), awaiting prioritized sync...`);
                const newData = await performGlobalSync();
                return {
                    lastUpdated: newData.lastUpdated,
                    stocks: newData.stocks ? Object.values(newData.stocks) : []
                };
            }

            // 2. 一般過時：資料超過 1 分鐘但小於 15 分鐘，採用 SWR (先給舊的，背景更新)
            if (diffMs > 60000) {
                console.log("[Cache] Stale cache, triggering background refresh...");
                performGlobalSync().catch(e => console.error("[Cache] Background refresh failed:", e));
            }

            return {
                lastUpdated: data.lastUpdated,
                stocks: data.stocks ? Object.values(data.stocks) : []
            };
        } catch (e) {
            console.error("[Cache] Read error:", e);
        }
    }

    // 如果快取不存在，同步創建
    console.log("[Cache] No cache found, creating...");
    const newData = await performGlobalSync();

    return {
        lastUpdated: newData.lastUpdated,
        stocks: newData.stocks ? Object.values(newData.stocks) : []
    };
}

/**
 * 獲取特定標的的分時數據 (從快取)
 */
export async function getIntradayPrices(stockId: string) {
    if (fs.existsSync(CACHE_PATH)) {
        try {
            const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
            const stock = data.stocks[stockId];
            return stock ? stock.data : [];
        } catch (e) { }
    }
    // 若快取無效，嘗試從資料庫讀取最近 24 小時的數據
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dbPrices = await prisma.dailyPrice.findMany({
            where: {
                stockId: stockId,
                timestamp: { gte: twentyFourHoursAgo }
            },
            orderBy: { timestamp: "asc" }
        });

        if (dbPrices.length > 0) {
            return dbPrices.map(p => ({
                time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei' }).format(p.timestamp),
                value: p.price
            }));
        }
    } catch (e) {
        console.error(`[Intraday] DB Read Failed for ${stockId}:`, e);
    }

    await performGlobalSync();
    return [];
}

/**
 * 此函數用於 Cron 呼叫，相容舊介面
 */
export async function syncIntradayData(stockId: string) {
    return performGlobalSync();
}

/**
 * 清理舊數據
 */
export async function cleanupOldIntradayData() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
        await prisma.dailyPrice.deleteMany({
            where: { timestamp: { lt: twentyFourHoursAgo } }
        });
    } catch (e) { }
}
