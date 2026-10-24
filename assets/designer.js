/* MCU Notes · Spec designer (bilingual).
   Defaults follow the PSoC 4 HVPA-144K datasheet (002-28660 Rev. *K); everything else is an editable assumption. */
(function(){
  const EN = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const t = (zh, en) => EN ? en : zh;
  const $ = s => document.querySelector(s);
  const tabBtns = document.querySelectorAll('.seg button[data-type]');
  const selPreset = $('#ds-preset'), boxInputs = $('#ds-inputs'), boxMetrics = $('#ds-metrics');
  const tblTrade = $('#ds-table-trade'), boxChecks = $('#ds-checks'), boxOutput = $('#ds-output'), btnCopy = $('#ds-copy-btn');
  let currentType = 'shunt';

  const ADC_FS = 1.2, AGC_MIN_G = 4, AGC_MAX_G = 512;   // V, gain range used by the datasheet AGC example

  const PRESETS = {
    '12v_ibs': {name: t('12 V 啟停鉛酸 IBS', '12 V start-stop lead-acid IBS'),
      shunt: {i_cont: 150, i_peak: 1200, r_uohm: 100, tcr: 20, rth: 18, t_amb: 105},
      power: {q_nom: 70, self_disc: 3, days: 30, i_ds: 35, i_wake: 8, t_wake: 5, p_wake: 1, i_other: 20},
      memory: {flash: 128, dflash: 8, sram: 8, boot: 8, app: 72, fusa: 16, calib: 6, stack: 2, data: 3}},
    '24v_truck': {name: t('24 V 商用車 IBS', '24 V commercial-vehicle IBS'),
      shunt: {i_cont: 250, i_peak: 1800, r_uohm: 50, tcr: 20, rth: 12, t_amb: 105},
      power: {q_nom: 180, self_disc: 2.5, days: 60, i_ds: 35, i_wake: 8, t_wake: 10, p_wake: 1, i_other: 35},
      memory: {flash: 128, dflash: 8, sram: 8, boot: 12, app: 80, fusa: 18, calib: 8, stack: 2.5, data: 3.5}},
    '12v_ss_hi': {name: t('12 V 高電流（大排量／商用）', '12 V high-current (large engine)'),
      shunt: {i_cont: 300, i_peak: 2500, r_uohm: 50, tcr: 10, rth: 10, t_amb: 105},
      power: {q_nom: 95, self_disc: 3, days: 45, i_ds: 35, i_wake: 8, t_wake: 5, p_wake: 2, i_other: 30},
      memory: {flash: 128, dflash: 8, sram: 8, boot: 8, app: 76, fusa: 16, calib: 6, stack: 2, data: 3}}
  };

  const FIELDS = {
    shunt: [
      ['i_cont', t('連續電流 (A)', 'Continuous current (A)'), 10, 600, 1],
      ['i_peak', t('峰值電流（啟動）(A)', 'Peak current, cranking (A)'), 100, 3000, 10],
      ['r_uohm', t('分流電阻 (µΩ)', 'Shunt resistance (µΩ)'), 20, 500, 5],
      ['tcr', t('電阻溫度係數 TCR (ppm/°C)', 'Shunt TCR (ppm/°C)'), 5, 100, 1],
      ['rth', t('分流器熱阻 (°C/W)', 'Shunt thermal resistance (°C/W)'), 2, 60, 1],
      ['t_amb', t('最高環境溫度 (°C)', 'Max ambient (°C)'), 60, 125, 1]],
    power: [
      ['q_nom', t('電瓶容量 (Ah)', 'Battery capacity (Ah)'), 10, 300, 1],
      ['self_disc', t('自放電 (%/月)', 'Self-discharge (%/month)'), 0.5, 10, 0.5],
      ['days', t('停放天數', 'Parking days'), 7, 180, 1],
      ['i_ds', t('IBS Deep Sleep 電流 (µA)', 'IBS Deep Sleep current (µA)'), 10, 200, 1],
      ['i_wake', t('喚醒時平均電流 (mA)', 'Average current while awake (mA)'), 1, 20, 0.5],
      ['t_wake', t('每次喚醒時間 (ms)', 'Awake time per wake-up (ms)'), 1, 100, 1],
      ['p_wake', t('喚醒週期 (s)', 'Wake-up period (s)'), 0.1, 60, 0.1],
      ['i_other', t('其他 ECU 暗電流 (mA)', 'Other ECUs quiescent (mA)'), 0, 100, 1]],
    memory: [
      ['flash', t('Code Flash (KB)', 'Code flash (KB)'), 64, 128, 1],
      ['dflash', t('Data Flash (KB)', 'Data flash (KB)'), 0, 8, 1],
      ['sram', t('SRAM (KB)', 'SRAM (KB)'), 4, 8, 1],
      ['boot', t('Bootloader (KB)', 'Bootloader (KB)'), 0, 32, 1],
      ['app', t('應用程式 (KB)', 'Application (KB)'), 16, 120, 1],
      ['fusa', t('安全函式庫 (KB)', 'Safety library (KB)'), 0, 40, 1],
      ['calib', t('校準表／OCV 表 (KB)', 'Calibration / OCV tables (KB)'), 1, 16, 1],
      ['stack', t('堆疊 Stack (KB)', 'Stack (KB)'), 0.5, 4, 0.25],
      ['data', t('.data + .bss (KB)', '.data + .bss (KB)'), 0.5, 7, 0.25]]
  };

  selPreset.innerHTML = Object.entries(PRESETS).map(([k, p]) => `<option value="${k}">${p.name}</option>`).join('');

  tabBtns.forEach(btn => btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.setAttribute('aria-selected', b === btn));
    currentType = btn.dataset.type;
    buildInputs();
  }));
  selPreset.addEventListener('change', buildInputs);

  function buildInputs(){
    const preset = PRESETS[selPreset.value][currentType];
    boxInputs.innerHTML = FIELDS[currentType].map(([k, label, min, max, step]) =>
      `<div class="ctl"><label for="inp-${k}">${label}</label><input id="inp-${k}" type="number" min="${min}" max="${max}" step="${step}" value="${preset[k]}"></div>`).join('');
    boxInputs.querySelectorAll('input').forEach(inp => inp.addEventListener('input', calculate));
    calculate();
  }
  function values(){
    const v = {};
    FIELDS[currentType].forEach(([k]) => { const el = $('#inp-' + k); v[k] = el && el.value !== '' ? +el.value : PRESETS[selPreset.value][currentType][k]; });
    return v;
  }
  const metric = (lbl, val, unit, cls) => `<div class="metric"><span class="lbl">${lbl}</span><div class="val ${cls || ''}">${val}<span class="unit">${unit || ''}</span></div></div>`;
  const row = cells => '<tr>' + cells.map(c => '<td>' + c + '</td>').join('') + '</tr>';
  const head = cells => '<tr>' + cells.map(c => '<th>' + c + '</th>').join('') + '</tr>';
  const ok = s => `<div>✅ ${s}</div>`, warn = s => `<div>⚠️ ${s}</div>`, bad = s => `<div>❌ ${s}</div>`;

  function calculate(){
    const v = values();
    if(currentType === 'shunt'){
      const R = v.r_uohm * 1e-6;
      const p = v.i_cont * v.i_cont * R;
      const vpk = v.i_peak * R;
      const fsMax = ADC_FS / AGC_MIN_G;                       // 300 mV at G = 4
      const tShunt = v.t_amb + p * v.rth;
      const tcrErr = (tShunt - 25) * v.tcr * 1e-4;           // %
      const lsb = ADC_FS / AGC_MAX_G / 32768 / R;            // A per normalised LSB
      const iFsMin = ADC_FS / AGC_MAX_G / R;                 // full scale at the highest gain
      const clip = vpk > 0.9 * fsMax;
      boxMetrics.innerHTML =
        metric(t('連續功耗', 'Continuous dissipation'), p.toFixed(2), 'W', p > 5 ? 'warn' : 'good') +
        metric(t('峰值跨壓', 'Peak shunt voltage'), (vpk * 1e3).toFixed(1), 'mV', clip ? 'bad' : 'good') +
        metric(t('分流器熱點', 'Shunt hotspot'), tShunt.toFixed(0), '°C', tShunt > 150 ? 'bad' : 'good') +
        metric(t('1 LSB（正規化）', '1 LSB (normalised)'), (lsb * 1e3).toFixed(3), 'mA');
      tblTrade.innerHTML = head([t('項目', 'Item'), t('數值', 'Value'), t('說明', 'Note')]) +
        row([t('AGC 最大輸入（G = 4）', 'AGC max input (G = 4)'), '±' + (fsMax * 1e3).toFixed(0) + ' mV = ±' + (fsMax / R).toFixed(0) + ' A', clip ? `<span style="color:var(--bad)">${t('峰值超過 90% 量程，降低 R 或改用 G = 1/2 固定增益', 'Peak above 90% of range: lower R or use fixed G = 1/2')}</span>` : `<span style="color:var(--ok)">${t('峰值在量程內 ✓', 'Peak within range ✓')}</span>`]) +
        row([t('最高增益量程（G = 512）', 'Range at max gain (G = 512)'), '±' + (iFsMin).toFixed(2) + ' A', t('小電流（暗電流）以最高增益量測', 'Small currents measured at the highest gain')]) +
        row([t('TCR 造成的增益誤差', 'Gain error from TCR'), '±' + tcrErr.toFixed(3) + ' %', tcrErr > 0.5 ? t('建議低 TCR 合金或溫度補償', 'Use a low-TCR alloy or temperature compensation') : t('可接受，仍建議溫度補償', 'Acceptable; temperature compensation still recommended')]);
      boxChecks.innerHTML =
        (clip ? bad(t('峰值電流會使 AGC 最低增益飽和。', 'Peak current saturates the lowest AGC gain.')) : ok(t('峰值電流在 AGC 量程內。', 'Peak current stays within the AGC range.'))) +
        (tShunt > 150 ? bad(t('分流器熱點過高，需加強散熱或降低 R。', 'Shunt hotspot too high: improve heat sinking or lower R.')) : ok(t('分流器熱點溫度可接受。', 'Shunt hotspot temperature is acceptable.'))) +
        (v.t_amb > 125 ? bad(t('環境溫度超過 AEC-Q100 Grade 1（125 °C）。', 'Ambient exceeds AEC-Q100 Grade 1 (125 °C).')) : ok(t('環境溫度在 Grade 1 範圍（−40 ~ 125 °C）。', 'Ambient within Grade 1 (−40 to 125 °C).'))) +
        `<p class="note">${t('LSB 依資料手冊：scaler 將結果正規化為最高增益（512）時的權重；100 µΩ 時為 0.715 mA。', 'LSB per datasheet: the scaler normalises results to the weight at the highest gain (512); 0.715 mA at 100 µΩ.')}</p>`;
      boxOutput.textContent =
`/* Shunt front-end constants (generated by MCU Notes). Verify against your PDL/TRM before use. */
#define SHUNT_RESISTANCE_UOHM      (${v.r_uohm}u)
#define SHUNT_I_CONT_A             (${v.i_cont}u)
#define SHUNT_I_PEAK_A             (${v.i_peak}u)
#define ADC_FULL_SCALE_V           (1.2f)
#define AGC_GAIN_MIN               (${AGC_MIN_G}u)
#define AGC_GAIN_MAX               (${AGC_MAX_G}u)
#define CURRENT_LSB_UA             (${(lsb * 1e6).toFixed(1)}f)   /* normalised LSB */
#define SHUNT_TCR_PPM_PER_C        (${v.tcr}u)
`;
    } else if(currentType === 'power'){
      const duty = Math.min(1, v.t_wake / 1000 / v.p_wake);
      const iIbs = v.i_ds * (1 - duty) + v.i_wake * 1000 * duty;   // µA
      const iTot = iIbs / 1000 + v.i_other;                          // mA
      const drainAh = iTot / 1000 * 24 * v.days;
      const selfAh = v.q_nom * v.self_disc / 100 * v.days / 30;
      const remain = Math.max(0, 100 * (1 - (drainAh + selfAh) / v.q_nom));
      const perDay = iTot / 1000 * 24 + v.q_nom * v.self_disc / 100 / 30;
      const to50 = v.q_nom * 0.5 / perDay;
      boxMetrics.innerHTML =
        metric(t('IBS 平均電流', 'IBS average current'), iIbs.toFixed(0), 'µA', iIbs > 200 ? 'warn' : 'good') +
        metric(t('整車暗電流', 'Vehicle quiescent'), iTot.toFixed(2), 'mA') +
        metric(t(`${v.days} 天後 SoC`, `SoC after ${v.days} d`), remain.toFixed(1), '%', remain < 60 ? 'warn' : 'good') +
        metric(t('到 50% SoC', 'Days to 50% SoC'), to50.toFixed(0), t('天', 'd'), to50 < 30 ? 'warn' : 'good');
      tblTrade.innerHTML = head([t('項目', 'Item'), t('數值', 'Value'), t('說明', 'Note')]) +
        row([t('喚醒佔空比', 'Wake duty cycle'), (duty * 100).toFixed(2) + ' %', t('喚醒期間電流主導 IBS 平均值', 'Wake-up current dominates the IBS average')]) +
        row([t('IBS 佔整車暗電流', 'IBS share of quiescent'), (iIbs / 1000 / iTot * 100).toFixed(1) + ' %', t('多數停放耗電來自其他 ECU 與自放電', 'Most parked drain comes from other ECUs and self-discharge')]) +
        row([t('自放電佔總損失', 'Self-discharge share'), (selfAh / (drainAh + selfAh) * 100).toFixed(0) + ' %', t('鉛酸電池溫度越高自放電越大', 'Lead-acid self-discharge rises with temperature')]);
      boxChecks.innerHTML =
        (v.i_ds < 35 ? warn(t('Deep Sleep 低於資料手冊典型值 35 µA，請確認量測條件。', 'Deep Sleep below the 35 µA datasheet typical — check the assumption.')) : ok(t('Deep Sleep 電流不低於資料手冊典型值。', 'Deep Sleep current is not below the datasheet typical.'))) +
        (remain < 50 ? bad(t('停放後 SoC 低於 50%，低溫冷啟動有風險。', 'SoC below 50% after parking: cold-crank risk.')) : ok(t('停放後 SoC 足以啟動。', 'SoC after parking is sufficient to crank.'))) +
        `<p class="note">${t('資料手冊：Deep Sleep 35 µA typ / 60 µA max（無週期喚醒）；含每秒喚醒量測 85 µA typ / 100 µA max（TA ≤ 85 °C）。Active 6–12 mA（24/48 MHz）。', 'Datasheet: Deep Sleep 35 µA typ / 60 µA max (no periodic wake-up); 85 µA typ / 100 µA max with once-per-second measurement (TA ≤ 85 °C). Active 6–12 mA (24/48 MHz).')}</p>`;
      boxOutput.textContent =
`/* Low-power budget (generated by MCU Notes) */
#define WAKEUP_PERIOD_MS           (${Math.round(v.p_wake * 1000)}u)
#define WAKEUP_ACTIVE_MS           (${v.t_wake}u)
#define EST_IBS_AVG_CURRENT_UA     (${iIbs.toFixed(1)}f)
#define EST_VEHICLE_QUIESCENT_MA   (${iTot.toFixed(2)}f)
#define EST_DAYS_TO_50PCT_SOC      (${to50.toFixed(0)}u)
`;
    } else {
      const usedF = v.boot + v.app + v.fusa + (v.calib > v.dflash ? v.calib : 0);
      const freeF = v.flash - usedF;
      const calibInData = v.calib <= v.dflash;
      const usedR = v.stack + v.data, freeR = v.sram - usedR;
      boxMetrics.innerHTML =
        metric(t('Code Flash 使用', 'Code flash used'), usedF.toFixed(1), '/ ' + v.flash + ' KB', freeF < 0 ? 'bad' : usedF / v.flash > .9 ? 'warn' : 'good') +
        metric(t('Flash 剩餘', 'Flash free'), freeF.toFixed(1), 'KB', freeF < 0 ? 'bad' : '') +
        metric(t('SRAM 使用', 'SRAM used'), usedR.toFixed(2), '/ ' + v.sram + ' KB', freeR < 0 ? 'bad' : usedR / v.sram > .85 ? 'warn' : 'good') +
        metric(t('SRAM 剩餘（heap）', 'SRAM free (heap)'), freeR.toFixed(2), 'KB', freeR < 0.5 ? 'warn' : '');
      tblTrade.innerHTML = head([t('分區', 'Region'), t('大小', 'Size'), t('用途', 'Purpose')]) +
        row(['BOOT', v.boot + ' KB', t('開機載入與更新（如 LIN 診斷刷寫）', 'Boot + update (e.g. LIN diagnostic flashing)')]) +
        row(['APP', v.app + ' KB', t('量測、SoC/SoH 演算法、LIN 協定棧', 'Measurement, SoC/SoH algorithms, LIN stack')]) +
        row(['SAFETY', v.fusa + ' KB', t('啟動與週期性自測（CPU、RAM、類比診斷）', 'Start-up and periodic self-tests (CPU, RAM, analog diagnostics)')]) +
        row(['CALIB', v.calib + ' KB', calibInData ? t('放在 Data Flash（含 ECC）', 'Placed in data flash (ECC-protected)') : t('Data Flash 不足，放入 Code Flash', 'Too large for data flash; placed in code flash')]);
      boxChecks.innerHTML =
        (freeF < 0 ? bad(t('Code Flash 溢位。', 'Code flash overflow.')) : freeF < 8 ? warn(t('Code Flash 餘裕 < 8 KB，後續更新受限。', 'Less than 8 KB flash headroom for updates.')) : ok(t('Code Flash 餘裕充足。', 'Code flash headroom is fine.'))) +
        (freeR < 0 ? bad(t('SRAM 溢位。', 'SRAM overflow.')) : freeR < 0.5 ? warn(t('SRAM 剩餘不足 0.5 KB。', 'Less than 0.5 KB SRAM left.')) : ok(t('SRAM 有餘裕。', 'SRAM has headroom.'))) +
        `<p class="note">${t('資料手冊：最高 128 KB Code Flash、8 KB Data Flash、8 KB SRAM，全部具 ECC；另有 1 KB SFlash。Data Flash 位址請查 TRM。', 'Datasheet: up to 128 KB code flash, 8 KB data flash and 8 KB SRAM, all with ECC, plus 1 KB SFlash. Look up the data-flash address in the TRM.')}</p>`;
      boxOutput.textContent =
`/* GCC linker MEMORY snippet (generated by MCU Notes; check addresses against the device TRM) */
MEMORY
{
  FLASH_BOOT (rx)  : ORIGIN = 0x00000000,           LENGTH = ${v.boot}K
  FLASH_APP  (rx)  : ORIGIN = 0x00000000 + ${v.boot}K,    LENGTH = ${v.app}K
  FLASH_SAFE (rx)  : ORIGIN = 0x00000000 + ${v.boot + v.app}K,   LENGTH = ${v.fusa}K
${calibInData ? '  /* calibration tables live in data flash (see TRM for its address) */' : `  FLASH_CAL  (r)   : ORIGIN = 0x00000000 + ${v.boot + v.app + v.fusa}K,   LENGTH = ${v.calib}K`}
  RAM        (rwx) : ORIGIN = 0x20000000,           LENGTH = ${v.sram}K
}
__stack_size = ${Math.round(v.stack * 1024)};
`;
    }
  }

  btnCopy.addEventListener('click', () => {
    const done = () => { btnCopy.textContent = t('已複製！', 'Copied!'); setTimeout(() => { btnCopy.textContent = t('複製', 'Copy'); }, 1500); };
    if(navigator.clipboard) navigator.clipboard.writeText(boxOutput.textContent).then(done, () => {});
  });

  buildInputs();
})();
