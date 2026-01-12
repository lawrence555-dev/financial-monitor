import { NextResponse } from "next/server";
import { getIntradayPrices } from "@/lib/services/sync-service";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get("id");

    if (!stockId) {
        return NextResponse.json({ error: "Missing stock ID" }, { status: 400 });
    }

    try {
        const prices = await getIntradayPrices(stockId);
        return NextResponse.json(prices);
    } catch (error: any) {
        console.error("Intraday API Error:", error);
        const errorDetails = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            error: "Failed to fetch intraday data",
            details: errorDetails
        }, { status: 500 });
    }
}
