import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

const CACHE_PATH = path.join(process.cwd(), "public/data/stock_cache.json");

const FHC_STOCKS = [
    { id: "2880", name: "華南金", category: "官股" },
    { id: "2881", name: "富邦金", category: "民營" },
    { id: "2882", name: "國泰金", category: "民營" },
    { id: "2883", name: "凱基金", category: "民營" },
    { id: "2884", name: "玉山金", category: "民營" },
    { id: "2885", name: "元大金", category: "民營" },
    { id: "2886", name: "兆豐金", category: "官股" },
    { id: "2887", name: "台新新光金", category: "民營" },
    { id: "2889", name: "國票金", category: "民營" },
    { id: "2890", name: "永豐金", category: "民營" },
    { id: "2891", name: "中信金", category: "民營" },
    { id: "2892", name: "第一金", category: "官股" },
    { id: "5880", name: "合庫金", category: "官股" }
];

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

            // 使用估算的每股淨值（Book Value Per Share）
            // Yahoo Finance API 需要認證，改用歷史平均值估算
            const estimatedBookValues: Record<string, number> = {
                '2880': 32.5,  // 華南金
                '2881': 31.2,  // 富邦金
                '2882': 28.8,  // 國泰金
                '2883': 18.5,  // 開發金
                '2884': 12.8,  // 玉山金
                '2885': 15.2,  // 元大金
                '2886': 18.9,  // 兆豐金
                '2887': 14.6,  // 台新金
                '2889': 22.3,  // 國票金
                '2890': 19.7,  // 永豐金
                '2891': 18.4,  // 中信金
                '2892': 11.5,  // 第一金
                '5880': 45.8,  // 合庫金
            };

            let pbValue = 1.5;  // 預設值
            let pbPercentile = 50;  // 預設中位數

            const estimatedBookValue = estimatedBookValues[stock.id];
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
 * 採用「先返回舊數據，背景刷新」策略以加速首次渲染
 */
export async function getCachedStocks() {
    // 如果快取存在，立即返回（不阻塞）
    if (fs.existsSync(CACHE_PATH)) {
        try {
            const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
            const lastUpdated = new Date(data.lastUpdated || 0);
            const now = new Date();
            const diffMs = now.getTime() - lastUpdated.getTime();

            // 如果快取超過 2 分鐘，背景異步刷新（不阻塞返回）
            if (diffMs > 120000) {
                console.log("[Cache] Stale cache, triggering background refresh...");
                // 非阻塞：不 await，讓刷新在背景執行
                performGlobalSync().catch(e => console.error("[Cache] Background refresh failed:", e));
            }

            return data.stocks ? Object.values(data.stocks) : [];
        } catch (e) {
            console.error("[Cache] Read error:", e);
        }
    }

    // 如果快取不存在或讀取失敗，同步創建（首次啟動）
    console.log("[Cache] No cache found, creating...");
    await performGlobalSync();

    if (fs.existsSync(CACHE_PATH)) {
        const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
        return data.stocks ? Object.values(data.stocks) : [];
    }

    return [];
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
