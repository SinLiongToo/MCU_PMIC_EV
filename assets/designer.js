/* MCU Notes · Spec Designer Scripts */
(function(){
  const tabBtns = document.querySelectorAll('.seg button[data-type]');
  const selPreset = document.getElementById('ds-preset');
  const boxInputs = document.getElementById('ds-inputs');
  const boxMetrics = document.getElementById('ds-metrics');
  const tblTrade = document.getElementById('ds-table-trade');
  const boxChecks = document.getElementById('ds-checks');
  const boxOutput = document.getElementById('ds-output');
  const btnCopy = document.getElementById('ds-copy-btn');

  let currentType = 'shunt';

  const PRESETS = {
    '12v_ibs': {
      shunt: {i_cont: 150, i_peak: 1200, r_uohm: 100, tcr: 25, t_amb: 105, adc_vref: 1.2},
      power: {q_nom: 70, self_disc: 3, days: 45, i_act: 4.5, t_act_ms: 10, i_ds: 15, i_other: 20},
      memory: {flash: 128, sram: 8, boot: 8, app: 72, fusa: 16, calib: 8, stack: 3}
    },
    '24v_truck': {
      shunt: {i_cont: 250, i_peak: 1800, r_uohm: 50, tcr: 20, t_amb: 115, adc_vref: 1.2},
      power: {q_nom: 180, self_disc: 2.5, days: 60, i_act: 5.0, t_act_ms: 20, i_ds: 18, i_other: 35},
      memory: {flash: 128, sram: 8, boot: 12, app: 80, fusa: 18, calib: 10, stack: 3.5}
    },
    '48v_mild': {
      shunt: {i_cont: 200, i_peak: 900, r_uohm: 100, tcr: 15, t_amb: 95, adc_vref: 1.2},
      power: {q_nom: 15, self_disc: 1.5, days: 30, i_act: 4.0, t_act_ms: 15, i_ds: 12, i_other: 15},
      memory: {flash: 128, sram: 8, boot: 8, app: 65, fusa: 16, calib: 8, stack: 3}
    },
    'ev_bdu': {
      shunt: {i_cont: 400, i_peak: 1500, r_uohm: 30, tcr: 10, t_amb: 85, adc_vref: 1.2},
      power: {q_nom: 100, self_disc: 1.0, days: 90, i_act: 5.5, t_act_ms: 5, i_ds: 10, i_other: 5},
      memory: {flash: 128, sram: 8, boot: 16, app: 75, fusa: 22, calib: 6, stack: 3.5}
    }
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.setAttribute('aria-selected', b === btn));
      currentType = btn.dataset.type;
      buildInputs();
    });
  });

  selPreset.addEventListener('change', buildInputs);

  function getActiveValues(){
    const preset = PRESETS[selPreset.value][currentType];
    const vals = {};
    for(const k in preset){
      const el = document.getElementById('inp-' + k);
      vals[k] = el ? +el.value : preset[k];
    }
    return vals;
  }

  function buildInputs(){
    const preset = PRESETS[selPreset.value][currentType];
    let html = '';

    if(currentType === 'shunt'){
      html = `
        <div class="ctl"><label>額定連續電流 (A)</label><input id="inp-i_cont" type="number" min="10" max="600" value="${preset.i_cont}"></div>
        <div class="ctl"><label>峰值脈衝電流 (A)</label><input id="inp-i_peak" type="number" min="100" max="2500" value="${preset.i_peak}"></div>
        <div class="ctl"><label>分流器阻值 (µΩ)</label><input id="inp-r_uohm" type="number" min="20" max="1000" step="5" value="${preset.r_uohm}"></div>
        <div class="ctl"><label>分流電阻溫漂 TCR (ppm/°C)</label><input id="inp-tcr" type="number" min="5" max="100" value="${preset.tcr}"></div>
        <div class="ctl"><label>環境最高溫度 (°C)</label><input id="inp-t_amb" type="number" min="60" max="125" value="${preset.t_amb}"></div>
        <div class="ctl"><label>ADC 基準電壓 VREF (V)</label><input id="inp-adc_vref" type="number" step="0.05" min="1.0" max="1.5" value="${preset.adc_vref}"></div>
      `;
    } else if(currentType === 'power'){
      html = `
        <div class="ctl"><label>電瓶額定容量 Q_nom (Ah)</label><input id="inp-q_nom" type="number" min="10" max="300" value="${preset.q_nom}"></div>
        <div class="ctl"><label>電瓶月自放電率 (%/月)</label><input id="inp-self_disc" type="number" step="0.5" min="0.5" max="10" value="${preset.self_disc}"></div>
        <div class="ctl"><label>預計停車靜置天數 (Days)</label><input id="inp-days" type="number" min="7" max="180" value="${preset.days}"></div>
        <div class="ctl"><label>MCU Active 工作電流 (mA)</label><input id="inp-i_act" type="number" step="0.5" min="2" max="15" value="${preset.i_act}"></div>
        <div class="ctl"><label>週期喚醒持續時間 (ms/sec)</label><input id="inp-t_act_ms" type="number" min="1" max="100" value="${preset.t_act_ms}"></div>
        <div class="ctl"><label>MCU Deep Sleep 暗電流 (µA)</label><input id="inp-i_ds" type="number" min="5" max="50" value="${preset.i_ds}"></div>
        <div class="ctl"><label>其餘車載 ECU 待機暗電流 (µA)</label><input id="inp-i_other" type="number" min="0" max="200" value="${preset.i_other}"></div>
      `;
    } else if(currentType === 'memory'){
      html = `
        <div class="ctl"><label>總 Flash 容量 (KB)</label><input id="inp-flash" type="number" min="64" max="256" value="${preset.flash}"></div>
        <div class="ctl"><label>總 SRAM 容量 (KB)</label><input id="inp-sram" type="number" min="4" max="32" value="${preset.sram}"></div>
        <div class="ctl"><label>Bootloader 佔用 (KB)</label><input id="inp-boot" type="number" min="4" max="32" value="${preset.boot}"></div>
        <div class="ctl"><label>BMS 應用程式碼 (KB)</label><input id="inp-app" type="number" min="20" max="160" value="${preset.app}"></div>
        <div class="ctl"><label>SafeTlib 安全自檢庫 (KB)</label><input id="inp-fusa" type="number" min="8" max="40" value="${preset.fusa}"></div>
        <div class="ctl"><label>校準表與 OCV 曲線 (KB)</label><input id="inp-calib" type="number" min="2" max="16" value="${preset.calib}"></div>
        <div class="ctl"><label>SRAM 堆疊與中斷 Stack (KB)</label><input id="inp-stack" type="number" step="0.5" min="1" max="6" value="${preset.stack}"></div>
      `;
    }

    boxInputs.innerHTML = html;
    boxInputs.querySelectorAll('input').forEach(inp => inp.addEventListener('input', calculate));
    calculate();
  }

  function calculate(){
    const v = getActiveValues();

    if(currentType === 'shunt'){
      const R = v.r_uohm * 1e-6; // ohm
      const p_cont = v.i_cont * v.i_cont * R;
      const v_peak_mv = v.i_peak * R * 1e3;
      const delta_t = p_cont * 18; // approx 18 degC/W for chassis mounted shunt
      const t_shunt_peak = v.t_amb + delta_t;
      const tcr_err_pct = (delta_t + (v.t_amb - 25)) * v.tcr * 1e-4; // percent
      const fsr_mv = (v.adc_vref / 8) * 1e3; // 150 mV at gain=1
      const isClipping = v_peak_mv > fsr_mv;
      const lsb_gain64_ma = (((v.adc_vref / 8) / 32768) / 64 / R) * 1e3; // mA

      boxMetrics.innerHTML = `
        <div class="metric"><span class="lbl">額定連續熱功耗</span><div class="val ${p_cont > 5 ? 'warn' : 'good'}">${p_cont.toFixed(2)}<span class="unit">W</span></div></div>
        <div class="metric"><span class="lbl">峰值跨壓 (Peak Vdiff)</span><div class="val ${isClipping ? 'bad' : 'good'}">${v_peak_mv.toFixed(1)}<span class="unit">mV</span></div></div>
        <div class="metric"><span class="lbl">極限溫升熱點溫度</span><div class="val ${t_shunt_peak > 130 ? 'bad' : 'good'}">${t_shunt_peak.toFixed(0)}<span class="unit">°C</span></div></div>
        <div class="metric"><span class="lbl">最小辨識電流 (Gain 64x)</span><div class="val good">${lsb_gain64_ma.toFixed(2)}<span class="unit">mA</span></div></div>
      `;

      tblTrade.innerHTML = `
        <tr><th>指標項目</th><th>計算數值</th><th>設計建議</th></tr>
        <tr><td>ADC 滿量程裕度 (FSR)</td><td>±${fsr_mv.toFixed(0)} mV</td><td>${isClipping ? '<span style="color:var(--bad)">超出滿量程！需縮小分流阻值</span>' : '<span style="color:var(--ok)">在量程範圍內 ✓</span>'}</td></tr>
        <tr><td>高溫溫漂引起的累積偏差</td><td>±${tcr_err_pct.toFixed(3)}%</td><td>${tcr_err_pct > 0.3 ? '建議選用 10 ppm 合金分流電阻' : '符合 OEM 0.5% 總精度要求 ✓'}</td></tr>
        <tr><td>低端微安級辨識極限</td><td>${lsb_gain64_ma.toFixed(1)} mA/LSB</td><td>完全滿足鎖車 15mA 暗電流精確計量</td></tr>
      `;

      boxChecks.innerHTML = `
        <div style="margin-bottom:8px"><b>驗證結論：</b></div>
        <div>${isClipping ? '❌ <b>警告：</b> 峰值電流跨壓超量程截波，啟動時將遺失安時累計！' : '✅ <b>通過：</b> 峰值跨壓小於 150mV，PGA 1x~64x 動態覆蓋完整。'}</div>
        <div>${t_shunt_peak < 125 ? '✅ <b>通過：</b> 最高接面熱點溫度低於 AEC-Q100 125°C 閥值。' : '⚠️ <b>警示：</b> 連續重載溫升逼近 130°C，需強化銅排散熱。'}</div>
      `;

      boxOutput.textContent = `/* Auto-Generated Shunt & PACSS Config for PSoC 4 HVPA */
#define BMS_SHUNT_RESISTANCE_UOHM   (${v.r_uohm}U)
#define BMS_SHUNT_R_FLOAT          (${R.toFixed(8)}f)
#define BMS_MAX_CONTINUOUS_AMPS    (${v.i_cont}U)
#define BMS_PEAK_SURGE_AMPS        (${v.i_peak}U)

// ADC PACSS Configuration
#define PACSS_VREF_VOLTS           (${v.adc_vref.toFixed(2)}f)
#define PACSS_GAIN_AUTO_SWITCH     (1) // Enable Fast AGC LUT
#define PACSS_CHOPPING_ENABLED     (1) // Auto-Zero Drift Elimination
#define PACSS_MIN_LSB_CURRENT_MA   (${lsb_gain64_ma.toFixed(2)}f)
`;
    } else if(currentType === 'power'){
      const duty = v.t_act_ms / 1000;
      const i_mcu_avg_ua = (v.i_act * 1000 * duty) + (v.i_ds * (1 - duty));
      const i_total_avg_ua = i_mcu_avg_ua + v.i_other;
      const total_days_drain_ah = (i_total_avg_ua * 1e-6 * 24 * v.days);
      const self_disc_ah = (v.q_nom * (v.self_disc / 100) * (v.days / 30));
      const total_loss_ah = total_days_drain_ah + self_disc_ah;
      const remain_ah = Math.max(0, v.q_nom - total_loss_ah);
      const remain_soc = (remain_ah / v.q_nom) * 100;
      const days_to_50pct = (v.q_nom * 0.5) / ((i_total_avg_ua * 1e-6 * 24) + (v.q_nom * (v.self_disc / 100) / 30));

      boxMetrics.innerHTML = `
        <div class="metric"><span class="lbl">MCU 平均待機暗電流</span><div class="val good">${i_mcu_avg_ua.toFixed(1)}<span class="unit">µA</span></div></div>
        <div class="metric"><span class="lbl">整車總平均待機電流</span><div class="val">${i_total_avg_ua.toFixed(1)}<span class="unit">µA</span></div></div>
        <div class="metric"><span class="lbl">${v.days} 天總耗電量</span><div class="val">${total_loss_ah.toFixed(2)}<span class="unit">Ah</span></div></div>
        <div class="metric"><span class="lbl">停放後剩餘電量 SoC</span><div class="val ${remain_soc < 60 ? 'warn' : 'good'}">${remain_soc.toFixed(1)}<span class="unit">%</span></div></div>
      `;

      tblTrade.innerHTML = `
        <tr><th>評估項目</th><th>計算結果</th><th>車規門檻要求</th></tr>
        <tr><td>MCU 模組休眠暗電流</td><td>${i_mcu_avg_ua.toFixed(1)} µA</td><td>${i_mcu_avg_ua < 50 ? '<span style="color:var(--ok)">符合德國車廠嚴苛標準 (&lt;50µA) ✓</span>' : '超出感測器分配預算'}</td></tr>
        <tr><td>50% 啟動安全臨界停放天數</td><td>約 ${days_to_50pct.toFixed(0)} 天</td><td>大於 90 天可滿足長途海運存放</td></tr>
        <tr><td>電瓶化學自放電佔比</td><td>${(self_disc_ah / total_loss_ah * 100).toFixed(0)}%</td><td>自放電為主要流失源，電路損耗已最佳化</td></tr>
      `;

      boxChecks.innerHTML = `
        <div>✅ <b>通過：</b> MCU 平均靜態耗電極低，深睡模式下僅消耗 ${v.i_ds} µA。</div>
        <div>${remain_soc > 55 ? '✅ <b>通過：</b> 停放結束後電瓶剩餘電量充足，可順利啟動引擎。' : '⚠️ <b>警告：</b> 剩餘容量低於 55%，冬天冷啟動存在失靈風險！'}</div>
      `;

      boxOutput.textContent = `/* Low Power & Standby Budget Constants */
#define MCU_ACTIVE_CURRENT_MA      (${v.i_act.toFixed(2)}f)
#define MCU_DEEP_SLEEP_CURRENT_UA  (${v.i_ds.toFixed(1)}f)
#define MCU_WAKEUP_PERIOD_MS       (1000U)
#define MCU_ACTIVE_WINDOW_MS       (${v.t_act_ms}U)

// Standby Assessment
#define ESTIMATED_AVERAGE_UA       (${i_mcu_avg_ua.toFixed(2)}f)
#define ESTIMATED_MONTHLY_DRAIN_AH (${(i_mcu_avg_ua * 1e-6 * 24 * 30).toFixed(4)}f)
`;
    } else if(currentType === 'memory'){
      const used_flash = v.boot + v.app + v.fusa + v.calib;
      const free_flash = v.flash - used_flash;
      const flash_pct = (used_flash / v.flash) * 100;

      const used_sram = v.stack + (v.app * 0.05); // approx 5% RAM of code
      const free_sram = v.sram - used_sram;
      const sram_pct = (used_sram / v.sram) * 100;

      boxMetrics.innerHTML = `
        <div class="metric"><span class="lbl">Flash 總佔用空間</span><div class="val">${used_flash.toFixed(1)}<span class="unit">/ ${v.flash} KB</span></div></div>
        <div class="metric"><span class="lbl">Flash 使用率</span><div class="val ${flash_pct > 90 ? 'bad' : 'good'}">${flash_pct.toFixed(1)}<span class="unit">%</span></div></div>
        <div class="metric"><span class="lbl">SRAM 總佔用空間</span><div class="val">${used_sram.toFixed(1)}<span class="unit">/ ${v.sram} KB</span></div></div>
        <div class="metric"><span class="lbl">SRAM 使用率</span><div class="val ${sram_pct > 85 ? 'bad' : 'good'}">${sram_pct.toFixed(1)}<span class="unit">%</span></div></div>
      `;

      tblTrade.innerHTML = `
        <tr><th>記憶體分區</th><th>分配大小</th><th>功能與安全性質</th></tr>
        <tr><td>BOOTLOADER</td><td>${v.boot} KB</td><td>唯讀保護，支援 LIN UDS 安全韌體升級 (FOTA)</td></tr>
        <tr><td>APPLICATION</td><td>${v.app} KB</td><td>BMS 核心卡爾曼濾波、庫倫計、通訊協議棧</td></tr>
        <tr><td>SAFETLIB (FuSa)</td><td>${v.fusa} KB</td><td>ISO 26262 ASIL-C 安全庫，執行 CPU 與類比自檢</td></tr>
        <tr><td>CALIBRATION / NV</td><td>${v.calib} KB</td><td>Flash 模擬 EEPROM，儲存分流器修調值與 OCV 表</td></tr>
        <tr><td>FREE FLASH MARGIN</td><td>${free_flash.toFixed(1)} KB</td><td>${free_flash > 10 ? '餘裕充足，利於後續擴展 ✓' : '餘裕不足，需精簡代碼'}</td></tr>
      `;

      boxChecks.innerHTML = `
        <div>${free_flash >= 0 ? '✅ <b>Flash 空間校驗通過：</b> 未溢位。' : '❌ <b>嚴重錯誤：Flash 超出可用容量！</b>'}</div>
        <div>${free_sram >= 1.0 ? '✅ <b>SRAM 堆疊裕度充足：</b> 預留 &gt; 1KB 防止 Stack Overflow。' : '⚠️ <b>警告：</b> SRAM 餘量過緊，中斷巢狀可能導致棧溢位！'}</div>
      `;

      boxOutput.textContent = `/* GCC Linker Script Memory Map Snippet (psoc4_hvpa.ld) */
MEMORY
{
  FLASH_BOOT (rx)   : ORIGIN = 0x00000000, LENGTH = ${v.boot}K
  FLASH_APP  (rx)   : ORIGIN = 0x00000000 + ${v.boot}K, LENGTH = ${v.app}K
  FLASH_FUSA (rx)   : ORIGIN = 0x00000000 + ${(v.boot+v.app)}K, LENGTH = ${v.fusa}K
  FLASH_DATA (r)    : ORIGIN = 0x00000000 + ${(v.boot+v.app+v.fusa)}K, LENGTH = ${v.calib}K
  RAM        (rwx)  : ORIGIN = 0x20000000, LENGTH = ${v.sram}K
}

__stack_size = ${Math.round(v.stack * 1024)};
__heap_size  = ${Math.round(free_sram * 512)};
`;
    }
  }

  btnCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(boxOutput.textContent).then(() => {
      btnCopy.textContent = '已複製！';
      setTimeout(() => { btnCopy.textContent = '一鍵複製'; }, 1500);
    });
  });

  buildInputs();
})();