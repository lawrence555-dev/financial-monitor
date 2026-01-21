# FHC-Elite 技術白皮書 (Technical Whitepaper)

## 目錄
- [1. 系統架構 (System Architecture)](#1-系統架構-system-architecture)
  - [1.1 技術棧 (Tech Stack)](#11-技術棧-tech-stack)
  - [1.2 目錄結構 (Project Structure)](#12-目錄結構-project-structure)
- [2. 系統設計 (System Design)](#2-系統設計-system-design)
  - [2.1 估值演算法 (Valuation Logic)](#21-估值演算法-valuation-logic)
  - [2.2 籌碼分析模型 (Chip Analysis)](#22-籌碼分析模型-chip-analysis)
  - [2.3 AI 語義引擎 (AI Semantic Engine)](#23-ai-語義引擎-ai-semantic-engine)

## 1. 系統架構 (System Architecture)

FHC-Elite 採用現代化全棧架構，旨在提供極低延遲的金融數據可視化。

### 1.1 技術棧 (Tech Stack)
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4.
- **Animation**: Framer Motion
## 數據架構 (Hybrid Data Model)

本系統採用的混合式數據架構，兼顧效能與精確度：

### 1. JSON 快取層 (`public/data/stock_cache.json`)
- **用途**：提供毫秒級的 UI 渲染（首頁卡片、分時圖表、獲取即時價格）。
- **更新機制**：背景 Cron 任務每 5 分鐘執行。
- **內容**：包含 13 檔標的的即時價、漲跌幅、今日分時點位及初步 P/B。

### 2. 資料庫層 (PostgreSQL)
- **用途**：
    - 存儲 5 年期的 DailyPrice 數據（用於精確 P/B 分位數計算）。
    - 存儲用戶個性化數據：`PortfolioHolding` (持股成本)、`TaxScenario` (稅務試算情境)。
    - **Source of Truth**：所有歷史分析的終極數據源。

### 3. 時區處理
- 全面採用 `Intl.DateTimeFormat` 與 `Asia/Taipei` 時區標籤，確保伺服器（通常為 UTC）在判斷開盤、收盤及生成快取時不會產生日期偏移。
- **AI Engine**: Google Gemini 1.5 Pro (用於法說會新聞摘要與情緒分析)。
- **Notifications**: Line Notify API (實時價值警報)。

### 1.2 目錄結構 (Project Structure)
```
src/
├── app/              # Next.js App Router 頁面路由
│   ├── ai-lab/       # AI 研究室
│   ├── api/          # 實時價格與 AI 摘要 API
│   ├── tax/          # 稅務計算機
│   ├── valuation/    # 估值熱力圖
│   └── watchlist/    # 自選損益追蹤
├── components/       # 可複用 UI 組件 (FhcCard, Toast, TickerTape)
├── lib/              # 核心服務 (Gemini, Notifications, Utils)
└── prisma/           # 資料庫 Schema 與 Seeding 腳本
```

## 2. 系統設計 (System Design)

### 2.1 估值演算法 (Valuation Logic)
系統採用 **P/B Percentile (股價淨值比分位數)** 作為核心指標，計算其在過去 5 年（約 1250 個交易日）中的相對位置。
- **< 15%**: 極度低估 (顯示為綠色及呼吸燈效果)
- **> 85%**: 極度高估 (顯示為紅色警示)

### 2.2 籌碼分析模型 (Chip Analysis)
整合「三大法人」與「八大公股行庫」的進出數據，揭示大戶資金動向，輔助零售投資者避開 FOMO 陷阱。

### 2.3 AI 語義引擎 (AI Semantic Engine)
利用 Gemini 1.5 Pro 的原生 API，在每次選定股票時實時抓取摘要，消除散戶與大戶間的資訊不對稱。
