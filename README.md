# MCU Notes · 車用與高精度類比 MCU 知識地圖

車用微控制器與高精度類比 PMIC 整合知識平台：以 **Infineon PSoC™ 4 HVPA-144K** 車用智慧電池感測晶片為實體基準架構，從核心微架構、高精度類比前端、車用電池管理系統（BMS）、高壓 BCD 半導體製程、車規測試校準到 ISO 26262 ASIL-C 功能安全，並附 8 款互動實驗室與規格設計器。

純靜態 HTML/CSS/JS 實現，無任何外部框架相依性，支援深淺色切換、中英文雙語、全站即時檢索（Ctrl+K），直接雙擊或啟動本機伺服器即可瀏覽。

---

## 頁面架構

| 檔案 | 內容重點 |
|---|---|
| `index.html` | 首頁：知識流程、核心架構卡片、三種方案對比表（通用 MCU vs 分離式 vs 高壓整合 MCU）、建議學習路線 |
| `core.html` | 01 · 核心微架構：Arm Cortex-M0+ 2 級管線、單週期 I/O、NVIC 中斷控制器、AHB-Lite 匯流排、8-ch DMA、Flash/SRAM SECDED ECC、低功耗模式 |
| `analog.html` | 02 · 高精度類比與電源：PACSS 類比子系統、雙 16-bit 差分 $\Delta\Sigma$ ADC、快速查表自動增益 AGC、Sinc³ 數位濾波（50/60Hz 陷波）、直連電瓶 42V 高壓 PMIC 穩壓器 |
| `application.html` | 03 · 車用 BMS 系統應用：智慧電池感測器（IBS）極柱安裝、庫倫積分法（Coulomb Counting）SoC 估算、冷啟動動態內阻 SoH 追蹤、LIN 2.2A 總線 |
| `process.html` | 04 · 半導體高壓製程：BCD（Bipolar-CMOS-DMOS）智慧功率製程、深溝槽隔離（DTI）、ISO 7637-2 Pulse 5b 拋負載 42V 箝位結構、高溫散熱封裝 |
| `test.html` | 05 · 測試校準與車規：晶圓探針 CP 與 FT、晶片內 eFuse / 雷射類比電阻修調（Trim）、全溫區溫漂校準、AEC-Q100 Grade 1 規範、側邊可潤濕側翼（Wettable Flank）QFN 封裝 AOI 光學驗收 |
| `safety.html` | 06 · 功能安全與可靠度：ISO 26262 ASIL-C 安全目標、五大安全機制（問答式窗口看門狗、記憶體 ECC、類比斷線自檢）、FMEDA 與定量指標（SPFM > 97%, LFM > 80%, FIT < 18） |
| `lab.html` | MCU 互動實驗室：8 款即時數學模擬器（分流器與 AGC、庫倫積分 SoC 漂移、42V 負載突降、問答窗口看門狗時序、Sinc³ 濾波器幅頻響應、SECDED ECC 錯誤注入、LIN 匯流排訊號傳輸、類比修調與良率提升） |
| `designer.html` | 規格設計器：BMS 分流電阻與前端選型、車載暗電流休眠壽命評估、韌體記憶體分區與安全開銷，支援一鍵複製 C 語言配置標頭檔與 Linker Script |
| `lessons.html` | 業界案例與排查手冊：實車現場五大重大事故（繼電器地彈、嚴寒冷啟動電壓塌陷、分流電阻塞貝克熱電效應、LIN 短路、看門狗溫漂）與排查決策矩陣 |
| `roles.html` | 職務地圖與求職指南：MCU 系統架構師、嵌入式韌體工程師、類比 IC 設計師、ISO 26262 功能安全專員、BMS 應用工程師、測試產品工程師的技能樹與面試真題 |
| `quiz.html` | 專業自我測驗：60 道嚴選實戰選擇題，即時答題解析與章節複習連結 |

---

## 資源目錄 (`assets/`)

- `style.css`：共用樣式表，支援現代工程排版、深色與淺色主題（可自動偵測系統偏好或手動切換）、卡片、表格與指標儀表板。
- `site.js`：頂部導覽列、章節目錄自動滾動監聽（Scrollspy）、全站搜尋對話框（<kbd>Ctrl+K</kbd>）、語言切換。
- `plot.js`：零相依輕量化 SVG 圖表繪製函式庫，自動配合 CSS 主題色變數。
- `lab.js`：8 款互動實驗室的數值運算與即時向量圖表繪製。
- `designer.js`：規格設計器的預設範本載入、即時工程公式推導與 C 程式碼生成。
- `quiz.js`：60 道中英文測驗題庫、即時評分與錯題分析。
- `search-index.js` / `search-index-en.js`：全站標題與內文快速搜尋索引。

---

## 雙語國際化 (`en/`)

所有繁體中文頁面在 `en/` 目錄下皆有對應的英文版本，頁面結構、錨點（`#anchor`）與檔名嚴格一一對應。點擊右上角 **EN / 中** 按鈕即可精準跳轉至同一頁面的相同章節段落。

---

## 更新搜尋索引

若修改或新增任何章節段落（`<h2 id>`、`<h3 id>`），請重新執行索引建置腳本：

```bash
python tools/build_index.py
```

---

## 本機預覽

直接以瀏覽器開啟 `index.html`，或啟動輕量靜態伺服器：

```bash
python -m http.server 8080
```

接著在瀏覽器造訪 `http://localhost:8080/` 即可。

---

## 部署至 GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit of MCU Notes"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

在 GitHub 專案的 **Settings → Pages**，Source 選擇 `Deploy from a branch`，Branch 選擇 `main` / `/ (root)`，幾分鐘後即可透過 `https://<your-username>.github.io/<your-repo>/` 公開存取。
