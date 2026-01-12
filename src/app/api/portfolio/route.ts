import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        console.log("Prisma keys:", Object.keys(prisma));
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId") || "default-user";

        const holdings = await prisma.portfolioHolding.findMany({
            where: { userId },
            include: {
                stock: true
            }
        });

        return NextResponse.json(holdings);
    } catch (error) {
        console.error("Portfolio GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { stockId, avgCost, quantity, userId = "default-user" } = body;

        if (!stockId || avgCost === undefined || quantity === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Upsert holding for this stock and user using compound unique key
        const holding = await prisma.portfolioHolding.upsert({
            where: {
                userId_stockId: {
                    userId,
                    stockId
                }
            },
            update: {
                avgCost: parseFloat(avgCost),
                quantity: parseInt(quantity),
            },
            create: {
                userId,
                stockId,
                avgCost: parseFloat(avgCost),
                quantity: parseInt(quantity),
            }
        });

        return NextResponse.json(holding);
    } catch (error) {
        console.error("Portfolio POST Error:", error);
        return NextResponse.json({ error: "Failed to save holding" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        await prisma.portfolioHolding.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Portfolio DELETE Error:", error);
        return NextResponse.json({ error: "Failed to delete holding" }, { status: 500 });
    }
}
