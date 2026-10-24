/* MCU Notes · Interactive lab (bilingual).
   Controls, metrics and plots are generated here so the zh and en pages stay identical.
   Numbers marked "DS" come from the Infineon PSoC 4 HVPA-144K datasheet (002-28660 Rev. *K). */
(function(){
  const EN = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const t = (zh, en) => EN ? en : zh;
  const {plot, fmtSI, Phi} = window.McuPlot;
  const $ = (s, r) => (r || document).querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- small UI builders ---------- */
  const range = (id, label, min, max, step, val) =>
    `<div class="ctl"><label for="${id}"><span>${label}</span> <output id="${id}-o"></output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
  const select = (id, label, opts, val) =>
    `<div class="ctl"><label for="${id}"><span>${label}</span></label><select id="${id}">${opts.map(o => `<option value="${o[0]}"${String(o[0]) === String(val) ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></div>`;
  const number = (id, label, min, max, val) =>
    `<div class="ctl"><label for="${id}"><span>${label}</span></label><input id="${id}" type="number" min="${min}" max="${max}" value="${val}"></div>`;
  const metric = (lbl, val, unit, cls) =>
    `<div class="metric"><span class="lbl">${lbl}</span><div class="val ${cls || ''}">${val}${unit ? '<span class="unit">' + unit + '</span>' : ''}</div></div>`;
  const plotPanel = (id, title, sub, legend) =>
    `<div class="panel"><h3>${title}${sub ? ' <small>' + sub + '</small>' : ''}</h3><svg class="viz plot" id="${id}" role="img" aria-label="${title}"></svg>${legend ? '<div class="legend">' + legend.map(l => `<span><i style="background:${l[0]}"></i>${l[1]}</span>`).join('') + '</div>' : ''}</div>`;
  const explain = (items, src) =>
    `<div class="panel"><h3>${t('模型說明與假設', 'Model notes &amp; assumptions')}</h3><ul class="note" style="border:0;padding:0 0 0 18px;margin:0">${items.map(i => '<li>' + i + '</li>').join('')}</ul>${src ? '<p class="note">' + src + '</p>' : ''}</div>`;
  const val = id => +$('#' + id).value;
  const out = (id, s) => { const o = $('#' + id + '-o'); if(o) o.textContent = s; };
  /* plot at the element's real pixel width so text stays 12px */
  const size = (svg, h) => ({W: Math.max(300, Math.round(svg.getBoundingClientRect().width || svg.parentElement.clientWidth - 36)), H: h});
  const DS = t('資料來源：Infineon PSoC™ 4 HVPA-144K Datasheet 002-28660 Rev. *K。', 'Source: Infineon PSoC™ 4 HVPA-144K datasheet 002-28660 Rev. *K.');

  const LABS = [];
  const lab = (id, name, controls, right, render, init) => LABS.push({id, name, controls, right, render, init});

  /* ==================== 1. SHUNT & AGC ==================== */
  const ADC_FS = 1.2;                       // V, ADC full-scale input (DS §1.8)
  const GAINS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
  const agcGain = v => { const a = Math.abs(v); for(let i = GAINS.length - 1; i >= 2; i--){ if(a <= 0.9 * ADC_FS / GAINS[i]) return GAINS[i]; } return 4; };

  lab('shunt', t('分流器與 AGC', 'Shunt &amp; AGC'),
    select('sh-r', t('分流電阻 R<sub>shunt</sub>', 'Shunt resistor R<sub>shunt</sub>'), [[50, '50 µΩ'], [100, t('100 µΩ（資料手冊範例）', '100 µΩ (datasheet example)')], [200, '200 µΩ']], 100) +
    range('sh-mag', t('電流大小 |I|（對數）', 'Current magnitude |I| (log)'), -3, 3.45, 0.01, Math.log10(12)) +
    select('sh-dir', t('方向', 'Direction'), [['-1', t('放電（負載）', 'Discharge (load)')], ['1', t('充電（發電機）', 'Charge (alternator)')]], '-1') +
    `<div class="ctl"><label>${t('情境預設', 'Scenario presets')}</label><div class="btnrow" id="sh-presets">
      <button class="btn" type="button" data-i="0.02">${t('鎖車暗電流 20 mA', 'Parked 20 mA')}</button>
      <button class="btn" type="button" data-i="12">${t('大燈 12 A', 'Headlamps 12 A')}</button>
      <button class="btn" type="button" data-i="250">${t('發電機 250 A', 'Alternator 250 A')}</button>
      <button class="btn" type="button" data-i="1100">${t('冷啟動 1100 A', 'Cold crank 1100 A')}</button></div></div>` +
    select('sh-mode', t('增益控制', 'Gain control'), [['auto', t('硬體 AGC（4–512 自動換檔）', 'Hardware AGC (auto 4–512)')]].concat(GAINS.map(g => [g, t('固定增益 ', 'Fixed gain ') + g + '×'])), 'auto'),
    '<div class="metrics" id="sh-metrics"></div><div class="two">' +
      plotPanel('sh-p1', t('AGC 換檔階梯', 'AGC gain staircase'), t('增益 vs 電流', 'gain vs current'), [['var(--analog)', t('自動增益', 'AGC gain')], ['var(--bad)', t('目前電流', 'Current point')]]) +
      plotPanel('sh-p2', t('相對量化誤差', 'Relative quantisation step'), t('1 LSB / |I|', '1 LSB / |I|'), [['var(--analog)', 'AGC'], ['var(--warn)', t('固定 4×', 'Fixed 4×')]]) +
    '</div>' +
    explain([
      t('ADC 滿量程輸入 1.2 V；電流通道增益 1–512，AGC 範例使用 4–512（DS §1.8.5）。輸入量程 = 1.2 V / G。', 'ADC full-scale input is 1.2 V; current-channel gain spans 1–512 and the AGC example uses 4–512 (DS §1.8.5). Input range = 1.2 V / G.'),
      t('Scaler 把結果乘上 512/G，使 LSB 權重固定：100 µΩ 時 1 LSB = 0.715 mA（與資料手冊一致）。', 'The scaler multiplies results by 512/G so the LSB weight is constant: 0.715 mA per LSB at 100 µΩ (matches the datasheet).'),
      t('AGC 門檻在此以 90% 滿量程模擬；實際門檻與遲滯由查表暫存器設定。', 'AGC thresholds are modelled at 90% of full scale; real thresholds and hysteresis are set in the lookup table.')
    ], DS),
    function(){
      const R = val('sh-r') * 1e-6, I = Math.pow(10, val('sh-mag')) * val('sh-dir'), mode = $('#sh-mode').value;
      out('sh-mag', fmtSI(Math.abs(I), 'A'));
      const V = I * R, G = mode === 'auto' ? agcGain(V) : +mode, FSv = ADC_FS / G;
      const clip = Math.abs(V) > FSv;
      const raw = clamp(Math.round(V / FSv * 32767), -32768, 32767);
      const scaled = raw * (512 / G);
      const lsbI = ADC_FS / 512 / 32768 / R;           // A per scaled LSB
      const qI = FSv / 32768 / R;                      // A per raw LSB at this gain
      const hex = (raw & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
      $('#sh-metrics').innerHTML =
        metric(t('分流跨壓', 'Shunt voltage'), fmtSI(V, 'V', 4)) +
        metric(t('目前增益', 'Active gain'), G + '×', '', G >= 64 ? 'good' : '') +
        metric(t('輸入量程', 'Input range'), '±' + fmtSI(FSv, 'V'), t(' = ±' + fmtSI(FSv / R, 'A'), ' = ±' + fmtSI(FSv / R, 'A'))) +
        metric(t('16-bit 原始碼', '16-bit raw code'), '0x' + hex, '', clip ? 'bad' : '') +
        metric(t('正規化結果', 'Normalised result'), scaled.toLocaleString(), ' LSB') +
        metric(t('量測電流', 'Measured current'), clip ? t('飽和', 'CLIPPED') : fmtSI(scaled * lsbI, 'A', 4), '', clip ? 'bad' : 'good') +
        metric(t('當前量化步階', 'Step at this gain'), fmtSI(qI, 'A')) +
        metric(t('分流功耗 I²R', 'Shunt power I²R'), fmtSI(I * I * R, 'W'), '', I * I * R > 10 ? 'warn' : '');
      const xs = []; for(let e = -3; e <= 3.7; e += 0.02) xs.push(Math.pow(10, e));
      const p1 = $('#sh-p1'), p2 = $('#sh-p2');
      plot(p1, Object.assign(size(p1, 240), {
        x: [1e-3, 5000], y: [1, 1024], logx: true, logy: true, yticks: [1, 4, 16, 64, 256, 512], yfmt: v => v + '×',
        xlabel: t('|電流| (A)', '|Current| (A)'), ylabel: t('增益', 'Gain'), m: {l: 64, b: 40},
        series: [{pts: xs.map(a => [a, mode === 'auto' ? agcGain(a * R) : +mode]), color: 'var(--analog)', w: 2.4}],
        vlines: [{x: Math.abs(I), color: 'var(--bad)', label: fmtSI(Math.abs(I), 'A'), w: 2}].concat(mode === 'auto' ? [] : [{x: FSv / R, color: 'var(--warn)', label: t('飽和點', 'clip'), anchor: 'end', dy: 14}])
      }));
      const rel = (a, g) => (ADC_FS / g / 32768 / R) / a * 100;
      plot(p2, Object.assign(size(p2, 240), {
        x: [1e-3, 5000], y: [1e-6, 100], logx: true, logy: true, m: {l: 64, b: 40},
        xlabel: t('|電流| (A)', '|Current| (A)'), ylabel: t('步階/讀值 (%)', 'Step / reading (%)'),
        series: [
          {pts: xs.filter(a => a * R <= ADC_FS / 4).map(a => [a, rel(a, 4)]), color: 'var(--warn)', w: 2, dash: '5 4'},
          {pts: xs.filter(a => a * R <= 0.9 * ADC_FS / 4).map(a => [a, rel(a, agcGain(a * R))]), color: 'var(--analog)', w: 2.4}
        ],
        vlines: [{x: Math.abs(I), color: 'var(--bad)', w: 2}]
      }));
    },
    function(){
      document.querySelectorAll('#sh-presets button').forEach(b => b.addEventListener('click', () => { $('#sh-mag').value = Math.log10(+b.dataset.i); render(); }));
    });

  /* ==================== 2. COULOMB COUNTING ==================== */
  lab('coulomb', t('庫倫積分漂移', 'Coulomb drift'),
    range('cc-cap', t('電瓶容量 Q<sub>n</sub>', 'Battery capacity Q<sub>n</sub>'), 20, 120, 5, 60) +
    range('cc-days', t('停放天數', 'Parked days'), 1, 60, 1, 21) +
    range('cc-idark', t('真實暗電流（整車）', 'True quiescent current (vehicle)'), 5, 100, 1, 20) +
    select('cc-r', t('分流電阻', 'Shunt'), [[100, '100 µΩ'], [200, '200 µΩ']], 100) +
    range('cc-off', t('放大器原始偏移', 'Raw amplifier offset'), 0, 50, 1, 10) +
    select('cc-chop', t('斬波穩零', 'Chopper stabilisation'), [['on', t('開啟（殘餘 ≈ 0.3 µV）', 'On (residual ≈ 0.3 µV)')], ['off', t('關閉', 'Off')]], 'on') +
    select('cc-ocv', t('靜置 OCV 重新定錨', 'Rest-OCV re-anchoring'), [['0', t('無', 'None')], ['1', t('每 1 天', 'Every day')], ['3', t('每 3 天', 'Every 3 days')], ['7', t('每 7 天', 'Every 7 days')]], '7'),
    '<div class="metrics" id="cc-metrics"></div>' +
    plotPanel('cc-plot', t('SoC：真實 vs 庫倫估計', 'SoC: true vs coulomb estimate'), '', [['var(--ok)', t('真實 SoC', 'True SoC')], ['var(--bad)', t('估計 SoC', 'Estimated SoC')], ['var(--warn)', t('OCV 定錨', 'OCV anchor')]]) +
    explain([
      t('偏移電壓 V<sub>os</sub> 在分流器上等效為虛假電流 I<sub>err</sub> = V<sub>os</sub>/R，被積分器線性累積。', 'An offset V<sub>os</sub> looks like a phantom current I<sub>err</sub> = V<sub>os</sub>/R and the integrator accumulates it linearly.'),
      t('斬波只消除「放大器自身」的偏移；分流器的熱電勢（Seebeck）是真實輸入，無法被斬波消除。', 'Chopping removes only the amplifier’s own offset; thermo-EMF at the shunt (Seebeck) is a real input and is not removed.'),
      t('OCV 定錨假設電池已充分靜置（鉛酸通常數小時）且 OCV→SoC 對照準確；實際 OCV 估算本身也有 ±數 % 誤差。', 'OCV anchoring assumes a fully rested battery (hours for lead-acid) and an accurate OCV→SoC table; real OCV estimates carry a few % error themselves.'),
      t('IBS 自身耗電（DS：Deep Sleep 35 µA typ，含每秒喚醒 85 µA typ）已包含在整車暗電流中。', 'The IBS’s own draw (DS: Deep Sleep 35 µA typ, 85 µA typ with 1 Hz wake-up) is part of the vehicle quiescent current.')
    ]),
    function(){
      const Qn = val('cc-cap'), days = val('cc-days'), Id = val('cc-idark') / 1000, R = val('cc-r') * 1e-6;
      const offRaw = val('cc-off'), chop = $('#cc-chop').value === 'on', every = +$('#cc-ocv').value;
      out('cc-cap', Qn + ' Ah'); out('cc-days', days + t(' 天', ' d')); out('cc-idark', (Id * 1000).toFixed(0) + ' mA'); out('cc-off', offRaw + ' µV');
      const off = chop ? Math.min(offRaw, 0.3) : offRaw;
      const Ierr = off * 1e-6 / R;
      const pT = [], pE = [], anchors = [];
      let trueAh = 0, estAh = 0, maxErr = 0;
      for(let h = 0; h <= days * 24; h++){
        const d = h / 24;
        if(h > 0){ trueAh += Id; estAh += Id + Ierr; }
        if(every && h > 0 && h % (every * 24) === 0){ estAh = trueAh; anchors.push(d); }
        const sT = clamp(100 * (1 - trueAh / Qn), 0, 100), sE = clamp(100 * (1 - estAh / Qn), 0, 100);
        maxErr = Math.max(maxErr, Math.abs(sT - sE));
        if(h % 2 === 0 || h === days * 24){ pT.push([d, sT]); pE.push([d, sE]); }
      }
      const endT = pT[pT.length - 1][1], endE = pE[pE.length - 1][1];
      $('#cc-metrics').innerHTML =
        metric(t('有效偏移', 'Effective offset'), off.toFixed(1), 'µV', chop ? 'good' : 'warn') +
        metric(t('虛假電流', 'Phantom current'), (Ierr * 1000).toFixed(1), 'mA', Ierr > Id * 0.2 ? 'bad' : 'good') +
        metric(t('無定錨時累積誤差', 'Error without anchoring'), (Ierr * 24 * days).toFixed(2), 'Ah', Ierr * 24 * days > 3 ? 'bad' : '') +
        metric(t('期末真實 SoC', 'True SoC at end'), endT.toFixed(1), '%') +
        metric(t('期末估計 SoC', 'Estimated SoC at end'), endE.toFixed(1), '%') +
        metric(t('最大 SoC 誤差', 'Max SoC error'), maxErr.toFixed(1), '%', maxErr > 5 ? 'bad' : 'good');
      const svg = $('#cc-plot');
      const lo = Math.max(0, Math.floor(Math.min(endT, endE, ...pE.map(p => p[1])) / 10) * 10 - 10);
      plot(svg, Object.assign(size(svg, 270), {
        x: [0, days], y: [lo, 100], xlabel: t('停放天數', 'Days parked'), ylabel: 'SoC (%)',
        series: [{pts: pT, color: 'var(--ok)', w: 2.6}, {pts: pE, color: 'var(--bad)', w: 2, dash: '6 4'}],
        vlines: anchors.slice(0, 20).map(d => ({x: d, color: 'var(--warn)', dash: '2 3', w: 1}))
      }));
    });

  /* ==================== 3. LOAD DUMP ==================== */
  lab('loaddump', t('拋負載', 'Load dump'),
    select('ld-test', t('測試型式（ISO 16750-2）', 'Test (ISO 16750-2)'), [['A', t('Test A：未抑制', 'Test A: unsuppressed')], ['B', t('Test B：中央抑制（發電機內箝位）', 'Test B: centrally suppressed')]], 'B') +
    range('ld-us', t('峰值 U<sub>s</sub>', 'Peak U<sub>s</sub>'), 65, 101, 1, 87) +
    range('ld-uss', t('抑制箝位 U<sub>s</sub>*', 'Suppression clamp U<sub>s</sub>*'), 27, 45, 1, 35) +
    range('ld-td', t('脈衝持續 t<sub>d</sub>', 'Pulse duration t<sub>d</sub>'), 40, 400, 10, 300) +
    range('ld-ri', t('源內阻 R<sub>i</sub>', 'Source resistance R<sub>i</sub>'), 0.5, 4, 0.5, 1) +
    select('ld-tvs', t('模組端外部保護', 'Module-level protection'), [['0', t('無', 'None')], ['33', t('TVS 箝位 33 V', 'TVS clamp 33 V')], ['38', t('TVS 箝位 38 V', 'TVS clamp 38 V')]], '0'),
    '<div class="metrics" id="ld-metrics"></div>' +
    plotPanel('ld-plot', t('VBAT 瞬態波形', 'VBAT transient'), '0–500 ms', [['var(--muted)', t('測試源電壓', 'Generator voltage')], ['var(--bad)', t('晶片 VBAT 腳', 'VBAT at the pin')], ['var(--safety)', t('絕對最大 42 V', 'Abs. max 42 V')]]) +
    explain([
      t('DS：VBAT 正常工作 3.6–28 V，可運作至 42 V；VBAT 絕對最大額定 42 V。', 'DS: VBAT operates 3.6–28 V and stays functional up to 42 V; absolute maximum rating is 42 V.'),
      t('DS 註 2：「為避免高壓脈衝造成損壞，可能需要外部保護（串聯電阻、二極體、TVS）」——晶片並未宣稱內建取代 TVS 的箝位。', 'DS note 2: “To prevent damage caused by high-voltage pulses, external protection (series resistor, diode, TVS) may be required.” The chip does not claim an on-chip clamp that replaces a TVS.'),
      t('簡化波形：上升 10 ms 後以指數衰減，t<sub>d</sub> 時降至 10%。Test A/B 參數（12 V 系統：U<sub>s</sub> 79–101 V、U<sub>s</sub>* 常為 35 V）以標準與 OEM 規範為準。', 'Simplified waveform: 10 ms rise, exponential decay to 10% at t<sub>d</sub>. Test A/B values (12 V systems: U<sub>s</sub> 79–101 V, U<sub>s</sub>* typically 35 V) follow the standard and OEM specs.'),
      t('TVS 以理想箝位計算，忽略動態電阻；能量 = ∫ V<sub>c</sub>·I dt。', 'The TVS is an ideal clamp (no dynamic resistance); energy = ∫ V<sub>c</sub>·I dt.')
    ], DS),
    function(){
      const test = $('#ld-test').value, Us = val('ld-us'), Uss = val('ld-uss'), td = val('ld-td'), Ri = val('ld-ri'), Vc = +$('#ld-tvs').value;
      out('ld-us', Us + ' V'); out('ld-uss', Uss + ' V'); out('ld-td', td + ' ms'); out('ld-ri', Ri.toFixed(1) + ' Ω');
      $('#ld-uss').disabled = test === 'A';
      const UA = 13.5, t0 = 40, tr = 10, tau = (td - tr) / Math.LN10;
      const gen = ms => {
        let u = UA;
        if(ms >= t0 && ms < t0 + tr) u = UA + (Us - UA) * (ms - t0) / tr;
        else if(ms >= t0 + tr) u = UA + (Us - UA) * Math.exp(-(ms - t0 - tr) / tau);
        return test === 'B' ? Math.min(u, Uss) : u;
      };
      const pG = [], pP = [];
      let peakG = 0, peakP = 0, Ipk = 0, E = 0;
      for(let ms = 0; ms <= 500; ms += 0.5){
        const u = gen(ms);
        let vp = u;
        if(Vc && u > Vc){ const i = (u - Vc) / Ri; vp = Vc; Ipk = Math.max(Ipk, i); E += Vc * i * 0.5e-3; }
        peakG = Math.max(peakG, u); peakP = Math.max(peakP, vp);
        if(ms % 2 === 0){ pG.push([ms, u]); pP.push([ms, vp]); }
      }
      const verdict = peakP > 42 ? ['bad', t('超過絕對最大額定 ✕', 'Exceeds abs. max ✕')] : peakP > 28 ? ['warn', t('可運作，超出完整規格區', 'Functional, outside full-spec range')] : ['good', t('在工作範圍內 ✓', 'Within operating range ✓')];
      $('#ld-metrics').innerHTML =
        metric(t('測試源峰值', 'Generator peak'), peakG.toFixed(1), 'V') +
        metric(t('VBAT 腳峰值', 'Peak at VBAT pin'), peakP.toFixed(1), 'V', verdict[0]) +
        metric(t('距 42 V 裕度', 'Margin to 42 V'), (42 - peakP).toFixed(1), 'V', peakP > 42 ? 'bad' : '') +
        metric(t('TVS 峰值電流', 'TVS peak current'), Vc ? Ipk.toFixed(1) : '—', Vc ? 'A' : '') +
        metric(t('TVS 吸收能量', 'TVS energy'), Vc ? E.toFixed(1) : '—', Vc ? 'J' : '', E > 100 ? 'warn' : '') +
        metric(t('判定', 'Verdict'), verdict[1], '', verdict[0] + ' txt');
      const svg = $('#ld-plot');
      plot(svg, Object.assign(size(svg, 280), {
        x: [0, 500], y: [0, Math.max(50, Math.ceil(peakG / 10) * 10 + 5)], xlabel: t('時間 (ms)', 'Time (ms)'), ylabel: t('電壓 (V)', 'Voltage (V)'),
        series: [{pts: pG, color: 'var(--muted)', w: 1.6, dash: '5 4'}, {pts: pP, color: 'var(--bad)', w: 2.6}],
        hlines: [{y: 42, color: 'var(--safety)', label: t('絕對最大 42 V', 'Abs. max 42 V')}, {y: 28, color: 'var(--ok)', label: t('完整規格上限 28 V', 'Full-spec limit 28 V')}]
      }));
    });

  /* ==================== 4. CHALLENGE-RESPONSE WINDOW WDT ==================== */
  let wdt = {t: 0, last: 0, events: [], running: false, raf: 0};
  lab('wdt', t('問答窗口看門狗', 'Window watchdog'),
    range('wdt-open', t('窗口開啟 T<sub>open</sub>', 'Window opens T<sub>open</sub>'), 10, 60, 5, 30) +
    range('wdt-close', t('窗口關閉 T<sub>close</sub>', 'Window closes T<sub>close</sub>'), 70, 200, 10, 100) +
    select('wdt-key', t('問答金鑰', 'Challenge-response key'), [['ok', t('正確（所有安全任務都執行完畢）', 'Correct (all safety tasks ran)')], ['bad', t('錯誤（任務被跳過或資料損毀）', 'Wrong (task skipped / data corrupt)')]], 'ok') +
    select('wdt-react', t('故障反應', 'Fault reaction'), [['reset', t('重置 (Reset)', 'Reset')], ['irq', t('中斷 (Interrupt)', 'Interrupt')]], 'reset') +
    select('wdt-speed', t('模擬速度', 'Simulation speed'), [['0.1', '0.1×'], ['0.25', '0.25×'], ['1', '1×']], '0.25') +
    `<div class="btnrow"><button class="btn pri" id="wdt-feed" type="button">${t('餵狗（送出金鑰）', 'Service (send key)')}</button><button class="btn" id="wdt-restart" type="button">${t('重新開始', 'Restart')}</button></div>`,
    '<div class="metrics" id="wdt-metrics"></div>' +
    plotPanel('wdt-plot', t('看門狗時間窗口', 'Watchdog timing window'), '', [['var(--bad)', t('禁止區（過早/逾時）', 'Forbidden (early / late)')], ['var(--ok)', t('合法窗口', 'Valid window')], ['var(--accent)', t('目前時間', 'Now')]]) +
    `<div class="panel"><h3>${t('事件紀錄', 'Event log')}</h3><div class="log" id="wdt-log"></div></div>` +
    explain([
      t('DS：CRWDT 在「過早、過晚或金鑰錯誤」時產生逾時事件，並可設定為重置或中斷；原因記錄於 Reset Cause 暫存器。', 'DS: the CRWDT raises a timeout when serviced too soon, too late or with the wrong key, configurable as reset or interrupt; the cause is latched in the Reset Cause register.'),
      t('看門狗由低功耗 32 kHz PILO 計時（DS §1.2.3）。窗口時間為示意值，實際值依安全概念設定。', 'Watchdogs are clocked by the low-power 32 kHz PILO (DS §1.2.3). Window times here are illustrative; real values come from the safety concept.'),
      t('金鑰序列與計算方式見 TRM，本模擬只表示「金鑰正確/錯誤」。', 'Key sequence details are in the TRM; this model only distinguishes correct vs wrong keys.')
    ], DS),
    function(){
      const To = val('wdt-open'), Tc = val('wdt-close');
      out('wdt-open', To + ' ms'); out('wdt-close', Tc + ' ms');
      const inWin = wdt.t >= To && wdt.t <= Tc;
      $('#wdt-metrics').innerHTML =
        metric(t('計時器', 'Timer'), wdt.t.toFixed(0), 'ms', inWin ? 'good' : (wdt.t > Tc ? 'bad' : 'warn')) +
        metric(t('狀態', 'State'), wdt.t < To ? t('過早區', 'Too early') : inWin ? t('可餵狗', 'Window open') : t('逾時', 'Late'), '', (inWin ? 'good' : 'warn') + ' txt') +
        metric(t('合法窗口', 'Valid window'), To + '–' + Tc, 'ms') +
        metric(t('故障次數', 'Faults'), wdt.events.filter(e => e.bad).length, '', wdt.events.some(e => e.bad) ? 'bad' : 'good');
      const svg = $('#wdt-plot'), X = Tc * 1.3;
      plot(svg, Object.assign(size(svg, 150), {
        x: [0, X], y: [0, 1], yticks: [], xlabel: t('距上次餵狗時間 (ms)', 'Time since last service (ms)'), m: {l: 16, t: 20, b: 40},
        series: [{pts: [[0, .5], [To, .5]], color: 'var(--bad)', w: 22}, {pts: [[To, .5], [Tc, .5]], color: 'var(--ok)', w: 22}, {pts: [[Tc, .5], [X, .5]], color: 'var(--bad)', w: 22}],
        vlines: [{x: wdt.t, color: 'var(--accent)', w: 3, dash: false, label: wdt.t.toFixed(0) + ' ms'}]
      }));
      $('#wdt-log').innerHTML = wdt.events.length ? wdt.events.slice(-6).reverse().map(e => `<div class="callout ${e.bad ? 'bad' : 'good'}" style="margin:0">${e.msg}</div>`).join('') : `<div class="note" style="border:0;margin:0">${t('等待餵狗…', 'Waiting for service…')}</div>`;
    },
    function(){
      const fault = (msg) => {
        const irq = $('#wdt-react').value === 'irq';
        wdt.events.push({bad: true, msg: '<b>' + msg + '</b> → ' + (irq ? t('觸發 WDT 中斷，韌體進入安全狀態處理。', 'WDT interrupt raised; firmware handles the safe state.') : t('晶片重置，Reset Cause 記錄原因。', 'Device reset; cause latched in Reset Cause.'))});
        wdt.t = 0;
      };
      $('#wdt-feed').addEventListener('click', () => {
        const To = val('wdt-open'), Tc = val('wdt-close'), at = wdt.t.toFixed(0);
        if(wdt.t < To) fault(t(`過早餵狗（${at} ms < ${To} ms）`, `Serviced too early (${at} ms < ${To} ms)`));
        else if($('#wdt-key').value !== 'ok') fault(t(`金鑰錯誤（${at} ms，時間雖在窗口內）`, `Wrong key (${at} ms, although inside the window)`));
        else { wdt.events.push({bad: false, msg: t(`<b>合法餵狗</b>：${at} ms，計時器清零。`, `<b>Valid service</b> at ${at} ms; timer cleared.`)}); wdt.t = 0; }
        LABS.find(l => l.id === 'wdt').render();
      });
      $('#wdt-restart').addEventListener('click', () => { wdt.t = 0; wdt.events = []; LABS.find(l => l.id === 'wdt').render(); });
      wdt.tick = now => {
        if(!wdt.running) return;
        const dt = wdt.last ? now - wdt.last : 0; wdt.last = now;
        wdt.t += dt * +$('#wdt-speed').value;
        if(wdt.t > val('wdt-close')) fault(t(`逾時未餵狗（> ${val('wdt-close')} ms）`, `Not serviced in time (> ${val('wdt-close')} ms)`));
        LABS.find(l => l.id === 'wdt').render();
        wdt.raf = requestAnimationFrame(wdt.tick);
      };
    });

  /* ==================== 5. DECIMATION FILTER ==================== */
  const sincMag = (f, fs, N) => { const d = Math.sin(Math.PI * f / fs); if(Math.abs(d) < 1e-12) return 1; return Math.abs(Math.sin(Math.PI * f * N / fs) / (N * d)); };
  lab('sinc', t('Sinc 抽取濾波', 'Sinc decimation'),
    select('sc-fmod', t('調變器時脈 f<sub>mod</sub>', 'Modulator clock f<sub>mod</sub>'), [[3072000, t('3.072 MHz（DS 範例）', '3.072 MHz (DS example)')], [1536000, '1.536 MHz']], 3072000) +
    select('sc-dr', t('Sinc³ 抽取比 DR', 'Sinc³ decimation DR'), [[16, 16], [32, 32], [64, 64], [128, 128]], 64) +
    select('sc-dr2', t('Sinc² 抽取比 DR2', 'Sinc² decimation DR2'), [[1, t('1（旁路）', '1 (bypass)')], [6, 6], [12, 12], [24, 24], [48, 48]], 48) +
    select('sc-avg', t('累加平均 N（軟/硬體）', 'Averaging N (accumulator)'), [[1, t('1（無）', '1 (none)')], [10, 10], [20, 20], [50, 50], [100, 100]], 1) +
    `<div class="ctl"><label>${t('預設組合', 'Presets')}</label><div class="btnrow" id="sc-presets">
      <button class="btn" type="button" data-p="64,48,1">${t('DS：1 kSPS', 'DS: 1 kSPS')}</button>
      <button class="btn" type="button" data-p="64,6,1">${t('鉛酸 8 kSPS', 'Lead-acid 8 kSPS')}</button>
      <button class="btn" type="button" data-p="64,48,100">${t('50/60 Hz 雙陷波', '50/60 Hz notches')}</button></div></div>`,
    '<div class="metrics" id="sc-metrics"></div>' +
    plotPanel('sc-plot', t('濾波鏈幅頻響應', 'Filter-chain magnitude response'), 'Sinc³ → Sinc² → avg', [['var(--analog)', t('整體響應', 'Overall response')], ['var(--warn)', '50 Hz'], ['var(--bad)', '60 Hz']]) +
    explain([
      t('DS §1.8：Sinc³ 在 N·f<sub>mod</sub>/DR 有零點；Sinc² 在 N·f<sub>mod</sub>/(DR·DR2) 有零點。DS 範例 OSR 64 @ 3.072 MHz → 48 kHz，DR2 = 48 → 1 kHz 零點。', 'DS §1.8: Sinc³ has nulls at N·f<sub>mod</sub>/DR; Sinc² at N·f<sub>mod</sub>/(DR·DR2). DS example: OSR 64 @ 3.072 MHz → 48 kHz, DR2 = 48 → nulls every 1 kHz.'),
      t('要同時消除 50 Hz 與 60 Hz，平均視窗必須是 1/10 s 的整數倍（零點落在 10 Hz 的倍數）。單靠 1.536 MHz／OSR 1536 只會得到 1 kHz 零點。', 'To null both 50 Hz and 60 Hz the averaging window must be a multiple of 0.1 s (nulls at multiples of 10 Hz). 1.536 MHz with OSR 1536 alone only gives 1 kHz nulls.'),
      t('DS：鉛酸電池應用的主電壓／電流通道只需 8 kSPS。實際晶片之後還有 16 tap 可程式 FIR，此處未納入。', 'DS: lead-acid applications need only 8 kSPS on the main voltage/current channels. The real chain also has a programmable 16-tap FIR, not modelled here.')
    ], DS),
    function(){
      const fm = val('sc-fmod'), DR = val('sc-dr'), DR2 = val('sc-dr2'), N = val('sc-avg');
      const f1 = fm / DR, f2 = f1 / DR2, f3 = f2 / N;
      const H = f => sincMag(f, fm, DR) ** 3 * (DR2 > 1 ? sincMag(f, f1, DR2) ** 2 : 1) * (N > 1 ? sincMag(f, f2, N) : 1);
      const dB = f => Math.max(-160, 20 * Math.log10(H(f) + 1e-12));
      let bw = 0; for(let f = 0.01; f < f1 / 2; f *= 1.002){ if(dB(f) < -3.01){ bw = f; break; } }
      const settle = 3 * DR / fm + (DR2 > 1 ? 2 * DR2 / f1 : 0) + (N > 1 ? N / f2 : 0);
      $('#sc-metrics').innerHTML =
        metric(t('Sinc³ 輸出', 'Sinc³ output'), fmtSI(f1, 'SPS')) +
        metric(t('最終輸出率', 'Final data rate'), fmtSI(f3, 'SPS'), '', 'good') +
        metric(t('−3 dB 頻寬', '−3 dB bandwidth'), fmtSI(bw, 'Hz')) +
        metric(t('50 Hz 衰減', '50 Hz attenuation'), dB(50).toFixed(1), 'dB', dB(50) < -40 ? 'good' : 'warn') +
        metric(t('60 Hz 衰減', '60 Hz attenuation'), dB(60).toFixed(1), 'dB', dB(60) < -40 ? 'good' : 'warn') +
        metric(t('建立時間（約）', 'Settling (approx.)'), fmtSI(settle, 's'));
      const pts = []; const fmax = Math.min(fm / 2, 2e5);
      for(let e = 0; e <= Math.log10(fmax); e += 0.0015){ const f = Math.pow(10, e); pts.push([f, dB(f)]); }
      const svg = $('#sc-plot');
      plot(svg, Object.assign(size(svg, 290), {
        x: [1, fmax], y: [-140, 5], logx: true, xlabel: t('頻率 (Hz)', 'Frequency (Hz)'), ylabel: t('增益 (dB)', 'Gain (dB)'),
        series: [{pts, color: 'var(--analog)', w: 1.6}],
        vlines: [{x: 50, color: 'var(--warn)', label: '50', anchor: 'end'}, {x: 60, color: 'var(--bad)', label: '60'}, {x: f3, color: 'var(--muted)', label: 'ODR ' + fmtSI(f3, 'Hz'), dy: 28}],
        hlines: [{y: -40, color: 'var(--muted)', label: '−40 dB'}]
      }));
    },
    function(){
      document.querySelectorAll('#sc-presets button').forEach(b => b.addEventListener('click', () => {
        const [a, c, n] = b.dataset.p.split(','); $('#sc-fmod').value = 3072000; $('#sc-dr').value = a; $('#sc-dr2').value = c; $('#sc-avg').value = n;
        LABS.find(l => l.id === 'sinc').render();
      }));
    });

  /* ==================== 6. SECDED ECC (39,32) ==================== */
  // positions 1..38 are a Hamming(38,32) code (check bits at 1,2,4,8,16,32); position 0 is the overall parity bit
  const isPow2 = p => (p & (p - 1)) === 0;
  const DATA_POS = []; for(let p = 1; p <= 38; p++) if(!isPow2(p)) DATA_POS.push(p);
  function encode(d){
    const w = new Array(39).fill(0);
    DATA_POS.forEach((p, i) => { w[p] = (d >>> i) & 1; });
    for(let k = 0; k < 6; k++){ const c = 1 << k; let x = 0; for(let p = 1; p <= 38; p++) if((p & c) && p !== c) x ^= w[p]; w[c] = x; }
    w[0] = w.reduce((a, b) => a ^ b, 0);
    return w;
  }
  const extract = w => DATA_POS.reduce((d, p, i) => (d | (w[p] << i)) >>> 0, 0);
  let ecc = {data: 0xA55AA55A, flips: new Set()};
  lab('ecc', 'SECDED ECC',
    `<p class="note" style="border:0;margin:0 0 10px;padding:0">${t('點擊任一位元注入翻轉。D = 資料位元，P = 檢查位元（位置 1,2,4,8,16,32），P0 = 整體同位。', 'Click a bit to flip it. D = data bit, P = check bit (positions 1,2,4,8,16,32), P0 = overall parity.')}</p>
     <div class="bit-grid" id="ecc-bits"></div>
     <div class="btnrow">
       <button class="btn" id="ecc-1" type="button">${t('隨機 1 位元', 'Random 1 bit')}</button>
       <button class="btn" id="ecc-2" type="button">${t('隨機 2 位元', 'Random 2 bits')}</button>
       <button class="btn" id="ecc-3" type="button">${t('隨機 3 位元', 'Random 3 bits')}</button>
       <button class="btn" id="ecc-new" type="button">${t('新資料字', 'New data word')}</button>
       <button class="btn pri" id="ecc-clr" type="button">${t('清除', 'Clear')}</button></div>`,
    '<div class="metrics" id="ecc-metrics"></div>' +
    `<div class="panel"><h3>${t('解碼器判定', 'Decoder verdict')}</h3><div id="ecc-report" class="callout"></div><pre class="code" id="ecc-code"></pre></div>` +
    explain([
      t('32 位元資料需要 6 個 Hamming 檢查位元（2⁶ ≥ 32+6+1）加 1 個整體同位位元 = 7 位元，共 39 位元碼字。', '32 data bits need 6 Hamming check bits (2⁶ ≥ 32+6+1) plus 1 overall parity bit = 7 bits, a 39-bit codeword.'),
      t('症狀碼 S = 所有錯誤位置的 XOR。S≠0 且整體同位錯 → 單錯，可修正；S≠0 且同位正確 → 雙錯，只能偵測。', 'Syndrome S = XOR of all error positions. S≠0 with parity error → single error, corrected; S≠0 with parity OK → double error, detected only.'),
      t('注入 3 位元時常會「誤修正」成錯誤資料而未被察覺——這正是 SECDED 的極限，需要其他安全機制補強。', 'With 3 flipped bits the decoder often “corrects” to wrong data silently — the limit of SECDED, which other safety mechanisms must cover.'),
      t('DS：單錯在讀取路徑上即時修正，並記錄位址與資料；不可修正錯誤送往故障系統（依設定產生中斷或重置）。', 'DS: single-bit errors are corrected in-line and the address/data are logged; uncorrectable errors go to the fault system (interrupt or reset, as configured).')
    ], DS),
    function(){
      const w = encode(ecc.data), r = w.slice();
      ecc.flips.forEach(p => { r[p] ^= 1; });
      let S = 0; for(let p = 1; p <= 38; p++) if(r[p]) S ^= p;
      const par = r.reduce((a, b) => a ^ b, 0);
      let kind, cls, fixed = r.slice();
      if(S === 0 && par === 0){ kind = ecc.flips.size ? t('未偵測到錯誤（偶數個錯誤剛好互相抵消）', 'No error detected (even error pattern cancelled out)') : t('無錯誤', 'No error'); cls = ecc.flips.size ? 'bad' : 'good'; }
      else if(par === 1){
        if(S <= 38){ fixed[S] ^= 1; kind = S === 0 ? t('單錯：整體同位位元 P0 本身', 'Single error in P0 itself') : t(`單錯：位置 ${S}，已修正`, `Single error at position ${S}, corrected`); cls = 'warn'; }
        else { kind = t('不可修正（症狀碼超出範圍）', 'Uncorrectable (syndrome out of range)'); cls = 'bad'; }
      } else { kind = t('雙錯：偵測到但無法修正', 'Double error: detected, not correctable'); cls = 'bad'; }
      const outD = extract(fixed), ok = outD === ecc.data;
      const silent = (cls === 'warn' && !ok) || (ecc.flips.size && S === 0 && par === 0 && !ok);
      if(silent){ cls = 'bad'; kind += t(' ⚠ 但輸出資料是錯的（靜默資料損毀）', ' ⚠ but the output data is wrong (silent corruption)'); }
      const grid = $('#ecc-bits');
      grid.innerHTML = '';
      for(let p = 38; p >= 0; p--){
        const b = document.createElement('button');
        const chk = p === 0 || isPow2(p);
        b.type = 'button';
        b.className = 'btn' + (chk ? ' chk' : '') + (ecc.flips.has(p) ? ' pri' : '');
        b.textContent = (p === 0 ? 'P0' : chk ? 'P' + p : 'D' + DATA_POS.indexOf(p));
        b.title = t('位置 ', 'Position ') + p + ' = ' + r[p];
        b.setAttribute('aria-pressed', ecc.flips.has(p));
        b.addEventListener('click', () => { ecc.flips.has(p) ? ecc.flips.delete(p) : ecc.flips.add(p); render(); });
        grid.appendChild(b);
      }
      const hex = v => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
      $('#ecc-metrics').innerHTML =
        metric(t('原始資料', 'Stored data'), hex(ecc.data)) +
        metric(t('翻轉位元數', 'Flipped bits'), ecc.flips.size, '', ecc.flips.size > 1 ? 'bad' : ecc.flips.size ? 'warn' : 'good') +
        metric(t('症狀碼 S', 'Syndrome S'), S + ' (0b' + S.toString(2).padStart(6, '0') + ')') +
        metric(t('整體同位', 'Overall parity'), par ? t('錯', 'error') : 'OK', '', par ? 'warn' : '') +
        metric(t('輸出資料', 'Output data'), hex(outD), '', ok ? 'good' : 'bad');
      const rep = $('#ecc-report');
      rep.className = 'callout ' + cls;
      rep.innerHTML = '<b>' + kind + '</b>';
      $('#ecc-code').textContent = `codeword  ${w.slice().reverse().join('')}\nreceived  ${r.slice().reverse().join('')}\nsyndrome  ${S.toString(2).padStart(6, '0')}   parity ${par}\nflipped   [${[...ecc.flips].sort((a, b) => a - b).join(', ')}]`;
    },
    function(){
      const rnd = n => { ecc.flips = new Set(); while(ecc.flips.size < n) ecc.flips.add(Math.floor(Math.random() * 39)); render(); };
      $('#ecc-1').addEventListener('click', () => rnd(1));
      $('#ecc-2').addEventListener('click', () => rnd(2));
      $('#ecc-3').addEventListener('click', () => rnd(3));
      $('#ecc-new').addEventListener('click', () => { ecc.data = (Math.random() * 2 ** 32) >>> 0; render(); });
      $('#ecc-clr').addEventListener('click', () => { ecc.flips = new Set(); render(); });
    });

  /* ==================== 7. LIN FRAME ==================== */
  lab('lin', t('LIN 訊框', 'LIN frame'),
    range('lin-id', t('訊框 ID', 'Frame ID'), 0, 63, 1, 34) +
    select('lin-baud', t('鮑率', 'Baud rate'), [[9600, '9.6 kbit/s'], [10417, '10.4 kbit/s'], [19200, '19.2 kbit/s'], [20000, '20 kbit/s']], 19200) +
    number('lin-d0', t('資料 0', 'Data 0'), 0, 255, 216) + number('lin-d1', t('資料 1', 'Data 1'), 0, 255, 48) +
    number('lin-d2', t('資料 2', 'Data 2'), 0, 255, 120) + number('lin-d3', t('資料 3', 'Data 3'), 0, 255, 85),
    '<div class="metrics" id="lin-metrics"></div>' +
    plotPanel('lin-plot', t('LIN 匯流排波形', 'LIN bus waveform'), t('含有限斜率', 'with finite slew'), [['var(--warn)', t('匯流排電壓', 'Bus voltage')], ['var(--muted)', t('欄位邊界', 'Field boundaries')]]) +
    explain([
      t('PID = ID[5:0] + P0 + P1；P0 = ID0⊕ID1⊕ID2⊕ID4，P1 = ¬(ID1⊕ID3⊕ID4⊕ID5)。', 'PID = ID[5:0] + P0 + P1; P0 = ID0⊕ID1⊕ID2⊕ID4, P1 = ¬(ID1⊕ID3⊕ID4⊕ID5).'),
      t('LIN 2.x 一般訊框用 Enhanced checksum（含 PID）；診斷訊框 0x3C/0x3D 用 Classic checksum（不含 PID）。', 'LIN 2.x uses the enhanced checksum (includes the PID) for normal frames; diagnostic frames 0x3C/0x3D use the classic checksum.'),
      t('訊框名目時間 = 34 + 10·(N+1) 位元；規範允許最長 1.4 倍。', 'Nominal frame time = 34 + 10·(N+1) bits; the spec allows up to 1.4×.'),
      t('DS：整合 LIN 收發器，相容 LIN 2.2A / ISO 17987 / SAE J2602；LIN 腳耐壓 −27 V 至 +42 V。', 'DS: integrated LIN transceiver, LIN 2.2A / ISO 17987 / SAE J2602 compliant; LIN pin rated −27 V to +42 V.')
    ], DS),
    function(){
      const id = val('lin-id'), baud = val('lin-baud'), d = ['lin-d0', 'lin-d1', 'lin-d2', 'lin-d3'].map(k => clamp(Math.round(val(k)) || 0, 0, 255));
      out('lin-id', '0x' + id.toString(16).toUpperCase().padStart(2, '0') + ' (' + id + ')');
      const b = i => (id >> i) & 1;
      const p0 = b(0) ^ b(1) ^ b(2) ^ b(4), p1 = (b(1) ^ b(3) ^ b(4) ^ b(5)) ^ 1;
      const pid = id | (p0 << 6) | (p1 << 7);
      const classic = id >= 60;
      let sum = classic ? 0 : pid; d.forEach(x => { sum += x; if(sum > 255) sum -= 255; });
      const cks = (~sum) & 0xFF;
      const Tb = 1e6 / baud, bits = 34 + 10 * (d.length + 1);
      const hx = v => '0x' + v.toString(16).toUpperCase().padStart(2, '0');
      $('#lin-metrics').innerHTML =
        metric('PID', hx(pid)) +
        metric(classic ? 'Classic checksum' : 'Enhanced checksum', hx(cks), '', 'good') +
        metric(t('位元時間', 'Bit time'), Tb.toFixed(1), 'µs') +
        metric(t('名目訊框時間', 'Nominal frame'), (bits * Tb / 1000).toFixed(2), 'ms') +
        metric(t('最長允許', 'Max allowed'), (1.4 * bits * Tb / 1000).toFixed(2), 'ms');
      const stream = [], fields = [];
      const byte = (v, name) => { fields.push([stream.length, name]); stream.push(0); for(let i = 0; i < 8; i++) stream.push((v >> i) & 1); stream.push(1); };
      fields.push([0, 'Break']); for(let i = 0; i < 13; i++) stream.push(0); stream.push(1);
      byte(0x55, 'Sync'); byte(pid, 'PID'); d.forEach((x, i) => byte(x, 'D' + i)); byte(cks, 'CS');
      const edge = Math.min(0.25, 5 / Tb) * Tb, hi = 12, lo = 1;
      const pts = [[0, hi]]; let last = 1;
      stream.forEach((s, i) => { const t0 = i * Tb; if(s !== last){ pts.push([t0, last ? hi : lo]); pts.push([t0 + edge, s ? hi : lo]); last = s; } });
      pts.push([stream.length * Tb, last ? hi : lo]);
      const svg = $('#lin-plot');
      plot(svg, Object.assign(size(svg, 230), {
        x: [0, stream.length * Tb], y: [0, 14], xlabel: t('時間 (µs)', 'Time (µs)'), ylabel: t('電壓 (V)', 'Voltage (V)'),
        series: [{pts, color: 'var(--warn)', w: 1.8}],
        vlines: fields.map(f => ({x: f[0] * Tb, color: 'var(--muted)', w: 1, label: f[1], dy: 0}))
      }));
    });

  /* ==================== 8. TRIM & YIELD (Monte Carlo) ==================== */
  function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  lab('trim', t('修調與良率', 'Trim &amp; yield'),
    range('tr-sigma', t('原始偏移 σ<sub>raw</sub>', 'Raw offset σ<sub>raw</sub>'), 50, 300, 10, 150) +
    select('tr-bits', t('修調位元數', 'Trim bits'), [[0, t('0（不修調）', '0 (no trim)')], [4, '4'], [6, '6'], [8, '8']], 6) +
    range('tr-range', t('修調範圍 ±', 'Trim range ±'), 200, 900, 50, 500) +
    range('tr-noise', t('ATE 量測雜訊 σ', 'ATE measurement noise σ'), 0, 20, 1, 3) +
    range('tr-spec', t('規格上限 ±', 'Spec limit ±'), 10, 60, 5, 25),
    '<div class="metrics" id="tr-metrics"></div>' +
    plotPanel('tr-plot', t('偏移分佈（Monte Carlo 20 000 顆）', 'Offset distribution (Monte Carlo, 20 000 dies)'), '', [['var(--bad)', t('修調前', 'Before trim')], ['var(--ok)', t('修調後', 'After trim')], ['var(--muted)', t('規格', 'Spec')]]) +
    explain([
      t('每顆晶粒：量測偏移（含 ATE 雜訊）→ 取最接近的修調碼（受範圍限制）→ 殘餘偏移 = 真實偏移 − 修調量。', 'Per die: measure offset (with ATE noise) → pick the nearest trim code (range-limited) → residual = true offset − applied correction.'),
      t('殘餘誤差來自三處：量化（步階/√12）、量測雜訊、以及超出修調範圍的尾端晶粒。', 'Residual error comes from quantisation (step/√12), measurement noise, and dies outside the trim range.'),
      t('參數為教學示意值，非 HVPA 實際修調規格。', 'Values are illustrative, not HVPA trim specifications.')
    ]),
    function(){
      const s = val('tr-sigma'), bits = val('tr-bits'), rg = val('tr-range'), nz = val('tr-noise'), spec = val('tr-spec');
      out('tr-sigma', s + ' µV'); out('tr-range', rg + ' µV'); out('tr-noise', nz + ' µV'); out('tr-spec', spec + ' µV');
      const rnd = mulberry32(42), N = 20000, step = bits ? 2 * rg / (2 ** bits) : 0;
      const gauss = () => { let u = 0, v = 0; while(!u) u = rnd(); v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      const raw = [], fin = []; let okR = 0, okT = 0, outR = 0;
      for(let i = 0; i < N; i++){
        const x = gauss() * s; raw.push(x);
        let y = x;
        if(bits){
          const meas = x + gauss() * nz;
          const code = clamp(Math.round(meas / step), -(2 ** (bits - 1)), 2 ** (bits - 1) - 1);
          y = x - code * step;
          if(Math.abs(x) > rg) outR++;
        }
        fin.push(y);
        if(Math.abs(x) <= spec) okR++;
        if(Math.abs(y) <= spec) okT++;
      }
      const sd = a => Math.sqrt(a.reduce((p, v) => p + v * v, 0) / a.length);
      $('#tr-metrics').innerHTML =
        metric(t('修調前良率', 'Yield before trim'), (okR / N * 100).toFixed(1), '%', okR / N < .8 ? 'bad' : 'warn') +
        metric(t('修調後良率', 'Yield after trim'), (okT / N * 100).toFixed(2), '%', okT / N > .99 ? 'good' : 'warn') +
        metric(t('修調步階', 'Trim step'), bits ? step.toFixed(1) : '—', bits ? 'µV' : '') +
        metric(t('殘餘 σ', 'Residual σ'), sd(fin).toFixed(1), 'µV') +
        metric(t('超出修調範圍', 'Outside trim range'), (outR / N * 100).toFixed(2), '%', outR ? 'warn' : '');
      const lim = Math.max(3.5 * s, 2 * spec), nb = 120, bw = 2 * lim / nb;
      const hist = a => { const h = new Array(nb).fill(0); a.forEach(v => { const k = Math.floor((v + lim) / bw); if(k >= 0 && k < nb) h[k]++; }); return h.map((c, k) => [-lim + (k + .5) * bw, c / N / bw * 1000]); };
      const hR = hist(raw), hT = hist(fin), ymax = Math.max(...hT.map(p => p[1]), ...hR.map(p => p[1])) * 1.1;
      const svg = $('#tr-plot');
      plot(svg, Object.assign(size(svg, 270), {
        x: [-lim, lim], y: [0, ymax], xlabel: t('偏移 (µV)', 'Offset (µV)'), ylabel: t('機率密度 (‰/µV)', 'Density (‰/µV)'),
        series: [{pts: hR, color: 'var(--bad)', w: 1.6, fill: true, op: .12}, {pts: hT, color: 'var(--ok)', w: 2, fill: true, op: .2}],
        vlines: [{x: -spec, color: 'var(--muted)', label: '−' + spec, anchor: 'end'}, {x: spec, color: 'var(--muted)', label: '+' + spec}]
      }));
    });

  /* ---------- mount ---------- */
  const tabs = $('#labTabs'), root = $('#labRoot');
  if(!tabs || !root) return;
  tabs.innerHTML = LABS.map((l, i) => `<button role="tab" id="tabbtn-${l.id}" aria-controls="tab-${l.id}" data-tab="${l.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${l.name}</button>`).join('');
  root.innerHTML = LABS.map(l => `<section class="tabp" id="tab-${l.id}" role="tabpanel" aria-labelledby="tabbtn-${l.id}" hidden><div class="bench"><div class="panel"><h3>${t('參數設定', 'Parameters')}</h3>${l.controls}</div><div class="stack">${l.right}</div></div></section>`).join('');
  let render = () => {};
  LABS.forEach(l => {
    const sec = $('#tab-' + l.id);
    sec.querySelectorAll('input,select').forEach(el => el.addEventListener('input', () => l.render()));
    render = l.render;            // used by init() closures that call render()
    if(l.init) l.init();
  });

  let active = null;
  function show(id, push){
    const l = LABS.find(x => x.id === id) || LABS[0];
    active = l;
    tabs.querySelectorAll('button').forEach(b => { const on = b.dataset.tab === l.id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    LABS.forEach(x => { $('#tab-' + x.id).hidden = x !== l; });
    render = l.render;
    wdt.running = l.id === 'wdt';
    cancelAnimationFrame(wdt.raf); wdt.last = 0;
    l.render();
    if(wdt.running) wdt.raf = requestAnimationFrame(wdt.tick);
    if(push) history.replaceState(null, '', '#' + l.id);
  }
  tabs.addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if(b) show(b.dataset.tab, true); });
  tabs.addEventListener('keydown', e => {
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = LABS.indexOf(active), n = LABS[(i + (e.key === 'ArrowRight' ? 1 : LABS.length - 1)) % LABS.length];
    show(n.id, true); $('#tabbtn-' + n.id).focus();
  });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => active && active.render(), 120); });
  document.addEventListener('themechange', () => active && active.render());
  show(location.hash.slice(1) || LABS[0].id);
})();
