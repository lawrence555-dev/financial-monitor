# FHC-Elite 技術白皮書 (Technical Whitepaper)

## 1. 系統架構 (System Architecture)

FHC-Elite 採用現代化全棧架構，旨在提供極低延遲的金融數據可視化。

### 1.1 技術棧 (Tech Stack)
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4.
- **Animation**: Framer Motion (用於流體 UI 與跑馬燈)。
- **Charts**: Recharts (用於籌碼分佈與歷史走勢圖)。
- **Database**: PostgreSQL + Prisma ORM (用於儲存 5 年估值數據與用戶訂閱狀態)。
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
