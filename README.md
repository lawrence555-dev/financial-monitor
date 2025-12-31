# 金融監控儀表板 (Financial Monitor) 📈

這是一個基於 **React + Vite** 開發的即時金融監控應用程式，旨在提供直觀、即時的股市與新聞資訊整合體驗。

## ✨ 核心功能

- **即時股價追蹤**：整合真實市場數據，提供流暢的股價即時報價顯示。
- **Google 新聞整合**：動態串接 Google 新聞，提供最相關且即時的財經議題。
- **互動式趨勢圖表**：使用 Recharts 打造流暢的股價歷史趨勢圖，支援多種技術指標視覺化。
- **強弱勢股分析**：自動計算並排序市場中的強勢與弱勢個股。
- **深色模式優化**：專為金融交易設計的深色介面，提升視覺舒適度與專業質感。

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 本機開發啟動
```bash
npm run dev
```

### 3. 專案建置 (Production)
```bash
npm run build
```

## 🛠️ 技術棧

- **前端框架**: React 18
- **建置工具**: Vite
- **CSS 框架**: Tailwind CSS
- **圖表庫**: Recharts
- **圖示**: Lucide React
- **資料處理**: Axios

## 📂 專案結構

- `src/features`: 核心邏輯元件 (新聞、圖表、清單)
- `src/services`: 資料抓取與處理邏輯 (Stock API, News API)
- `src/components`: 通用 UI 組件
- `src/services/priceHistoryStore.js`: 歷史價格數據管理

---

由 **Antigravity Pro** 驅動開發 🚀
