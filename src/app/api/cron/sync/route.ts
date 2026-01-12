import { NextResponse } from "next/server";
import { syncIntradayData, cleanupOldIntradayData } from "@/lib/services/sync-service";

const FHC_IDS = ["2880", "2881", "2882", "2883", "2884", "2885", "2886", "2887", "2889", "2890", "2891", "2892", "5880"];

export async function GET(request: Request) {
    try {
        console.log("CRON: Starting data sync and cleanup...");

        // 1. Cleanup old data
        await cleanupOldIntradayData();

        // 2. Sync history for all 13 stocks
        const results = await Promise.all(
            FHC_IDS.map(id => syncIntradayData(id))
        );

        return NextResponse.json({
            success: true,
            stocksSynced: FHC_IDS.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("CRON Error:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
