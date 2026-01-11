import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Official TWSE After-hour Daily Last Prices (Stable public endpoint)
        // Correcting URL from oapi to openapi
        const response = await fetch("https://openapi.twse.com.tw/v1/stock/afterhour_daily_last", {
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            console.warn("TWSE API returned non-OK status, might be weekend.");
            return NextResponse.json([]); // Return empty array during non-trading times
        }

        const data = await response.json();
        if (!Array.isArray(data)) return NextResponse.json([]);

        // FHC Stock IDs we care about
        const fhcIds = ["2880", "2881", "2882", "2883", "2884", "2885", "2886", "2887", "2889", "2890", "2891", "2892", "5880"];

        const filtered = data
            .filter((s: any) => fhcIds.includes(s.Code))
            .map((s: any) => ({
                id: s.Code,
                name: s.Name,
                price: parseFloat(s.ClosePrice),
                change: parseFloat(s.Change) || 0,
                volume: parseInt(s.TradeVolume),
                timestamp: new Date().toISOString()
            }));

        return NextResponse.json(filtered);
    } catch (error) {
        console.error("Stock Price API Error:", error);
        // Fallback to empty array instead of 500 to prevent frontend crash
        return NextResponse.json([]);
    }
}
