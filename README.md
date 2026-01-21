# FHC-Elite - 全方位金融監控管理系統

---

## 目錄 (Table of Contents)
- [專案簡介](#專案簡介)
- [技術規格與文檔](#技術規格與文檔-technical-documentation)
- [產品與開發指引](#產品與開發指引)
- [核心特色](#核心特色)
- [安裝與啟動](#安裝與啟動)
- [授權條款](#授權條款)

---

## 專案簡介
**FHC-Elite** 是一款專為台灣金控股投資者打造的高階監控平台。我們整合了 **Next.js 15** 的卓越效能與 **Gemini 1.5 Pro** 的 AI 洞察，提供包含「股價淨值比位階 (P/B Percentile)」、「籌碼異動追蹤」及「自動化價值警報」在內的一站式解決方案。

---

## 技術規格與文檔 (Technical Documentation)

為了確保開發與維運的透明度，請參閱以下詳細文檔：

- [系統架構與設計白皮書](docs/ARCHITECTURE.md)：包含技術棧、目錄結構與核心估值邏輯。
- [完整需求清單](docs/REQUIREMENTS.md)：定義了平台所有的功能性與非功能性需求。
- [測試與審計報告 (PASS)](docs/TEST_REPORT.md)：詳細記錄了最終驗證樣例與狀態。

## 📘 產品與開發指引
- 📖 **[產品使用指南](docs/PRODUCT_GUIDE.md)**：終端用戶如何操作各項監控功能。
- 📊 **[數據來源說明](docs/DATA_SOURCES.md)**：詳細列出股價、財報、籌碼及 AI 文本的獲取來源。
- 📜 **[開發日誌 (MVP v0.1)](docs/CHANGELOG.md)**：記錄專案從零到一各個版本的演進歷程。# 金控全能價值導航 (FHC-Elite)

專業的金控股權投資分析與稅務規劃工具。

## 核心功能
- **背景數據同步**：每 5 分鐘自動同步 Yahoo Finance 與 TWSE 數據。
- **時區修正系統**：精確處理 `Asia/Taipei` 時區，收盤後線圖依然完整呈現。
- **數據中樞 (JSON 快取)**：極速響應的首頁報價與分時行情。
- **專業稅務計算機**：
    - 支持全台 13 檔金控。
    - 內建二代健保 (2.11%) 與所得稅抵減 (8.5%) 演算法。
    - **精確配股邏輯**：嚴格區分現金股利與配股（以面額 $10 計入稅基）。
- **雲端分析中心 (Investment Simulator)**：
    - 永久儲存投資情境至 PostgreSQL。
    - **多方案視覺比對**：直觀比較稅務效率、稅後實領金額。

## 技術棧
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Data Source**: Yahoo Finance API, TWSE Open Data

---

## 安裝與啟動
1. **複製專案**
   ```bash
   git clone https://github.com/lawrence555-dev/fhc-elite.git
   cd fhc-elite
   ```
2. **安裝依賴**
   ```bash
   npm install
   ```
3. **環境變數配置**
   在 `.env` 中加入：
   ```
   GEMINI_API_KEY=your_key
   LINE_NOTIFY_TOKEN=your_token
   DATABASE_URL=your_postgresql_url
   ```
4. **開發環境啟動**
   ```bash
   npm run dev
   ```

---

## 授權條款
本專案採用 MIT 授權。© 2026 FHC-Elite Team.
