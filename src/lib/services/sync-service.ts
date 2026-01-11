import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

export async function syncIntradayData(stockId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // Yahoo Finance Intraday API (5m interval for 1 day)
        // 使用 .TW 結尾以符合台灣市場代號
        const symbol = `${stockId}${stockId === '5880' ? '.TW' : '.TW'}`;
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`);
        const data = await res.json();

        if (!data.chart || !data.chart.result) {
            console.warn(`No data found for ${symbol}`);
            return;
        }

        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0].close;
        const volumes = result.indicators.quote[0].volume;

        if (timestamps && quotes) {
            const dataToInsert = timestamps.map((ts: number, i: number) => ({
                stockId,
                timestamp: new Date(ts * 1000),
                price: new Decimal(quotes[i] || 0),
                volume: BigInt(volumes[i] || 0)
            })).filter((item: any) => item.price.toNumber() > 0);

            console.log(`Syncing ${dataToInsert.length} points for ${stockId}...`);

            // 使用 Transaction 進行批次處理或逐條 Upsert
            // 由於 DailyPrice 加上了 @@unique([stockId, timestamp])，這裏可以使用 upsert
            await Promise.all(
                dataToInsert.map((item: any) =>
                    prisma.dailyPrice.upsert({
                        where: {
                            stockId_timestamp: {
                                stockId: item.stockId,
                                timestamp: item.timestamp
                            }
                        },
                        create: item,
                        update: {
                            price: item.price,
                            volume: item.volume
                        }
                    })
                )
            );

            return dataToInsert;
        }
    } catch (e) {
        console.error(`Failed to sync ${stockId}:`, e);
    }
}

export async function getIntradayPrices(stockId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 先嘗試從資料庫抓取今日數據
    let prices = await prisma.dailyPrice.findMany({
        where: {
            stockId,
            timestamp: { gte: today }
        },
        orderBy: { timestamp: "asc" }
    });

    // 如果數據不足（例如 10 點打開還沒存過），則觸發同步
    if (prices.length < 5) {
        await syncIntradayData(stockId);
        prices = await prisma.dailyPrice.findMany({
            where: {
                stockId,
                timestamp: { gte: today }
            },
            orderBy: { timestamp: "asc" }
        });
    }

    return prices.map(p => ({
        time: p.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        value: parseFloat(p.price.toString()),
        timestamp: p.timestamp
    }));
}
