async function verifyAllFhcData() {
    console.log("=== FHC Data Accuracy Verification ===");
    try {
        const res = await fetch("http://localhost:3000/api/stock-prices/realtime");
        const data = await res.json();

        if (Array.isArray(data)) {
            console.table(data.map(s => ({
                "代號": s.id,
                "名稱": s.name,
                "最後成交價": s.price,
                "漲跌": s.change,
                "成交量": s.volume
            })));
        } else {
            console.error("Failed to fetch data:", data);
        }
    } catch (e) {
        console.error("Error connecting to local server. Make sure 'npm run dev' is running.");
    }
}

verifyAllFhcData();
