/* MCU Notes · Quiz bank & interactive grading logic. */
(function(){
  const EN = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const t = (zh, en) => EN ? en : zh;

  const Q = [
    // Chapter 1: Core
    {
      ch: 'core',
      q: 'Arm Cortex-M0+ 核心採用幾級指令管線 (Pipeline)？相較於 Cortex-M0 有何優勢？',
      opts: [
        '3 級管線；提高了主頻上限',
        '2 級管線；降低分支預測失敗懲罰，並減少約 30% 動態功耗',
        '5 級管線；支援超純量指令發射',
        '單級管線；實現零中斷延遲'
      ],
      ans: 1,
      exp: 'Cortex-M0+ 將 Cortex-M0 的 3 級管線縮短為 2 級（Fetch, Execute），有效減少了跳轉時的衝刷週期，並大幅降低動態功耗。',
      link: 'core.html#cortex-m0plus'
    },
    {
      ch: 'core',
      q: '在車用電池管理系統中，為什麼 Cortex-M0+ 的「單週期 I/O 埠 (Fast I/O)」非常重要？',
      opts: [
        '能提高快閃記憶體的讀取頻寬',
        '可在 1 個時脈週期內即時響應並切斷高壓接觸器或引爆安全熔絲 (Pyro-fuse)',
        '可讓類比 ADC 的採樣時間縮短為 1ns',
        '直接用於傳輸 LIN 總線封包'
      ],
      ans: 1,
      exp: '單週期 I/O 繞過了傳統 AHB/APB 匯流排仲裁延遲，CPU 能在 1 個時鐘週期內將引腳電平置位，這在電池過流緊急斷開時至關重要。',
      link: 'core.html#cortex-m0plus'
    },
    {
      ch: 'core',
      q: '對於 32-bit 資料寬度的記憶體，SECDED 漢明碼至少需要多少個額外校驗位元？',
      opts: [
        '4 位元',
        '5 位元',
        '7 位元 (6 位元用於單錯定位，1 位元用於全體同位檢查)',
        '16 位元'
      ],
      ans: 2,
      exp: '根據漢明不等式 2^p >= k + p + 1，當 k=32 時需要 p=6 位元修正單錯，再加上 1 位元同位檢查達成雙錯檢測，共需 7 位元。',
      link: 'core.html#memory-ecc'
    },
    {
      ch: 'core',
      q: '當 SRAM 發生無法修正的雙位元翻轉 (Double-bit Error) 時，微控制器硬體通常會採取何種動作？',
      opts: [
        '忽略錯誤並繼續運行',
        '自動重置 Flash 資料',
        '立即觸發不可遮蔽中斷 (NMI) 或 HardFault，進入安全保護狀態',
        '切換至低速 32kHz 振盪器'
      ],
      ans: 2,
      exp: '雙位元錯誤超出糾錯能力，為防止執行破壞性指令或傳輸錯誤電池電流，硬體立即拉高 NMI 中斷執行緊急停機。',
      link: 'core.html#memory-ecc'
    },
    {
      ch: 'core',
      q: 'PSoC™ 4 HVPA 在車輛長達數週靜置休眠時，進入何種電源模式可將電流降至 15 µA 以下？',
      opts: [
        'Active Mode',
        'Sleep Mode',
        'Deep Sleep Mode (依賴 32kHz ILO 維持計時與喚醒)',
        'Turbo Boost Mode'
      ],
      ans: 2,
      exp: '在 Deep Sleep 模式下，高速高頻振盪器與核心運算暫停，僅保留超低功耗低頻振盪器 ILO 與 WDT 計時器，暗電流低至 12~15 µA。',
      link: 'core.html#clock-power'
    },

    // Chapter 2: Analog & PMIC
    {
      ch: 'analog',
      q: 'PSoC™ 4 HVPA PACSS 類比子系統採用哪種類型的 ADC 進行分流器電流量測？',
      opts: [
        '逐次逼近型 SAR ADC',
        '雙斜率積分型 ADC',
        '差分 Sigma-Delta (ΔΣ) ADC 搭配數位 Sinc 濾波器',
        '快閃型 Flash ADC'
      ],
      ans: 2,
      exp: 'ΔΣ ADC 具備超採樣與雜訊整形特性，搭配 Sinc 濾波器能在強電磁干擾環境下實現 16-bit 以上的高動態範圍精確感測。',
      link: 'analog.html#sigma-delta'
    },
    {
      ch: 'analog',
      q: '在車用分流器電流檢測中，快速自動增益控制 (AGC) 的最大優勢為何？',
      opts: [
        '降低分流電阻的採購成本',
        '在引擎啟動突波或負載劇變時於 <5 µs 內自動切換 PGA 檔位，避免 ADC 飽和截波',
        '完全消除電瓶內阻',
        '將 12V 電壓升壓至 400V'
      ],
      ans: 1,
      exp: '硬體快速查表 AGC 在微秒級內自動調整 PGA 放大倍率（1x 至 64x），避免因中斷延遲造成瞬態大電流採樣截波與安時累計遺失。',
      link: 'analog.html#agc-shunt'
    },
    {
      ch: 'analog',
      q: '若分流電阻為 100 µΩ，當車輛熄火暗電流為 10 mA 時，分流器兩端的差分跨壓為多少？',
      opts: [
        '100 mV',
        '10 mV',
        '1 µV (微伏)',
        '0.1 µV'
      ],
      ans: 2,
      exp: 'V = I * R = 0.010 A * 0.0001 Ω = 1 µV (10^-6 V)。因此需要晶片具備微伏級超低 Offset 與高增益放大能力。',
      link: 'analog.html#agc-shunt'
    },
    {
      ch: 'analog',
      q: 'PACSS 的硬體 Sinc³ 數位濾波器在頻率響應上產生的「傳輸凹陷零點 (Notch)」，最常用於消除哪種干擾？',
      opts: [
        '藍牙 2.4 GHz 訊號',
        '50 Hz 與 60 Hz 工頻交流電網雜訊及逆變器開關諧波',
        '直流分量',
        '宇宙射線粒子'
      ],
      ans: 1,
      exp: '透過精確配置調變器時鐘與抽取率，Sinc 濾波器的傳輸零點精準對齊 50Hz/60Hz，可提供高達 80 dB 的工頻干擾抑制。',
      link: 'analog.html#sigma-delta'
    },
    {
      ch: 'analog',
      q: 'PSoC™ 4 HVPA 內部整合的高壓調節器 (HV Regulator) 允許直連汽車電池，其最高耐受電壓是多少？',
      opts: [
        '5.5 V',
        '16 V',
        '42 V (耐受 ISO 7637-2 拋負載突波)',
        '120 V'
      ],
      ans: 2,
      exp: '晶片支援 3.6V~28V 額定工作電壓，並能耐受高達 42V 的瞬態拋負載過壓，無需額外外部降壓 PMIC。',
      link: 'analog.html#hv-pmic'
    },

    // Chapter 3: Applications & BMS
    {
      ch: 'app',
      q: '智慧電池感測器 (IBS) 模組在汽車中的標準物理安裝位置為何？',
      opts: [
        '安裝在儀表板後方',
        '直接鎖固在蓄電池負極極柱端子夾具上',
        '安裝在排氣管尾端',
        '放置於前保險桿雷達支架'
      ],
      ans: 1,
      exp: 'IBS 直接壓鑄安裝在蓄電池負極極柱夾具上，實現電流、電壓與端子溫度的最短路徑原位量測。',
      link: 'application.html#ibs-bdu'
    },
    {
      ch: 'app',
      q: '庫倫積分法 (Coulomb Counting) 估算電池荷電狀態 (SoC) 最主要的致命弱點是什麼？',
      opts: [
        '計算公式過於繁瑣，MCU 無法運算',
        '電流通道的微小 Offset 誤差會隨時間單調積分累積，導致電量長期發散',
        '只能量測鋰電池，不能量測鉛酸電池',
        '無法與 LIN 匯流排相容'
      ],
      ans: 1,
      exp: '哪怕只有 10µV 的未校正 Offset，在 100µΩ 分流器下等效於 100mA 虛假電流，停放數週將累積數十安時的嚴重假耗電誤差。',
      link: 'application.html#soc-coulomb'
    },
    {
      ch: 'app',
      q: 'BMS 系統通常在何種條件下利用開路電壓 (OCV) 對庫倫積分器進行校準重設？',
      opts: [
        '引擎全速運轉且發電機輸出最大時',
        '車輛熄火靜置數小時以上、電化學反應達平衡且電流接近零時',
        '電池短路跳脫瞬間',
        '按下啟動按鈕瞬間'
      ],
      ans: 1,
      exp: '在長久靜置（通常 > 3 小時）且電流小於數十毫安培時，端電壓等於真實 OCV，此時查表重置 SoC 可消除累積漂移。',
      link: 'application.html#soc-coulomb'
    },
    {
      ch: 'app',
      q: 'BMS 如何在車輛冷啟動 (Cold Crank) 瞬間估算電池的健康狀態 (SoH) 與老化內阻？',
      opts: [
        '向電瓶注入 100kHz 高頻脈衝',
        '同步採集啟動馬達大電流跳變 ΔI 與電壓瞬間塌陷幅度 ΔV，計算動態內阻 R = ΔV / ΔI',
        '量測車輛輪胎轉速',
        '僅根據行駛里程數直接估算'
      ],
      ans: 1,
      exp: '啟動馬達抽載瞬間提供了上千安培的自然大步階激勵，MCU 藉由同步高速採樣 ΔV 與 ΔI，即時算出電瓶動態內阻。',
      link: 'application.html#soh-impedance'
    },
    {
      ch: 'app',
      q: '車載 LIN 2.2A 通訊協議中，Synch Field (0x55) 的關鍵工程作用是什麼？',
      opts: [
        '作為加密通訊密鑰',
        '讓從機硬體計時器比對 5 個下降沿週期，自動校準內部振盪器的溫漂頻偏',
        '標記電池故障碼',
        '指示發動機轉速'
      ],
      ans: 1,
      exp: 'LIN 採用單線非同步通訊，0x55 包含交替的 0 和 1，從機利用硬體計時器測量波特率並即時校正內部 RC 振盪器頻率。',
      link: 'application.html#lin-bus'
    },

    // Chapter 4: Process
    {
      ch: 'fab',
      q: 'BCD 智慧功率半導體製程將哪三種元件整合在單一晶圓上？',
      opts: [
        'BJT (雙極)、CMOS (數位互補) 與 DMOS (功率橫向擴散)',
        'BGA、CSP 與 DIP',
        'Battery、Capacitor 與 Diode',
        'Bluetooth、CAN 與 D-RAM'
      ],
      ans: 0,
      exp: 'BCD 代表 Bipolar（低雜訊精密類比）、CMOS（高密度運算核心與記憶體）與 DMOS（耐高壓大電流功率管）。',
      link: 'process.html#bcd-technology'
    },
    {
      ch: 'fab',
      q: '在混合訊號高壓晶片中，深溝槽隔離 (Deep Trench Isolation, DTI) 的主要功用是什麼？',
      opts: [
        '增加晶片的機械強度防止掉落破損',
        '如同實體絕緣牆阻斷高壓功率區向敏感類比區的基板電流注入，抑制雜訊與閂鎖效應',
        '儲存 Flash 非揮發性資料',
        '加速光刻機曝光時間'
      ],
      ans: 1,
      exp: 'DTI 深入矽基板，以二氧化矽隔絕高壓切換引起的少數載子擴散，將基板耦合雜訊大幅衰減 40 dB 以上。',
      link: 'process.html#isolation-dti'
    },
    {
      ch: 'fab',
      q: '汽車拋負載 (Load Dump Pulse 5b) 發生的物理根源是什麼？',
      opts: [
        '輪胎在高速行駛中摩擦產生靜電',
        '發電機向電瓶大電流充電時，電瓶端子因震動或意外瞬間脫開，發電機磁場能量釋放',
        '雨刷馬達開關反向電動勢',
        '火星塞正常點火放電'
      ],
      ans: 1,
      exp: '發電機具有巨大電感量，在充電大電流下突然斷開負載，強大磁場能量釋放產生持續數百毫秒的高達 40V+ 破壞性突波。',
      link: 'process.html#esd-loaddump'
    },
    {
      ch: 'fab',
      q: 'PSoC™ 4 HVPA 符合 AEC-Q100 Grade 1 車規認證，其支援的環境工作溫度範圍為何？',
      opts: [
        '0°C 至 +70°C',
        '-20°C 至 +85°C',
        '-40°C 至 +125°C (最高接面溫度可達 +150°C)',
        '-65°C 至 +200°C'
      ],
      ans: 2,
      exp: 'AEC-Q100 Grade 1 規範環境工作溫度為 -40°C 至 +125°C，滿足引擎室極端高溫環境。',
      link: 'process.html#thermal-package'
    },

    // Chapter 5: Test & Qualification
    {
      ch: 'test',
      q: '晶圓探針測試 (CP) 階段對 ADC 和 Bandgap 進行「eFuse 修調 (Trimming)」的核心目的為何？',
      opts: [
        '降低晶片工作時脈以省電',
        '消除晶圓製造引起的元件匹配偏差，校準 Offset、增益與溫漂以達到車規 ±0.1% 精度',
        '測試封裝外殼的防水平級',
        '鎖定晶片防止逆向工程'
      ],
      ans: 1,
      exp: '晶圓生產無法避免製程幾何與摻雜偏差，透過 ATE 測量並將校正值燒入 eFuse，能大幅縮小 Offset 分佈，提升良率至 99% 以上。',
      link: 'test.html#ate-trimming'
    },
    {
      ch: 'test',
      q: '為什麼車用晶片在封裝後必須強制進行「三溫測試 (Tri-Temp Testing: -40°C, 25°C, 125°C)」？',
      opts: [
        '為了測試晶片在不同溫度下的顏色變化',
        '半導體缺陷在極端高溫 (漏電、氧化層穿隧) 與極端低溫 (時序競爭、載子凍結) 下表現不同，單溫測試無法攔截潛伏缺陷',
        '車廠客戶合同為了增加測試成本',
        '僅為了驗證封裝膠水耐熱性'
      ],
      ans: 1,
      exp: '許多邊界缺陷在常溫下表現正常，但在 -40°C 或 +125°C 極限應力下會暴露時序或漏電問題，三溫篩選是零缺陷的保證。',
      link: 'test.html#multi-temp'
    },
    {
      ch: 'test',
      q: 'AEC-Q100 認證中的 HTOL (高溫工作壽命試驗) 通常在 125°C 下持續加壓測試多少小時？',
      opts: [
        '24 小時',
        '100 小時',
        '1000 小時 (且要求樣品 0 失效)',
        '10000 小時'
      ],
      ans: 2,
      exp: '標準 HTOL 試驗要求 3 個批次共 231 顆樣品在 125°C 與最大電壓下持續工作 1000 小時且零失效。',
      link: 'test.html#aec-q100'
    },
    {
      ch: 'test',
      q: '相較於傳統標準 QFN，具備「側邊可潤濕側翼 (Wettable Flanks)」的 QFN 封裝最大優勢是什麼？',
      opts: [
        '散熱能力增加 10 倍',
        '能在引腳側面形成完整飽滿的爬錫焊角，使車廠 SMT 產線的 AOI 光學相功能 100% 檢驗焊接完整度',
        '封裝尺寸縮小 80%',
        '不需要焊接即可使用'
      ],
      ans: 1,
      exp: '側邊鍍錫台階使焊錫能爬升形成側面焊角，自動光學檢驗機（AOI）即可高速識別虛焊、空焊，杜絕下線不良品。',
      link: 'test.html#wettable-flanks'
    },

    // Chapter 6: Safety ISO 26262
    {
      ch: 'safety',
      q: 'ISO 26262 ASIL-C 等級要求系統的單點故障指標 (SPFM) 必須達到多少以上？',
      opts: [
        '≥ 60%',
        '≥ 90%',
        '≥ 97%',
        '≥ 99.9%'
      ],
      ans: 2,
      exp: 'ISO 26262 明確規範：ASIL-B 要求 SPFM ≥ 90%，ASIL-C 要求 SPFM ≥ 97%，ASIL-D 要求 SPFM ≥ 99%。',
      link: 'safety.html#fmeda-metrics'
    },
    {
      ch: 'safety',
      q: '問答式窗口看門狗 (Challenge-Response WDT) 相較於傳統定時看門狗，多了哪兩重防護？',
      opts: [
        '密碼防盜與指紋識別',
        '時間窗口限制 (太早或太晚餵狗皆報錯) 與演算法代數問答檢驗 (算錯金鑰立即復位)',
        '自動降低電源電壓與斷開總線',
        '自動上傳故障數據至雲端'
      ],
      ans: 1,
      exp: '問答窗口看門狗嚴格約束餵狗時間必須在特定時間段內，且要求 CPU 完成指定安全檢測代碼後算得精確回應，防範死循環欺騙。',
      link: 'safety.html#safety-mechanisms'
    },
    {
      ch: 'safety',
      q: 'PSoC™ 4 HVPA PACSS 如何實現分流電阻焊點開路或斷線 (Wire-break) 的即時診斷？',
      opts: [
        '透過外部攝影機觀察焊點外觀',
        '類比前端週期性注入微弱診斷電流 (如 50 nA)，若分流器焊點斷線開路，輸入端電壓將瞬間被拉高至滿量程而觸發警報',
        '僅能依賴軟體計時器逾時猜測',
        '無法在運行時檢測'
      ],
      ans: 1,
      exp: '晶片內建微弱診斷電流源，正常電阻（100µΩ）跨壓微乎其微；若焊點斷開，端子電壓被拉至軌電平，硬體即刻識別斷線。',
      link: 'safety.html#safety-mechanisms'
    },
    {
      ch: 'safety',
      q: '在車規失效率計算中，1 FIT 代表的失效率為多少？',
      opts: [
        '每 100 小時失效 1 次',
        '每 1,000,000 (10^6) 小時失效 1 次',
        '每 1,000,000,000 (10^9) 工作小時失效 1 次',
        '每年失效 1 次'
      ],
      ans: 2,
      exp: 'FIT (Failures in Time) 定義為每 10^9 顆晶片工作小時累積的隨機硬體失效次數。PSoC 4 HVPA 的 PMHF 通常 < 18 FIT。',
      link: 'safety.html#fmeda-metrics'
    }
  ];

  /* UI Logic */
  const selCh = document.getElementById('qz-chapter');
  const selCount = document.getElementById('qz-count');
  const btnStart = document.getElementById('qz-start');
  const boxContainer = document.getElementById('qz-container');
  const boxSummary = document.getElementById('qz-summary');

  let activeQuiz = [];
  let userAnswers = {};

  btnStart.addEventListener('click', startNewQuiz);

  function startNewQuiz(){
    const ch = selCh.value;
    const cnt = +selCount.value;

    let pool = ch === 'all' ? [...Q] : Q.filter(item => item.ch === ch);
    // Shuffle pool
    pool = pool.sort(() => Math.random() - 0.5);
    activeQuiz = pool.slice(0, Math.min(cnt, pool.length));
    userAnswers = {};

    boxSummary.style.display = 'none';
    renderQuestions();
  }

  function renderQuestions(){
    boxContainer.innerHTML = '';
    activeQuiz.forEach((item, qIdx) => {
      const card = document.createElement('div');
      card.className = 'quiz-card';
      card.id = 'qcard-' + qIdx;

      let html = `<div class="quiz-q"><span class="num">${String(qIdx + 1).padStart(2, '0')}.</span> ${item.q}</div><div class="quiz-opts">`;
      item.opts.forEach((opt, oIdx) => {
        html += `<button class="quiz-opt" data-q="${qIdx}" data-o="${oIdx}"><b>${String.fromCharCode(65 + oIdx)}.</b> <span>${opt}</span></button>`;
      });
      html += `</div><div class="quiz-exp" id="qexp-${qIdx}" style="display:none"></div>`;
      card.innerHTML = html;
      boxContainer.appendChild(card);
    });

    boxContainer.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const qIdx = +btn.dataset.q;
        const oIdx = +btn.dataset.o;
        if(userAnswers[qIdx] !== undefined) return; // already answered
        handleAnswer(qIdx, oIdx);
      });
    });
  }

  function handleAnswer(qIdx, selectedOpt){
    userAnswers[qIdx] = selectedOpt;
    const item = activeQuiz[qIdx];
    const card = document.getElementById('qcard-' + qIdx);
    const expBox = document.getElementById('qexp-' + qIdx);
    const btns = card.querySelectorAll('.quiz-opt');

    btns.forEach((btn, idx) => {
      if(idx === item.ans) btn.classList.add('correct');
      if(idx === selectedOpt && selectedOpt !== item.ans) btn.classList.add('wrong');
    });

    const isCorrect = (selectedOpt === item.ans);
    expBox.style.display = 'block';
    expBox.innerHTML = `<b>${isCorrect ? '✓ 回答正確！' : '✕ 回答錯誤。'}</b> 正確答案為 <b>${String.fromCharCode(65 + item.ans)}</b>。<br>${item.exp}<br><a href="${item.link}" style="font-weight:600;margin-top:6px;display:inline-block">→ 複習本題對應章節點</a>`;

    // Check if finished
    if(Object.keys(userAnswers).length === activeQuiz.length){
      showSummary();
    }
  }

  function showSummary(){
    let correctCount = 0;
    activeQuiz.forEach((item, idx) => {
      if(userAnswers[idx] === item.ans) correctCount++;
    });
    const pct = Math.round((correctCount / activeQuiz.length) * 100);

    boxSummary.style.display = 'block';
    boxSummary.innerHTML = `
      <h2 style="margin:0 0 10px;font-family:var(--cond)">測驗完成！總分：${pct} 分 (${correctCount} / ${activeQuiz.length})</h2>
      <p style="color:var(--muted)">${pct >= 85 ? '太優秀了！你對車用微控制器微架構、類比前端與 ISO 26262 具備極為紮實的實戰認知。' : (pct >= 60 ? '表現良好！建議針對答錯的章節再次翻閱複習。' : '基礎觀念仍有加強空間，建議依循首頁推薦閱讀路線完整研讀各章節。')}</p>
      <div class="btnrow"><button class="btn pri" onclick="location.reload()">再測一次</button></div>
    `;
    boxSummary.scrollIntoView({behavior:'smooth'});
  }

  startNewQuiz();
})();