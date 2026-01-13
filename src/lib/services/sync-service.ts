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
    { id: "2887", name: "台新金", category: "民營" },
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
            const prevClose = meta.previousClose;
            const diff = currentPrice - prevClose;
            const change = (diff / prevClose) * 100;

            // 處理今日分時數據 (用於線圖)
            const timeline = timestamps.map((ts: number, i: number) => {
                const date = new Date(ts * 1000);
                return {
                    time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei' }).format(date),
                    value: quotes[i] || null
                };
            }).filter((item: any) => item.value !== null);

            // 計算 P/B 位階 (簡單演算法)
            let pbPercentile = (parseInt(stock.id) % 60) + 20; // 預設值
            try {
                // 這裡在正式環境會查詢資料庫歷史數據，目前先確保邏輯存在
                // const history = await prisma.dailyPrice.findMany({ where: { stockId: stock.id }, ... });
                // pbPercentile = calculatePercentile(history, currentPrice);
            } catch (e) { }

            cacheData.stocks[stock.id] = {
                id: stock.id,
                name: stock.name,
                price: currentPrice,
                diff: diff,
                change: change,
                isUp: diff >= 0,
                category: stock.category,
                pbPercentile: pbPercentile,
                pbValue: (currentPrice / 25).toFixed(2), // 假設 BV 為 25 (Mock)
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
 */
export async function getCachedStocks() {
    if (fs.existsSync(CACHE_PATH)) {
        try {
            const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
            return data.stocks ? Object.values(data.stocks) : [];
        } catch (e) {
            return [];
        }
    }
    // 若無快取，則進行一次同步
    const freshData = await performGlobalSync();
    return Object.values(freshData.stocks);
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
