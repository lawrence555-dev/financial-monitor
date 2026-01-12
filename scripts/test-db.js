const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking database models...");
        const count = await prisma.portfolioHolding.count();
        console.log(`Successfully connected. PortfolioHolding count: ${count}`);

        // Try to create a dummy record
        console.log("Adding a test record...");
        const testRecord = await prisma.portfolioHolding.upsert({
            where: {
                userId_stockId: {
                    userId: "test-user",
                    stockId: "2881"
                }
            },
            update: {},
            create: {
                userId: "test-user",
                stockId: "2881",
                avgCost: 80,
                quantity: 1000
            }
        });
        console.log("Test record created/checked:", testRecord);
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
