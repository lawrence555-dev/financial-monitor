export interface StockBase {
    id: string;
    name: string;
    category: "官股" | "民營";
    cashDividend: number;
    stockDividend: number;
    estimatedBookValue: number;
    minPb: number; // 5年最低 P/B
    maxPb: number; // 5年最高 P/B
}

export const FHC_STOCKS: StockBase[] = [
    { id: "2880", name: "華南金", category: "官股", cashDividend: 1.2, stockDividend: 0.1, estimatedBookValue: 15.8, minPb: 0.9, maxPb: 1.5 },
    { id: "2881", name: "富邦金", category: "民營", cashDividend: 2.5, stockDividend: 0.5, estimatedBookValue: 62.4, minPb: 0.8, maxPb: 1.8 },
    { id: "2882", name: "國泰金", category: "民營", cashDividend: 2.0, stockDividend: 0, estimatedBookValue: 45.2, minPb: 0.7, maxPb: 1.6 },
    { id: "2883", name: "凱基金", category: "民營", cashDividend: 0.5, stockDividend: 0, estimatedBookValue: 14.8, minPb: 0.8, maxPb: 1.4 },
    { id: "2884", name: "玉山金", category: "民營", cashDividend: 1.2, stockDividend: 0.3, estimatedBookValue: 16.2, minPb: 1.2, maxPb: 2.3 },
    { id: "2885", name: "元大金", category: "民營", cashDividend: 1.1, stockDividend: 0.2, estimatedBookValue: 24.5, minPb: 0.9, maxPb: 1.7 },
    { id: "2886", name: "兆豐金", category: "官股", cashDividend: 1.5, stockDividend: 0.3, estimatedBookValue: 26.8, minPb: 1.1, maxPb: 1.9 },
    { id: "2887", name: "台新新光金", category: "民營", cashDividend: 0.6, stockDividend: 0.4, estimatedBookValue: 17.2, minPb: 0.8, maxPb: 1.4 },
    { id: "2889", name: "國票金", category: "民營", cashDividend: 0.7, stockDividend: 0, estimatedBookValue: 12.4, minPb: 0.9, maxPb: 1.3 },
    { id: "2890", name: "永豐金", category: "民營", cashDividend: 0.75, stockDividend: 0.25, estimatedBookValue: 16.5, minPb: 0.9, maxPb: 1.6 },
    { id: "2891", name: "中信金", category: "民營", cashDividend: 1.8, stockDividend: 0, estimatedBookValue: 22.8, minPb: 1.0, maxPb: 1.8 },
    { id: "2892", name: "第一金", category: "官股", cashDividend: 0.85, stockDividend: 0.3, estimatedBookValue: 19.4, minPb: 1.0, maxPb: 1.6 },
    { id: "5880", name: "合庫金", category: "官股", cashDividend: 0.65, stockDividend: 0.35, estimatedBookValue: 18.2, minPb: 1.1, maxPb: 1.8 },
];
