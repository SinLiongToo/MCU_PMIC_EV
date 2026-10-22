/* MCU Notes · Interactive Lab Scripts */
(function(){
  const {plot, fmtSI, Phi} = window.McuPlot;

  /* Tab switching */
  const tabs = document.querySelectorAll('.seg button[data-tab]');
  const panels = document.querySelectorAll('.tabp');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabs.forEach(b => b.setAttribute('aria-selected', b === btn));
      panels.forEach(p => p.hidden = (p.id !== 'tab-' + target));
      renderCurrentTab(target);
    });
  });

  function renderCurrentTab(id){
    if(id === 'shunt') renderShunt();
    else if(id === 'coulomb') renderCoulomb();
    else if(id === 'loaddump') renderLoadDump();
    else if(id === 'wdt') renderWdt();
    else if(id === 'sinc') renderSinc();
    else if(id === 'ecc') renderEcc();
    else if(id === 'lin') renderLin();
    else if(id === 'trim') renderTrim();
  }

  /* ==================== 1. SHUNT & AGC ==================== */
  const elShunt = document.getElementById('sh-shunt');
  const elCurr = document.getElementById('sh-curr');
  const elCurrO = document.getElementById('sh-curr-o');
  const elShuntO = document.getElementById('sh-shunt-o');
  const elMode = document.getElementById('sh-mode');
  const elVref = document.getElementById('sh-vref');
  const elVrefO = document.getElementById('sh-vref-o');
  const mShunt = document.getElementById('sh-metrics');

  function renderShunt(){
    const R_uohm = +elShunt.value; // µΩ
    const R = R_uohm * 1e-6; // Ω
    const I = +elCurr.value; // A
    const Vref = +elVref.value; // V
    const mode = elMode.value;

    elCurrO.textContent = (I >= 0 ? '+' : '') + I.toFixed(1) + ' A';
    elShuntO.textContent = R_uohm + ' µΩ';
    elVrefO.textContent = Vref.toFixed(2) + ' V';

    const Vdiff = I * R; // V
    const Vdiff_mV = Vdiff * 1e3; // mV

    // Determine Gain in AGC mode
    let gain = 1;
    const absV = Math.abs(Vdiff);
    if(mode === 'auto'){
      if(absV <= 0.002) gain = 64;
      else if(absV <= 0.004) gain = 32;
      else if(absV <= 0.008) gain = 16;
      else if(absV <= 0.018) gain = 8;
      else if(absV <= 0.038) gain = 4;
      else if(absV <= 0.075) gain = 2;
      else gain = 1;
    } else {
      gain = +mode;
    }

    const V_amp = Vdiff * gain; // V into ADC core
    const FSR = (Vref / 8) / gain * 1e3; // mV input full scale range
    const isClipped = Math.abs(V_amp) > (Vref / 8);
    const adcRatio = Math.max(-1, Math.min(1, V_amp / (Vref / 8)));
    const code = Math.round(adcRatio * 32767);
    const hexCode = (code >= 0 ? code : 65536 + code).toString(16).toUpperCase().padStart(4, '0');
    const LSB_uV = ((Vref / 8) / 32768) / gain * 1e6; // µV/LSB
    const power_W = I * I * R;

    mShunt.innerHTML = `
      <div class="metric"><span class="lbl">分流電阻跨壓</span><div class="val">${(Vdiff_mV).toFixed(3)}<span class="unit">mV</span></div></div>
      <div class="metric"><span class="lbl">PGA 當前增益</span><div class="val ${gain > 1 ? 'good' : ''}">${gain}x</div></div>
      <div class="metric"><span class="lbl">輸入量程 FSR</span><div class="val">±${FSR.toFixed(1)}<span class="unit">mV</span></div></div>
      <div class="metric"><span class="lbl">解析度 (1LSB)</span><div class="val">${LSB_uV.toFixed(2)}<span class="unit">µV</span></div></div>
      <div class="metric"><span class="lbl">16-bit ADC 輸出碼</span><div class="val mono ${isClipped ? 'bad' : ''}">0x${hexCode}</div></div>
      <div class="metric"><span class="lbl">分流電阻熱功耗</span><div class="val ${power_W > 10 ? 'warn' : ''}">${power_W < 1 ? (power_W*1e3).toFixed(1) + '<span class="unit">mW</span>' : power_W.toFixed(2) + '<span class="unit">W</span>'}</div></div>
    `;

    // Plot input range & gain thresholds
    const svgIn = document.getElementById('sh-plot-in');
    const ptsIn = [];
    for(let a = -1200; a <= 1500; a += 50){
      ptsIn.push([a, Math.abs(a * R * 1e3)]);
    }
    plot(svgIn, {
      W: 360, H: 200, x: [-1200, 1500], y: [0, 160], xlabel: '負載電流 (A)', ylabel: '|V_shunt| (mV)',
      series: [{pts: ptsIn, color: 'var(--analog)', w: 2}],
      vlines: [{x: I, color: 'var(--bad)', label: I + 'A', w: 2}],
      hlines: [{y: 75, color: 'var(--muted)', label: 'AGC 2x'}, {y: 18.7, color: 'var(--muted)', label: 'AGC 8x'}, {y: 2.3, color: 'var(--muted)', label: 'AGC 64x'}]
    });

    // Plot ADC output transfer
    const svgOut = document.getElementById('sh-plot-out');
    const ptsOut = [];
    const maxI = Math.min(1500, (Vref / 8) / (R * gain));
    for(let a = -maxI * 1.2; a <= maxI * 1.2; a += maxI / 15){
      const val = Math.max(-1, Math.min(1, (a * R * gain) / (Vref / 8))) * 32767;
      ptsOut.push([a, val]);
    }
    plot(svgOut, {
      W: 360, H: 200, x: [-maxI * 1.2, maxI * 1.2], y: [-33000, 33000], xlabel: '輸入電流 (A)', ylabel: 'ADC 碼 (Dec)',
      series: [{pts: ptsOut, color: 'var(--core)', w: 2}],
      vlines: [{x: I, color: 'var(--bad)', label: '當前點', w: 1.5}],
      hlines: [{y: code, color: 'var(--bad)', label: code.toString()}]
    });
  }

  [elShunt, elCurr, elMode, elVref].forEach(el => el.addEventListener('input', renderShunt));
  document.querySelectorAll('#sh-presets button').forEach(b => {
    b.addEventListener('click', () => { elCurr.value = b.dataset.val; renderShunt(); });
  });

  /* ==================== 2. COULOMB COUNTING & SOC ==================== */
  const elCcCap = document.getElementById('cc-cap');
  const elCcCapO = document.getElementById('cc-cap-o');
  const elCcDays = document.getElementById('cc-days');
  const elCcDaysO = document.getElementById('cc-days-o');
  const elCcOff = document.getElementById('cc-offset');
  const elCcOffO = document.getElementById('cc-offset-o');
  const elCcShunt = document.getElementById('cc-shunt');
  const elCcChop = document.getElementById('cc-chop');
  const elCcOcv = document.getElementById('cc-ocv');
  const mCc = document.getElementById('cc-metrics');

  function renderCoulomb(){
    const Qn = +elCcCap.value; // Ah
    const days = +elCcDays.value;
    const rawOff_uV = +elCcOff.value;
    const R_shunt = +elCcShunt.value * 1e-6; // Ω
    const chopOn = elCcChop.value === 'on';
    const ocvOn = elCcOcv.value === 'yes';

    elCcCapO.textContent = Qn + ' Ah';
    elCcDaysO.textContent = days + ' 天';
    elCcOffO.textContent = rawOff_uV + ' µV';

    const effectiveOff_uV = chopOn ? 0.4 : rawOff_uV; // Chopping reduces offset to <0.5µV
    const I_standby_true = 0.015; // 15 mA true dark current
    const I_offset_err = (effectiveOff_uV * 1e-6) / R_shunt; // A error current
    const total_I_est = I_standby_true + I_offset_err;

    const trueDrain_Ah = I_standby_true * 24 * days;
    const errDrain_Ah = I_offset_err * 24 * days;
    const socTrueEnd = Math.max(0, 100 * (1 - trueDrain_Ah / Qn));
    const socEstEnd = Math.max(0, Math.min(100, 100 * (1 - (trueDrain_Ah + errDrain_Ah) / Qn)));
    const socDriftPct = Math.abs(socEstEnd - socTrueEnd);

    mCc.innerHTML = `
      <div class="metric"><span class="lbl">真實暗電流</span><div class="val">15.0<span class="unit">mA</span></div></div>
      <div class="metric"><span class="lbl">未補償誤差虛擬電流</span><div class="val ${I_offset_err > 0.05 ? 'bad' : 'good'}">${(I_offset_err*1e3).toFixed(1)}<span class="unit">mA</span></div></div>
      <div class="metric"><span class="lbl">真實耗電量</span><div class="val">${trueDrain_Ah.toFixed(2)}<span class="unit">Ah</span></div></div>
      <div class="metric"><span class="lbl">漂移虛假累積量</span><div class="val ${errDrain_Ah > 5 ? 'bad' : ''}">${errDrain_Ah.toFixed(2)}<span class="unit">Ah</span></div></div>
      <div class="metric"><span class="lbl">末期 SoC 估算誤差</span><div class="val ${socDriftPct > 5 ? 'bad' : 'good'}">${socDriftPct.toFixed(1)}<span class="unit">%</span></div></div>
      <div class="metric"><span class="lbl">斬波歸零狀態</span><div class="val good">${chopOn ? 'Offset < 0.5µV' : '漂移加劇'}</div></div>
    `;

    // Plot Timeline of SoC
    const ptsTrue = [];
    const ptsEst = [];
    let curEstAh = 0;
    for(let d = 0; d <= days; d += 0.5){
      const tAh = I_standby_true * 24 * d;
      if(ocvOn && d > 0 && Math.floor(d) % 7 === 0 && d === Math.floor(d)){
        curEstAh = tAh; // OCV reset
      } else {
        curEstAh += total_I_est * 24 * 0.5;
      }
      ptsTrue.push([d, Math.max(0, 100 * (1 - tAh / Qn))]);
      ptsEst.push([d, Math.max(0, Math.min(100, 100 * (1 - curEstAh / Qn)))]);
    }

    const svg = document.getElementById('cc-plot');
    plot(svg, {
      W: 660, H: 260, x: [0, days], y: [0, 100], xlabel: '車輛靜置停放天數 (Days)', ylabel: '電池荷電狀態 SoC (%)',
      series: [
        {pts: ptsTrue, color: 'var(--ok)', w: 2.5},
        {pts: ptsEst, color: 'var(--bad)', w: 2, dash: '4 3'}
      ],
      vlines: ocvOn ? [7, 14, 21, 28, 35, 42, 49, 56].filter(d => d <= days).map(d => ({x: d, color: 'var(--warn)', label: 'OCV校正'})) : []
    });
  }

  [elCcCap, elCcDays, elCcOff, elCcShunt, elCcChop, elCcOcv].forEach(el => el.addEventListener('input', renderCoulomb));

  /* ==================== 3. LOAD DUMP ==================== */
  const elLdVp = document.getElementById('ld-vp');
  const elLdVpO = document.getElementById('ld-vp-o');
  const elLdTd = document.getElementById('ld-td');
  const elLdTdO = document.getElementById('ld-td-o');
  const elLdClamp = document.getElementById('ld-clamp');
  const btnLdFire = document.getElementById('ld-fire');
  const mLd = document.getElementById('ld-metrics');

  function renderLoadDump(){
    const Vp = +elLdVp.value;
    const td = +elLdTd.value;
    const clampOn = elLdClamp.value === 'on';

    elLdVpO.textContent = Vp + ' V';
    elLdTdO.textContent = td + ' ms';

    const clampLevel = clampOn ? 38.5 : Vp;
    const isDestroyed = !clampOn && Vp > 32;
    const maxClampedV = Math.min(Vp, clampLevel);
    const clampCurrent = clampOn && Vp > 38.5 ? (Vp - 38.5) / 1.5 : 0; // 1.5 ohm source imp
    const peakPower = maxClampedV * clampCurrent;

    mLd.innerHTML = `
      <div class="metric"><span class="lbl">突波峰值 (Peak)</span><div class="val">${Vp.toFixed(1)}<span class="unit">V</span></div></div>
      <div class="metric"><span class="lbl">晶片引腳箝位電壓</span><div class="val ${isDestroyed ? 'bad' : 'good'}">${maxClampedV.toFixed(1)}<span class="unit">V</span></div></div>
      <div class="metric"><span class="lbl">VDDD (3.3V 穩壓軌)</span><div class="val ${isDestroyed ? 'bad' : 'good'}">${isDestroyed ? '0.0' : '3.30'}<span class="unit">V</span></div></div>
      <div class="metric"><span class="lbl">VCCD (1.8V 核心核心軌)</span><div class="val ${isDestroyed ? 'bad' : 'good'}">${isDestroyed ? '0.0' : '1.80'}<span class="unit">V</span></div></div>
      <div class="metric"><span class="lbl">箝位崩潰吸收功率</span><div class="val ${peakPower > 50 ? 'warn' : ''}">${peakPower.toFixed(1)}<span class="unit">W</span></div></div>
      <div class="metric"><span class="lbl">晶片生存狀態</span><div class="val ${isDestroyed ? 'bad' : 'good'}">${isDestroyed ? '擊穿自毀 ✕' : '正常運行 ✓'}</div></div>
    `;

    // Plot transient from 0 to 600 ms
    const ptsVbat = [];
    const ptsVddd = [];
    const ptsVccd = [];

    for(let t = 0; t <= 600; t += 10){
      let v = 13.5;
      if(t >= 50 && t <= 50 + td){
        const tau = td / 3;
        const dt = t - 50;
        const surge = (Vp - 13.5) * (dt / (td * 0.1 < 20 ? 20 : td * 0.1)) * Math.exp(-dt / tau);
        v = Math.min(Vp, 13.5 + Math.max(0, surge));
        if(clampOn && v > 38.5) v = 38.5;
      }
      ptsVbat.push([t, v]);
      ptsVddd.push([t, isDestroyed && t > 80 ? 0 : 3.3]);
      ptsVccd.push([t, isDestroyed && t > 80 ? 0 : 1.8]);
    }

    const svg = document.getElementById('ld-plot');
    plot(svg, {
      W: 660, H: 260, x: [0, 600], y: [0, 55], xlabel: '時間 (ms)', ylabel: '電壓 (V)',
      series: [
        {pts: ptsVbat, color: 'var(--bad)', w: 2.5},
        {pts: ptsVddd, color: 'var(--accent)', w: 2},
        {pts: ptsVccd, color: 'var(--ok)', w: 2}
      ],
      hlines: [
        {y: 42, color: 'var(--muted)', label: '42V 耐受標線'},
        {y: 38.5, color: 'var(--safety)', label: '38.5V 內部主動鉗位'}
      ]
    });
  }

  [elLdVp, elLdTd, elLdClamp].forEach(el => el.addEventListener('input', renderLoadDump));
  if(btnLdFire) btnLdFire.addEventListener('click', renderLoadDump);

  /* ==================== 4. WDT ==================== */
  const elWdtOpen = document.getElementById('wdt-open');
  const elWdtOpenO = document.getElementById('wdt-open-o');
  const elWdtClose = document.getElementById('wdt-close');
  const elWdtCloseO = document.getElementById('wdt-close-o');
  const elWdtAns = document.getElementById('wdt-ans');
  const btnWdtFeed = document.getElementById('wdt-feed');
  const btnWdtReset = document.getElementById('wdt-reset');
  const mWdt = document.getElementById('wdt-metrics');
  const logWdt = document.getElementById('wdt-log');

  let wdtCurrentTime = 0;
  let wdtTimerId = null;

  function renderWdt(){
    const T_open = +elWdtOpen.value;
    const T_close = +elWdtClose.value;
    elWdtOpenO.textContent = T_open + ' ms';
    elWdtCloseO.textContent = T_close + ' ms';

    mWdt.innerHTML = `
      <div class="metric"><span class="lbl">窗口禁餵區</span><div class="val">0 ~ ${T_open}<span class="unit">ms</span></div></div>
      <div class="metric"><span class="lbl">合法刷新窗口</span><div class="val good">${T_open} ~ ${T_close}<span class="unit">ms</span></div></div>
      <div class="metric"><span class="lbl">超時逾時閥值</span><div class="val bad">&gt; ${T_close}<span class="unit">ms</span></div></div>
      <div class="metric"><span class="lbl">問答校驗算法</span><div class="val">${elWdtAns.value === 'valid' ? 'Token 正確' : 'Token 錯誤 ✕'}</div></div>
    `;

    const svg = document.getElementById('wdt-plot');
    plot(svg, {
      W: 660, H: 200, x: [0, T_close * 1.3], y: [0, 10], xlabel: '看門狗計時累計 (ms)', ylabel: '狀態',
      series: [
        {pts: [[0, 2], [T_open, 2]], color: 'var(--bad)', w: 8},
        {pts: [[T_open, 2], [T_close, 2]], color: 'var(--ok)', w: 8},
        {pts: [[T_close, 2], [T_close * 1.3, 2]], color: 'var(--bad)', w: 8}
      ],
      vlines: [
        {x: T_open, color: 'var(--muted)', label: 'T_open ('+T_open+'ms)'},
        {x: T_close, color: 'var(--bad)', label: 'T_close ('+T_close+'ms)'},
        {x: wdtCurrentTime, color: 'var(--accent)', label: '當前 ' + wdtCurrentTime + 'ms', w: 2.5}
      ]
    });
  }

  function feedDogAction(){
    const T_open = +elWdtOpen.value;
    const T_close = +elWdtClose.value;
    const isKeyValid = elWdtAns.value === 'valid';

    if(wdtCurrentTime < T_open){
      logWdt.className = 'callout bad';
      logWdt.style.borderLeftColor = 'var(--bad)';
      logWdt.innerHTML = `<b>【嚴重安全違例】早餵故障 (Early Feed Fault)！</b> 於 ${wdtCurrentTime} ms 餵狗（小於開啟閥值 ${T_open} ms），看門狗硬體判定 CPU 程式跳躍跑飛，立即觸發 ASIL-C 系統強制復位中斷！`;
    } else if(wdtCurrentTime > T_close){
      logWdt.className = 'callout bad';
      logWdt.style.borderLeftColor = 'var(--bad)';
      logWdt.innerHTML = `<b>【嚴重安全違例】超時故障 (Late Timeout Fault)！</b> 於 ${wdtCurrentTime} ms 餵狗（超過安全極限 ${T_close} ms），MCU 主控死當未如期執行安全巡檢，看門狗拉低 RST 引腳重啟！`;
    } else if(!isKeyValid){
      logWdt.className = 'callout bad';
      logWdt.style.borderLeftColor = 'var(--bad)';
      logWdt.innerHTML = `<b>【問答金鑰錯誤】Challenge-Response 檢驗失敗！</b> 時間點 ${wdtCurrentTime} ms 雖在窗口內，但算出的金鑰與硬體期待值不符（模擬記憶體位元翻轉或任務丟失），判定為潛伏失效，觸發安全復位！`;
    } else {
      logWdt.className = 'callout good';
      logWdt.style.borderLeftColor = 'var(--ok)';
      logWdt.innerHTML = `<b>【餵狗成功】合法刷新！</b> 時間點 ${wdtCurrentTime} ms 位於窗口 [${T_open}, ${T_close}] 內且 SafeTlib 問答金鑰完全匹配，看門狗計時器清零重設，系統安全維持。`;
      wdtCurrentTime = 0;
    }
    renderWdt();
  }

  [elWdtOpen, elWdtClose, elWdtAns].forEach(el => el.addEventListener('input', renderWdt));
  if(btnWdtFeed) btnWdtFeed.addEventListener('click', feedDogAction);
  if(btnWdtReset) btnWdtReset.addEventListener('click', () => { wdtCurrentTime = 0; renderWdt(); });

  // Automatic increment timer for WDT tab
  setInterval(() => {
    const wdtTab = document.getElementById('tab-wdt');
    if(wdtTab && !wdtTab.hidden){
      wdtCurrentTime = (wdtCurrentTime + 5) % Math.round((+elWdtClose.value) * 1.35);
      renderWdt();
    }
  }, 150);

  /* ==================== 5. SINC3 FILTER ==================== */
  const elScOsr = document.getElementById('sc-osr');
  const elScOrder = document.getElementById('sc-order');
  const elScFmod = document.getElementById('sc-fmod');
  const mSc = document.getElementById('sc-metrics');

  function renderSinc(){
    const OSR = +elScOsr.value;
    const order = +elScOrder.value;
    const fmod = +elScFmod.value;

    const f_data = fmod / OSR; // Output sampling rate in Hz
    const nyquist = f_data / 2;

    // Sinc transfer function: H(f) = [ sin(pi * f / f_data) / (OSR * sin(pi * f / fmod)) ] ^ order
    function sincGainDb(f){
      if(f <= 0) return 0;
      const num = Math.sin(Math.PI * f / f_data);
      const den = OSR * Math.sin(Math.PI * f / fmod);
      if(Math.abs(den) < 1e-9) return 0;
      const ratio = Math.abs(num / den);
      return Math.max(-120, 20 * order * Math.log10(ratio));
    }

    const att50 = sincGainDb(50);
    const att60 = sincGainDb(60);

    mSc.innerHTML = `
      <div class="metric"><span class="lbl">調變器時脈 \(f_{\text{mod}}\)</span><div class="val">${(fmod/1e6).toFixed(3)}<span class="unit">MHz</span></div></div>
      <div class="metric"><span class="lbl">輸出數據率 (ODR)</span><div class="val good">${f_data.toFixed(1)}<span class="unit">SPS</span></div></div>
      <div class="metric"><span class="lbl">奈奎斯特頻寬</span><div class="val">${nyquist.toFixed(1)}<span class="unit">Hz</span></div></div>
      <div class="metric"><span class="lbl">50 Hz 工頻抑制</span><div class="val ${att50 < -40 ? 'good' : ''}">${att50.toFixed(1)}<span class="unit">dB</span></div></div>
      <div class="metric"><span class="lbl">60 Hz 工頻抑制</span><div class="val ${att60 < -40 ? 'good' : ''}">${att60.toFixed(1)}<span class="unit">dB</span></div></div>
      <div class="metric"><span class="lbl">硬體階數</span><div class="val">Sinc<sup>${order}</sup></div></div>
    `;

    const pts = [];
    for(let f = 1; f <= Math.min(2500, f_data * 2); f += 2){
      pts.push([f, sincGainDb(f)]);
    }

    const svg = document.getElementById('sc-plot');
    plot(svg, {
      W: 660, H: 260, x: [1, Math.min(2500, f_data * 2)], y: [-100, 5], xlabel: '頻率 Frequency (Hz)', ylabel: '增益振幅 (dB)',
      series: [{pts: pts, color: 'var(--analog)', w: 2.2}],
      vlines: [
        {x: 50, color: 'var(--warn)', label: '50Hz (' + att50.toFixed(0) + 'dB)'},
        {x: 60, color: 'var(--bad)', label: '60Hz (' + att60.toFixed(0) + 'dB)'},
        {x: f_data, color: 'var(--muted)', label: '陷波零點 ' + f_data.toFixed(0) + 'Hz'}
      ],
      hlines: [{y: -40, color: 'var(--muted)', label: '-40 dB 基準線'}]
    });
  }

  [elScOsr, elScOrder, elScFmod].forEach(el => el.addEventListener('input', renderSinc));

  /* ==================== 6. ECC INJECTION ==================== */
  const elEccBits = document.getElementById('ecc-bits');
  const btnEccFlip1 = document.getElementById('ecc-flip1');
  const btnEccFlip2 = document.getElementById('ecc-flip2');
  const btnEccClean = document.getElementById('ecc-clean');
  const mEcc = document.getElementById('ecc-metrics');
  const rptEcc = document.getElementById('ecc-report');
  const codeEcc = document.getElementById('ecc-code');

  let eccWord = 0xA55AA55A; // 32-bit test pattern
  let errorMask = 0; // bit mask of flipped bits

  function renderEcc(){
    elEccBits.innerHTML = '';
    const flippedIndices = [];
    for(let i = 31; i >= 0; i--){
      const isFlipped = ((errorMask >> i) & 1) === 1;
      if(isFlipped) flippedIndices.push(i);
      const b = document.createElement('button');
      b.className = 'btn' + (isFlipped ? ' pri' : '');
      b.style.padding = '4px 0';
      b.style.fontSize = '11px';
      b.style.fontFamily = 'var(--mono)';
      b.textContent = 'b' + i;
      b.title = '點擊翻轉位元 ' + i;
      b.addEventListener('click', () => {
        errorMask ^= (1 << i);
        renderEcc();
      });
      elEccBits.appendChild(b);
    }

    const flippedCount = flippedIndices.length;
    let statusText = '';
    let statusClass = 'good';

    if(flippedCount === 0){
      statusText = '<b>【資料完整無誤】</b> SECDED 症狀碼（Syndrome）= 0x00，未檢出任何錯誤。SRAM 讀取延遲 0 週期。';
      statusClass = 'good';
    } else if(flippedCount === 1){
      const bitPos = flippedIndices[0];
      statusText = `<b>【單粒子翻轉已自動修復】Single-Bit Error Detected!</b> 於位元 [b${bitPos}] 檢測到翻轉。硬體 Hamming Code 單週期自動糾正並寫回 SRAM，記錄於 <code>ECC_SYNDROME</code> 暫存器，不中斷 CPU 正常運作。`;
      statusClass = 'warn';
    } else if(flippedCount === 2){
      statusText = `<b>【雙位元嚴重故障】Double-Bit Error Detected (Uncorrectable)!</b> 檢測到位元 [b${flippedIndices.join(', b')}] 同時翻轉。超出漢明碼糾正極限，硬體 SECDED 立即觸發最高優先級 <b>NMI (非遮蔽中斷)</b>，執行緊急停機保護！`;
      statusClass = 'bad';
    } else {
      statusText = `<b>【多重嚴重位元翻轉】Multiple Bit Errors (${flippedCount} bits)!</b> 記憶體損毀嚴重，觸發硬體安全故障鎖死。`;
      statusClass = 'bad';
    }

    mEcc.innerHTML = `
      <div class="metric"><span class="lbl">原始 32-bit 資料</span><div class="val mono">0x${(eccWord >>> 0).toString(16).toUpperCase()}</div></div>
      <div class="metric"><span class="lbl">注入故障位元數</span><div class="val ${flippedCount > 1 ? 'bad' : (flippedCount === 1 ? 'warn' : 'good')}">${flippedCount}</div></div>
      <div class="metric"><span class="lbl">附加 ECC 校驗位元</span><div class="val">7 Bits (SECDED)</div></div>
      <div class="metric"><span class="lbl">硬體處置動作</span><div class="val">${flippedCount === 0 ? '正常透傳' : (flippedCount === 1 ? '單週期自動修正' : '觸發 NMI 中斷')}</div></div>
    `;

    rptEcc.style.borderLeftColor = statusClass === 'good' ? 'var(--ok)' : (statusClass === 'warn' ? 'var(--warn)' : 'var(--bad)');
    rptEcc.innerHTML = statusText;

    codeEcc.textContent = `// 暫存器即時映射 (Memory-Mapped IO Status)
#define CY_CPUSS_ECC_STATUS    (*((volatile uint32_t*)0x40210080))
#define CY_CPUSS_ECC_SYNDROME  (*((volatile uint32_t*)0x40210084))

Status:   0x${(flippedCount === 0 ? 0x00 : (flippedCount === 1 ? 0x01 : 0x03)).toString(16).padStart(8,'0')} [${flippedCount <= 1 ? 'CORRECTABLE' : 'FATAL_NMI'}]
Syndrome: 0x${(flippedCount === 1 ? (1 << (flippedIndices[0] % 7)).toString(16).padStart(8,'0') : '00000000')}
Bit Mask: 0x${((errorMask >>> 0).toString(16).toUpperCase().padStart(8,'0'))}`;
  }

  if(btnEccFlip1) btnEccFlip1.addEventListener('click', () => {
    errorMask = (1 << Math.floor(Math.random() * 32));
    renderEcc();
  });
  if(btnEccFlip2) btnEccFlip2.addEventListener('click', () => {
    const b1 = Math.floor(Math.random() * 32);
    let b2 = Math.floor(Math.random() * 32);
    while(b2 === b1) b2 = Math.floor(Math.random() * 32);
    errorMask = (1 << b1) | (1 << b2);
    renderEcc();
  });
  if(btnEccClean) btnEccClean.addEventListener('click', () => {
    errorMask = 0;
    renderEcc();
  });

  /* ==================== 7. LIN BUS ==================== */
  const elLinId = document.getElementById('lin-id');
  const elLinIdO = document.getElementById('lin-id-o');
  const elLinBaud = document.getElementById('lin-baud');
  const elLinD0 = document.getElementById('lin-d0');
  const elLinD1 = document.getElementById('lin-d1');
  const elLinD2 = document.getElementById('lin-d2');
  const elLinD3 = document.getElementById('lin-d3');
  const mLin = document.getElementById('lin-metrics');

  function renderLin(){
    const id = +elLinId.value;
    const baud = +elLinBaud.value;
    const d0 = +elLinD0.value & 0xFF;
    const d1 = +elLinD1.value & 0xFF;
    const d2 = +elLinD2.value & 0xFF;
    const d3 = +elLinD3.value & 0xFF;

    elLinIdO.textContent = '0x' + id.toString(16).toUpperCase().padStart(2, '0') + ` (${id})`;

    // Calculate PID parity bits P0 and P1
    const p0 = ((id >> 0) ^ (id >> 1) ^ (id >> 2) ^ (id >> 4)) & 1;
    const p1 = ~((id >> 1) ^ (id >> 3) ^ (id >> 4) ^ (id >> 5)) & 1;
    const pid = (id & 0x3F) | (p0 << 6) | (p1 << 7);

    // Enhanced Checksum: sum with carry of PID + Data bytes
    let sum = pid + d0 + d1 + d2 + d3;
    while(sum > 0xFF) sum = (sum & 0xFF) + (sum >> 8);
    const checksum = (~sum) & 0xFF;

    const bitTime_us = 1e6 / baud;
    const totalBits = 13 + 1 + 10 + 10 + 10*4 + 10; // Break, Delimiter, Synch, PID, 4 Data bytes, Checksum
    const frameTime_ms = (totalBits * bitTime_us) / 1e3;

    mLin.innerHTML = `
      <div class="metric"><span class="lbl">Protected ID (PID)</span><div class="val mono">0x${pid.toString(16).toUpperCase().padStart(2,'0')}</div></div>
      <div class="metric"><span class="lbl">Enhanced Checksum</span><div class="val mono good">0x${checksum.toString(16).toUpperCase().padStart(2,'0')}</div></div>
      <div class="metric"><span class="lbl">傳輸鮑率</span><div class="val">${(baud/1e3).toFixed(1)}<span class="unit">kbps</span></div></div>
      <div class="metric"><span class="lbl">位元時間 (1-bit)</span><div class="val">${bitTime_us.toFixed(1)}<span class="unit">µs</span></div></div>
      <div class="metric"><span class="lbl">整訊框持續時間</span><div class="val">${frameTime_ms.toFixed(2)}<span class="unit">ms</span></div></div>
      <div class="metric"><span class="lbl">斜率控制 (Slew Rate)</span><div class="val">1.5<span class="unit">V/µs</span></div></div>
    `;

    // Generate physical waveform
    const pts = [];
    const bitStream = [];
    // Synch Break: 13 zeros
    for(let i=0; i<13; i++) bitStream.push(0);
    // Break Delimiter: 1 one
    bitStream.push(1);
    // Synch byte 0x55 (LSB first: start 0, 1, 0, 1, 0, 1, 0, 1, 0, stop 1)
    bitStream.push(0, 1, 0, 1, 0, 1, 0, 1, 0, 1);
    // PID
    bitStream.push(0);
    for(let i=0; i<8; i++) bitStream.push((pid >> i) & 1);
    bitStream.push(1);
    // 4 Data bytes
    [d0, d1, d2, d3].forEach(db => {
      bitStream.push(0);
      for(let i=0; i<8; i++) bitStream.push((db >> i) & 1);
      bitStream.push(1);
    });
    // Checksum byte
    bitStream.push(0);
    for(let i=0; i<8; i++) bitStream.push((checksum >> i) & 1);
    bitStream.push(1);

    // Plot waveform with slew-rate trapezoid
    let t = 0;
    bitStream.slice(0, 45).forEach((b, idx) => {
      const v = b === 1 ? 12.0 : 0.8;
      pts.push([t, v]);
      pts.push([t + bitTime_us * 0.9, v]);
      t += bitTime_us;
    });

    const svg = document.getElementById('lin-plot');
    plot(svg, {
      W: 660, H: 220, x: [0, t], y: [0, 14], xlabel: '時間 (µs)', ylabel: 'LIN 單線電平 (V)',
      series: [{pts: pts, color: 'var(--warn)', w: 2.2}],
      hlines: [
        {y: 12, color: 'var(--muted)', label: '隱性 Recessive (12V)'},
        {y: 1, color: 'var(--muted)', label: '顯性 Dominant (GND)'}
      ]
    });
  }

  [elLinId, elLinBaud, elLinD0, elLinD1, elLinD2, elLinD3].forEach(el => el.addEventListener('input', renderLin));

  /* ==================== 8. ANALOG TRIMMING & YIELD ==================== */
  const elTrSigma = document.getElementById('tr-sigma');
  const elTrSigmaO = document.getElementById('tr-sigma-o');
  const elTrBits = document.getElementById('tr-bits');
  const elTrSpec = document.getElementById('tr-spec');
  const elTrSpecO = document.getElementById('tr-spec-o');
  const mTr = document.getElementById('tr-metrics');

  function renderTrim(){
    const sigma = +elTrSigma.value; // µV raw sigma
    const bits = +elTrBits.value;
    const spec = +elTrSpec.value; // µV spec limit

    elTrSigmaO.textContent = sigma + ' µV';
    elTrSpecO.textContent = '±' + spec + ' µV';

    // Raw yield: P(-spec <= X <= spec) where X ~ N(0, sigma)
    const rawYield = (Phi(spec / sigma) - Phi(-spec / sigma)) * 100;

    // With trimming: trim step = (6 * sigma) / (2^bits)
    let trimYield = rawYield;
    let residualSigma = sigma;
    let stepSize_uV = 0;

    if(bits > 0){
      const steps = Math.pow(2, bits);
      stepSize_uV = (sigma * 4) / steps;
      residualSigma = stepSize_uV / Math.sqrt(12); // Quantization residual sigma
      trimYield = (Phi(spec / residualSigma) - Phi(-spec / residualSigma)) * 100;
      trimYield = Math.min(99.99, Math.max(rawYield, trimYield));
    }

    mTr.innerHTML = `
      <div class="metric"><span class="lbl">未修調原始良率</span><div class="val ${rawYield < 80 ? 'bad' : 'warn'}">${rawYield.toFixed(1)}<span class="unit">%</span></div></div>
      <div class="metric"><span class="lbl">eFuse 修調後成品良率</span><div class="val good">${trimYield.toFixed(2)}<span class="unit">%</span></div></div>
      <div class="metric"><span class="lbl">修調檔位解析度</span><div class="val mono">${bits === 0 ? '未啟用' : `${bits}-bit (${Math.pow(2,bits)} 檔)`}</div></div>
      <div class="metric"><span class="lbl">修調步進電壓</span><div class="val">${stepSize_uV.toFixed(2)}<span class="unit">µV</span></div></div>
      <div class="metric"><span class="lbl">殘餘殘留標準差</span><div class="val">${residualSigma.toFixed(1)}<span class="unit">µV</span></div></div>
      <div class="metric"><span class="lbl">良率淨提升</span><div class="val good">+${(trimYield - rawYield).toFixed(1)}<span class="unit">%</span></div></div>
    `;

    // Gaussian curve comparison
    const ptsRaw = [];
    const ptsTrim = [];
    const maxVal = Math.max(sigma * 2.5, spec * 2);

    for(let x = -maxVal; x <= maxVal; x += maxVal / 60){
      const gRaw = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x / sigma, 2)) * 1000;
      const gTrim = (1 / (residualSigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x / residualSigma, 2)) * 1000;
      ptsRaw.push([x, gRaw]);
      ptsTrim.push([x, gTrim]);
    }

    const svg = document.getElementById('tr-plot');
    plot(svg, {
      W: 660, H: 260, x: [-maxVal, maxVal], y: [0, Math.max(...ptsTrim.map(p=>p[1])) * 1.1],
      xlabel: 'ADC 偏移電壓 Offset (µV)', ylabel: '機率密度 (相對高度)',
      series: [
        {pts: ptsRaw, color: 'var(--bad)', w: 2},
        {pts: ptsTrim, color: 'var(--ok)', w: 2.5}
      ],
      vlines: [
        {x: -spec, color: 'var(--muted)', label: '-Spec (-' + spec + 'µV)'},
        {x: spec, color: 'var(--muted)', label: '+Spec (+' + spec + 'µV)'}
      ]
    });
  }

  [elTrSigma, elTrBits, elTrSpec].forEach(el => el.addEventListener('input', renderTrim));

  // Initialize first tab
  renderShunt();
})();