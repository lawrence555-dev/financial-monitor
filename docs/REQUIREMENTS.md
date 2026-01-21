# FHC-Elite 需求文件 (Requirements Document)

## 目錄
- [1. 核心目標 (Core Objectives)](#1-核心目標-core-objectives)
- [2. 功能需求 (Functional Requirements)](#2-功能需求-functional-requirements)
  - [2.1 基礎數據 (Market Data)](#21-基礎數據-market-data)
  - [2.2 估值與分析 (Valuation & Analysis)](#22-估值與分析-valuation--analysis)
  - [2.3 稅務與追蹤 (Tax & Watchlist)](#23-稅務與追蹤-tax--watchlist)
- [3. UI/UX 需求 (Design Requirements)](#3-uiux-需求-design-requirements)

## 1. 核心目標 (Core Objectives)
建立一個專注於「台灣 13 家金控公司」的深度監控平台，解決傳統看盤軟體資訊過於分散、缺乏橫向對比、以及估值標準不一的問題。

## 2. 功能需求 (Functional Requirements)

## 2.1 基礎數據 (Market Data)
- **[REQ-01]** 實時同步 TWSE 正式收盤與盤中數據。
- **[REQ-02]** 支援跑馬燈 (Ticker Tape) 全天候循環顯示 13 金控動態。
- **[REQ-03]** 顯示「漲跌塊數」與「漲跌幅 %」雙重維度。

## 2.2 估值與分析 (Valuation & Analysis)
- **[REQ-04]** 估值熱力圖：即時呈現 13 金控的歷史位階。
- **[REQ-05]** 籌碼追蹤：顯示外資、投信與公股行庫的進出對比。
- **[REQ-06]** AI 法說會摘要：利用 AI 自動總結財報亮點。

## 2.3 稅務與追蹤 (Tax & Watchlist)
- **[REQ-07]** 二代健保與股息稅額自動計算（含 $10 面額課稅邏輯）。
- **[REQ-08]** 自選股損益即時試算。

## 3. UI/UX 需求 (Design Requirements)
- **[REQ-09]** 符合台灣股市色彩慣例（紅漲、綠跌）。
- **[REQ-10]** 全站 Glassmorphism (玻璃擬態) 與 Elite Amber 精品品牌風格。
- **[REQ-11]** 響應式佈局，完美適配超寬螢幕與移動設備。
