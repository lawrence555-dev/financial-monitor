import { NextResponse } from "next/server";
import { getCachedStocks } from "@/lib/services/sync-service";

export async function GET() {
    try {
        const stockData = await getCachedStocks();
        return NextResponse.json(stockData.stocks || []);
    } catch (error) {
        console.error("Realtime Price API Error:", error);
        return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
    }
}
