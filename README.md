# FHC-Elite - 全方位金融監控管理系統 📈

---

## 📖 目錄 (Table of Contents)
- [🚀 專案簡介](#-專案簡介)
- [🛠 技術規格與文檔](#-技術規格與文檔-technical-documentation)
- [✨ 核心特色](#-核心特色)
- [📦 安裝與啟動](#-安裝與啟動)
- [🛡 授權條款](#-授權條款)

---

## 🚀 專案簡介
**FHC-Elite** 是一款專為台灣金控股投資者打造的高階監控平台。我們整合了 **Next.js 15** 的卓越效能與 **Gemini 1.5 Pro** 的 AI 洞察，提供包含「股價淨值比位階 (P/B Percentile)」、「籌碼異動追蹤」及「自動化價值警報」在內的一站式解決方案。

---

## 🛠 技術規格與文檔 (Technical Documentation)

為了確保開發與維運的透明度，請參閱以下詳細文檔：

- 🏛 **[系統架構與設計白皮書](docs/ARCHITECTURE.md)**：包含技術棧、目錄結構與核心估值邏輯。
- 📋 **[完整需求清單](docs/REQUIREMENTS.md)**：定義了平台所有的功能性與非功能性需求。
- ✅ **[測試與審計報告 (PASS)](docs/TEST_REPORT.md)**：詳細記錄了 2026-01-10 的最終驗證樣例與狀態。

---

## ✨ 核心特色
1. **13 金控全景視圖**：預設監控台灣 13 家核心金控（包含最新台新新光金合併實體）。
2. **台灣市場標準色彩**：全站紅漲綠跌，符合在地投資習慣。
3. **AI 法說會摘要**：Gemini 1.5 Pro 自動總結財報亮點，省去閱讀數百頁簡報的時間。
4. **極致 UI/UX**：Glassmorphism 玻璃擬態風格，搭載自定義 Toast 通知系統。

---

## 📦 安裝與啟動
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

## 🛡 授權條款
本專案採用 MIT 授權。© 2026 FHC-Elite Team.
