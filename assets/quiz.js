/* MCU Notes · Quiz bank (60 bilingual questions) & grading.
   Each item: ch, q:[zh,en], o:[[zh,en]…] (first option is correct; display order is shuffled), e:[zh,en], l: link. */
(function(){
  const EN = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const t = (zh, en) => EN ? en : zh;
  const L = p => p;   // links are relative to the current language folder

  const Q = [
    /* ---------- Chapter 1 · Core ---------- */
    {ch:'core', q:['Arm Cortex-M0+ 採用幾級管線？', 'How many pipeline stages does the Arm Cortex-M0+ have?'],
      o:[['2 級（Fetch、Execute）', '2 (fetch, execute)'], ['3 級', '3'], ['5 級', '5'], ['單級', '1']],
      e:['Cortex-M0+ 把 Cortex-M0 的 3 級管線縮短為 2 級，降低分支懲罰與每指令能耗。', 'The M0+ shortens the M0’s 3-stage pipeline to 2, cutting branch penalty and energy per instruction.'], l:'core.html#cortex-m0plus-details'},
    {ch:'core', q:['依資料手冊，PSoC™ 4 HVPA-144K 的 CPU 最高時脈為何？', 'Per the datasheet, what is the maximum CPU clock of the PSoC™ 4 HVPA-144K?'],
      o:[['24 或 48 MHz（依料號）', '24 or 48 MHz (part-dependent)'], ['16 MHz', '16 MHz'], ['100 MHz', '100 MHz'], ['200 MHz', '200 MHz']],
      e:['資料手冊：24 或 48 MHz Arm Cortex-M0+，視訂購料號而定。', 'Datasheet: 24- or 48-MHz Arm Cortex-M0+, depending on the orderable part.'], l:'core.html#cortex-m0plus-details'},
    {ch:'core', q:['32 位元資料要做到 SECDED，至少需要幾個檢查位元？', 'How many check bits does SECDED need for 32-bit data?'],
      o:[['7（6 個 Hamming + 1 個整體同位）', '7 (6 Hamming + 1 overall parity)'], ['4', '4'], ['5', '5'], ['16', '16']],
      e:['2^p ≥ k + p + 1，k = 32 時 p = 6；再加 1 個整體同位位元做雙錯偵測。', '2^p ≥ k + p + 1 gives p = 6 for k = 32; one more overall-parity bit adds double-error detection.'], l:'core.html#memory-ecc'},
    {ch:'core', q:['HVPA 讀取到單一位元 ECC 錯誤時會怎麼處理？', 'What does the HVPA do on a single-bit ECC error during a read?'],
      o:[['讀取路徑即時修正，並記錄錯誤位址與資料', 'Corrects it in-line and logs the error address and data'], ['立即重置晶片', 'Resets the device immediately'], ['忽略錯誤', 'Ignores it'], ['停止 CPU 直到重新上電', 'Halts the CPU until power-cycle']],
      e:['資料手冊：單一位元錯誤在線修正，錯誤資訊（位址與資料）被保存。', 'Datasheet: single-bit errors are corrected in-line and the error information (address and data) is stored.'], l:'core.html#memory-ecc'},
    {ch:'core', q:['HVPA 的 DMA 控制器有幾個通道？', 'How many channels does the HVPA DMA controller have?'],
      o:[['8 個，支援可串接的 ping-pong 描述符', '8, with chainable ping-pong descriptors'], ['2 個', '2'], ['16 個', '16'], ['沒有 DMA', 'No DMA']],
      e:['資料手冊：8 通道、32 位元傳輸、可串接 ping-pong 描述符，CPU 睡眠時也能傳輸。', 'Datasheet: 8 channels, 32-bit transfers, chainable ping-pong descriptors, works while the CPU sleeps.'], l:'core.html#bus-matrix'},
    {ch:'core', q:['無週期喚醒時，HVPA Deep Sleep 的典型 VBAT 電流約多少？', 'Typical VBAT current in Deep Sleep without periodic wake-up?'],
      o:[['35 µA（最大 60 µA）', '35 µA (60 µA max)'], ['1 µA', '1 µA'], ['5 mA', '5 mA'], ['500 µA', '500 µA']],
      e:['資料手冊 SID17A.3：35 µA typ / 60 µA max；含每秒喚醒量測時為 85 µA typ。', 'Datasheet SID17A.3: 35 µA typ / 60 µA max; 85 µA typ with once-per-second measurement.'], l:'core.html#clock-power'},
    {ch:'core', q:['從 Deep Sleep 喚醒的最長時間為何？', 'What is the maximum wake-up time from Deep Sleep?'],
      o:[['35 µs', '35 µs'], ['35 ms', '35 ms'], ['1 s', '1 s'], ['35 ns', '35 ns']],
      e:['資料手冊 SID22：t<sub>DEEPSLEEP</sub> 最大 35 µs。', 'Datasheet SID22: t<sub>DEEPSLEEP</sub> max 35 µs.'], l:'core.html#clock-power'},
    {ch:'core', q:['HVPA 的看門狗計時器由哪個時脈驅動？', 'Which clock drives the HVPA watchdog timers?'],
      o:[['32 kHz 精密低功耗振盪器 PILO', '32 kHz precision low-power oscillator (PILO)'], ['48 MHz IMO', '48 MHz IMO'], ['外部石英', 'External crystal'], ['CPU 時脈', 'CPU clock']],
      e:['資料手冊：PILO 驅動低功耗數位區塊，包括看門狗與 lifetime counter。另有 40 kHz ILO。', 'Datasheet: the PILO clocks low-power digital blocks including the watchdogs and lifetime counter; a separate 40 kHz ILO also exists.'], l:'core.html#clock-power'},
    {ch:'core', q:['Cortex-M0+ NVIC 有幾個可程式優先等級？', 'How many programmable priority levels does the Cortex-M0+ NVIC have?'],
      o:[['4 個（2 位元）', '4 (2 bits)'], ['16 個', '16'], ['256 個', '256'], ['只有 1 個', 'Only 1']],
      e:['ARMv6-M 實作 2 個優先位元，即 4 個等級（Cortex-M0 也相同）。', 'ARMv6-M implements 2 priority bits, i.e. 4 levels (the same as Cortex-M0).'], l:'core.html#cortex-m0plus-details'},
    {ch:'core', q:['Cortex-M0+ 中斷進入的典型延遲（零等待記憶體）是幾個週期？', 'Typical Cortex-M0+ interrupt entry latency with zero-wait-state memory?'],
      o:[['15 個週期', '15 cycles'], ['1 個週期', '1 cycle'], ['100 個週期', '100 cycles'], ['依軟體而定，無固定值', 'Software-defined, not fixed']],
      e:['Arm 規格：Cortex-M0+ 中斷延遲 15 個週期（零等待狀態）。快閃等待狀態會增加延遲。', 'Arm spec: 15-cycle interrupt latency (zero wait states). Flash wait states add to it.'], l:'core.html#cortex-m0plus-details'},

    /* ---------- Chapter 2 · Analog ---------- */
    {ch:'analog', q:['HVPA 用哪種 ADC 量測分流器電流？', 'Which ADC type does the HVPA use for shunt current?'],
      o:[['兩顆 ΔΣ ADC（16–20+ 位元）', 'Two ΔΣ ADCs (16–20+ bits)'], ['12 位元 SAR', '12-bit SAR'], ['Flash ADC', 'Flash ADC'], ['雙斜率積分', 'Dual-slope']],
      e:['資料手冊：兩顆精密 ΔΣ ADC，含電流、電壓、溫度與診斷通道。', 'Datasheet: two precision ΔΣ ADCs serving current, voltage, temperature and diagnostic channels.'], l:'analog.html#delta-sigma-schematic'},
    {ch:'analog', q:['電流通道的增益範圍為何？', 'What is the current-channel gain range?'],
      o:[['1 至 512', '1 to 512'], ['1 至 64', '1 to 64'], ['固定 8 倍', 'Fixed 8×'], ['1 至 4', '1 to 4']],
      e:['資料手冊：電流通道增益 1–512，可由 AGC 自動切換。', 'Datasheet: current-channel gain 1–512, switched automatically by the AGC.'], l:'analog.html#agc-scaler'},
    {ch:'analog', q:['100 µΩ 分流器流過 10 mA，跨壓是多少？', 'A 100 µΩ shunt carries 10 mA. What is the voltage across it?'],
      o:[['1 µV', '1 µV'], ['1 mV', '1 mV'], ['10 mV', '10 mV'], ['0.1 µV', '0.1 µV']],
      e:['V = I·R = 0.01 A × 0.0001 Ω = 1 µV，因此需要極低偏移的前端。', 'V = I·R = 0.01 A × 0.0001 Ω = 1 µV, which is why an ultra-low-offset front end is needed.'], l:'analog.html#kelvin-filter'},
    {ch:'analog', q:['資料手冊範例中，電流通道正規化後 1 LSB 的權重是多少？', 'In the datasheet example, what is the normalised current LSB?'],
      o:[['0.715 mA', '0.715 mA'], ['1 A', '1 A'], ['7.15 µA', '7.15 µA'], ['71.5 mA', '71.5 mA']],
      e:['Scaler 把結果乘上 512/G，LSB 固定為最高增益時的 0.715 mA（對應 100 µΩ）。', 'The scaler multiplies by 512/G so the LSB stays at the max-gain weight of 0.715 mA (100 µΩ).'], l:'analog.html#agc-scaler'},
    {ch:'analog', q:['電壓通道 24 倍分壓時的滿量程為何？', 'What is the voltage-channel full scale with the 24× divider?'],
      o:[['28.8 V（1.2 V × 24）', '28.8 V (1.2 V × 24)'], ['12 V', '12 V'], ['42 V', '42 V'], ['5 V', '5 V']],
      e:['ADC 滿量程 1.2 V；24× → 28.8 V，16× → 19.2 V。', 'ADC full scale is 1.2 V; 24× → 28.8 V, 16× → 19.2 V.'], l:'analog.html#hv-pmic-schematic'},
    {ch:'analog', q:['為什麼抽取濾波器用 Sinc³？', 'Why is a Sinc³ decimator used?'],
      o:[['比二階調變器高一階，才能有效濾除被整形到高頻的量化雜訊', 'It is one order above the second-order modulator, enough to remove the shaped quantisation noise'], ['為了省下 Flash', 'To save flash'], ['因為 Sinc³ 沒有零點', 'Because Sinc³ has no nulls'], ['為了提高 CPU 時脈', 'To raise the CPU clock']],
      e:['資料手冊：連續轉換需比調變器高一階的 Sinc³ 抽取器以維持穩定。', 'Datasheet: continuous conversion needs a Sinc³ decimator, one order higher than the modulator.'], l:'analog.html#decimation-chain'},
    {ch:'analog', q:['要同時陷除 50 Hz 與 60 Hz，平均視窗應為多長？', 'To null both 50 Hz and 60 Hz, how long should the averaging window be?'],
      o:[['100 ms 的整數倍', 'A multiple of 100 ms'], ['1 ms', '1 ms'], ['50 ms', '50 ms'], ['16.7 ms', '16.7 ms']],
      e:['平均 T 秒的零點在 1/T 的倍數；T = 100 ms → 10 Hz 倍數，同時涵蓋 50 與 60 Hz。', 'Averaging over T puts nulls at multiples of 1/T; T = 100 ms → multiples of 10 Hz, covering both.'], l:'analog.html#decimation-chain'},
    {ch:'analog', q:['斬波穩零（chopping）可以消除哪一項？', 'What does chopper stabilisation remove?'],
      o:[['放大器自身的偏移與 1/f 雜訊', 'The amplifier’s own offset and 1/f noise'], ['分流器的 Seebeck 熱電勢', 'Seebeck thermo-EMF at the shunt'], ['分流器 TCR 誤差', 'Shunt TCR error'], ['電池內阻', 'Battery internal resistance']],
      e:['熱電勢是分流器上的真實輸入電壓，斬波無法區分；只有放大器內部誤差會被調變到高頻。', 'Thermo-EMF is a real input at the shunt; chopping only moves the amplifier’s internal errors to high frequency.'], l:'analog.html#chopper-pga'},
    {ch:'analog', q:['HVPA 高壓穩壓器的 VBAT 工作範圍是？', 'What is the VBAT operating range of the HVPA HV regulator?'],
      o:[['3.6–28 V，可運作至 42 V', '3.6–28 V, functional up to 42 V'], ['5–60 V', '5–60 V'], ['1.8–3.6 V', '1.8–3.6 V'], ['只能接 5 V', '5 V only']],
      e:['資料手冊：VBAT 3.6–28 V 輸入產生 3.3 V；42 V 為絕對最大值。VBAT < 4 V 時 VDDD 可能降至 2.7 V。', 'Datasheet: 3.6–28 V input generating 3.3 V; 42 V is the absolute maximum. VDDD may drop to 2.7 V when VBAT < 4 V.'], l:'analog.html#hv-pmic-schematic'},
    {ch:'analog', q:['四線凱爾文（Kelvin）連接的主要目的？', 'Main purpose of a 4-wire Kelvin connection?'],
      o:[['讓量測線不流大電流，排除焊點與走線電阻', 'Keep sense lines out of the current path, excluding solder and trace resistance'], ['提高電流容量', 'Increase current capacity'], ['降低成本', 'Reduce cost'], ['做為保險絲', 'Act as a fuse']],
      e:['100 µΩ 分流器的焊點電阻可能比本體大，量測必須直接取自電阻本體。', 'Solder joints can exceed a 100 µΩ shunt’s value; sensing must come straight from the resistor body.'], l:'analog.html#kelvin-filter'},

    /* ---------- Chapter 3 · BMS application ---------- */
    {ch:'app', q:['IBS 通常安裝在哪裡？', 'Where is an IBS usually mounted?'],
      o:[['電瓶負極極柱夾具上', 'On the battery negative-terminal clamp'], ['儀表板後方', 'Behind the dashboard'], ['排氣管', 'On the exhaust'], ['前保險桿', 'In the front bumper']],
      e:['安裝在負極端可同時量測電流、電壓與端子溫度，且分流器位於低側。', 'At the negative terminal it measures current, voltage and terminal temperature, with the shunt on the low side.'], l:'application.html#ibs-schematic'},
    {ch:'app', q:['庫倫積分法最主要的弱點？', 'Main weakness of Coulomb counting?'],
      o:[['電流偏移會隨時間積分累積', 'Current offset integrates over time'], ['計算量太大', 'Too much computation'], ['只適用鋰電池', 'Only works for Li-ion'], ['與 LIN 不相容', 'Incompatible with LIN']],
      e:['即使很小的偏移也會變成持續的虛假電流，必須定期以 OCV 等方法重新定錨。', 'Even a tiny offset becomes a constant phantom current and must be re-anchored, e.g. with OCV.'], l:'application.html#soc-coulomb-detail'},
    {ch:'app', q:['10 µV 偏移在 100 µΩ 分流器上相當於多少虛假電流？', 'A 10 µV offset on a 100 µΩ shunt equals what phantom current?'],
      o:[['100 mA', '100 mA'], ['1 mA', '1 mA'], ['10 A', '10 A'], ['1 µA', '1 µA']],
      e:['I = V/R = 10 µV / 100 µΩ = 0.1 A；停放 30 天就是 72 Ah。', 'I = V/R = 10 µV / 100 µΩ = 0.1 A; over 30 days that is 72 Ah.'], l:'application.html#soc-coulomb-detail'},
    {ch:'app', q:['何時適合用開路電壓（OCV）校正 SoC？', 'When is OCV-based SoC correction valid?'],
      o:[['電池靜置數小時、電流接近零時', 'After hours of rest with near-zero current'], ['引擎全速時', 'At full engine speed'], ['冷啟動瞬間', 'During cranking'], ['快充中', 'While fast charging']],
      e:['極化需時間消散；鉛酸電池通常需數小時靜置才能讀到可信 OCV。', 'Polarisation must decay; lead-acid usually needs hours of rest for a trustworthy OCV.'], l:'application.html#soc-coulomb-detail'},
    {ch:'app', q:['冷啟動時如何估算電池內阻？', 'How is internal resistance estimated during cranking?'],
      o:[['同步量測 ΔV 與 ΔI，R = ΔV/ΔI', 'Sample ΔV and ΔI synchronously, R = ΔV/ΔI'], ['看里程數', 'From mileage'], ['注入 2.4 GHz 訊號', 'Inject a 2.4 GHz signal'], ['看輪胎轉速', 'From wheel speed']],
      e:['啟動馬達提供大電流步階激勵，兩顆 ADC 同步取樣使 ΔV/ΔI 對齊。', 'The starter gives a large current step; two synchronised ADCs keep ΔV and ΔI aligned.'], l:'application.html#soh-impedance-detail'},
    {ch:'app', q:['LIN Sync 欄位 0x55 的用途？', 'Purpose of the LIN sync field 0x55?'],
      o:[['讓從節點量測位元時間、校準鮑率', 'Lets slaves measure bit time and calibrate baud rate'], ['加密', 'Encryption'], ['傳送故障碼', 'Carry fault codes'], ['指示引擎轉速', 'Indicate engine speed']],
      e:['0x55 提供交替的邊緣，RC 振盪器的從節點可據此同步。', '0x55 provides alternating edges so RC-clocked slaves can synchronise.'], l:'application.html#lin-bus'},
    {ch:'app', q:['LIN PID 由什麼組成？', 'What does a LIN PID contain?'],
      o:[['6 位元 ID + 2 個同位位元', '6-bit ID + 2 parity bits'], ['8 位元 ID', '8-bit ID'], ['4 位元 ID + CRC', '4-bit ID + CRC'], ['ID + 時間戳記', 'ID + timestamp']],
      e:['P0 = ID0⊕ID1⊕ID2⊕ID4，P1 = ¬(ID1⊕ID3⊕ID4⊕ID5)。', 'P0 = ID0⊕ID1⊕ID2⊕ID4, P1 = ¬(ID1⊕ID3⊕ID4⊕ID5).'], l:'application.html#lin-bus'},
    {ch:'app', q:['LIN 2.x Enhanced checksum 與 Classic 的差別？', 'Difference between LIN 2.x enhanced and classic checksum?'],
      o:[['Enhanced 把 PID 一起計入；診斷訊框 0x3C/0x3D 仍用 Classic', 'Enhanced includes the PID; diagnostic frames 0x3C/0x3D still use classic'], ['Enhanced 是 CRC-16', 'Enhanced is CRC-16'], ['沒有差別', 'No difference'], ['Classic 只算 PID', 'Classic covers only the PID']],
      e:['兩者都是帶進位加總後取反，差在是否包含 PID。', 'Both are inverted carry sums; the difference is whether the PID is included.'], l:'application.html#lin-bus'},
    {ch:'app', q:['接觸器 PWM 節能驅動（economizer）的原理？', 'How does a contactor PWM economiser work?'],
      o:[['吸合後只需較小的保持電流，以 PWM 降低線圈功耗', 'After pull-in only a smaller hold current is needed, so PWM cuts coil power'], ['提高吸合電壓', 'Raises pull-in voltage'], ['取代保險絲', 'Replaces the fuse'], ['降低觸點電阻', 'Lowers contact resistance']],
      e:['保持電流通常只需吸合電流的一部分，可大幅降低發熱。', 'Hold current is a fraction of pull-in current, greatly reducing heating.'], l:'application.html#bdu-circuit'},
    {ch:'app', q:['線圈關斷時用齊納箝位而不是只用續流二極體，好處是？', 'Benefit of a Zener clamp over a plain flyback diode at coil turn-off?'],
      o:[['較高的反向電壓讓線圈電流更快衰減，觸點更快打開', 'The higher reverse voltage decays coil current faster, so contacts open faster'], ['完全不發熱', 'No heating at all'], ['降低成本', 'Lower cost'], ['讓接觸器吸合更快', 'Faster pull-in']],
      e:['dI/dt = −V/L；箝位電壓越高，能量釋放越快，縮短拉弧時間。', 'dI/dt = −V/L; a higher clamp voltage releases the energy faster and shortens arcing.'], l:'application.html#bdu-circuit'},

    /* ---------- Chapter 4 · Process ---------- */
    {ch:'fab', q:['BCD 製程整合哪三類元件？', 'Which three device families does BCD integrate?'],
      o:[['Bipolar、CMOS、DMOS', 'Bipolar, CMOS, DMOS'], ['BGA、CSP、DIP', 'BGA, CSP, DIP'], ['電池、電容、二極體', 'Battery, capacitor, diode'], ['藍牙、CAN、DRAM', 'Bluetooth, CAN, DRAM']],
      e:['精密類比用 Bipolar、邏輯與記憶體用 CMOS、高壓功率用 DMOS。', 'Bipolar for precision analog, CMOS for logic/memory, DMOS for high-voltage power.'], l:'process.html#bcd-technology'},
    {ch:'fab', q:['深溝槽隔離（DTI）的主要作用？', 'Main role of deep trench isolation (DTI)?'],
      o:[['阻隔高壓區向敏感類比區的基板耦合與閂鎖', 'Block substrate coupling and latch-up from HV blocks into sensitive analog'], ['儲存資料', 'Store data'], ['加速微影', 'Speed up lithography'], ['增加機械強度', 'Add mechanical strength']],
      e:['DTI 以介電質牆切斷少數載子與基板雜訊的路徑。', 'DTI uses dielectric walls to cut minority-carrier and substrate-noise paths.'], l:'process.html#isolation-dti'},
    {ch:'fab', q:['拋負載（load dump）的成因？', 'What causes a load dump?'],
      o:[['發電機充電中電瓶突然斷開，磁場能量釋放', 'The battery disconnects while the alternator is charging, releasing field energy'], ['輪胎靜電', 'Tyre static'], ['火星塞點火', 'Spark plugs firing'], ['雨刷馬達', 'Wiper motor']],
      e:['發電機勵磁無法瞬間降下，輸出電壓在數百毫秒內大幅上升。', 'The alternator field cannot collapse instantly, so its output rises for hundreds of ms.'], l:'process.html#active-clamp-circuit'},
    {ch:'fab', q:['ISO 16750-2 的 Load dump Test B 是什麼？', 'What is ISO 16750-2 load dump Test B?'],
      o:[['具中央抑制（發電機內箝位）的拋負載，峰值被限制在 U<sub>s</sub>*', 'A centrally suppressed load dump, clamped to U<sub>s</sub>*'], ['未抑制拋負載', 'Unsuppressed load dump'], ['ESD 測試', 'An ESD test'], ['冷啟動測試', 'A cold-crank test']],
      e:['Test A 未抑制（12 V 系統 U<sub>s</sub> 79–101 V）；Test B 由發電機內抑制，12 V 系統 U<sub>s</sub>* 常為 35 V。', 'Test A is unsuppressed (12 V: U<sub>s</sub> 79–101 V); Test B is suppressed in the alternator, U<sub>s</sub>* typically 35 V for 12 V.'], l:'process.html#active-clamp-circuit'},
    {ch:'fab', q:['HVPA VBAT 腳的絕對最大額定電壓？', 'Absolute maximum rating of the HVPA VBAT pin?'],
      o:[['42 V', '42 V'], ['28 V', '28 V'], ['60 V', '60 V'], ['100 V', '100 V']],
      e:['資料手冊 SIDA5：VBAT −0.3 V 至 42 V。', 'Datasheet SIDA5: VBAT −0.3 V to 42 V.'], l:'process.html#active-clamp-circuit'},
    {ch:'fab', q:['資料手冊對高壓脈衝保護的說法？', 'What does the datasheet say about protection from high-voltage pulses?'],
      o:[['可能需要外部保護（串聯電阻、二極體、TVS）', 'External protection (series R, diode, TVS) may be required'], ['晶片內建箝位，不需任何外部元件', 'An on-chip clamp makes external parts unnecessary'], ['只需加大電容', 'Only a larger capacitor is needed'], ['未提及', 'Not mentioned']],
      e:['資料手冊絕對最大額定註 2 明確指出可能需要外部保護。', 'Note 2 of the absolute maximum ratings states external protection may be required.'], l:'process.html#active-clamp-circuit'},
    {ch:'fab', q:['LDMOS 的漂移區（drift region）負責什麼？', 'What does the LDMOS drift region do?'],
      o:[['承受汲極高電壓', 'Sustains the high drain voltage'], ['儲存電荷', 'Stores charge'], ['產生時脈', 'Generates the clock'], ['做為保險絲', 'Acts as a fuse']],
      e:['較長、輕摻雜的漂移區分攤電場，提高崩潰電壓。', 'A long, lightly doped drift region spreads the field and raises breakdown voltage.'], l:'process.html#bcd-technology'},
    {ch:'fab', q:['HVPA 最高接面溫度 T<sub>J</sub> 是？', 'HVPA maximum junction temperature T<sub>J</sub>?'],
      o:[['150 °C', '150 °C'], ['85 °C', '85 °C'], ['125 °C', '125 °C'], ['200 °C', '200 °C']],
      e:['資料手冊：T<sub>A</sub> −40 至 125 °C，T<sub>J</sub> −40 至 150 °C。', 'Datasheet: T<sub>A</sub> −40 to 125 °C, T<sub>J</sub> −40 to 150 °C.'], l:'process.html#thermal-package'},
    {ch:'fab', q:['HVPA LIN 腳的耐壓範圍？', 'Voltage rating of the HVPA LIN pin?'],
      o:[['−27 V 至 +42 V', '−27 V to +42 V'], ['0 至 5 V', '0 to 5 V'], ['±12 V', '±12 V'], ['0 至 60 V', '0 to 60 V']],
      e:['資料手冊 SIDA10：V<sub>LIN</sub> −27 至 42 V。', 'Datasheet SIDA10: V<sub>LIN</sub> −27 to 42 V.'], l:'process.html#bcd-technology'},
    {ch:'fab', q:['同一晶粒整合高壓與精密類比最大的挑戰？', 'Biggest challenge of mixing HV and precision analog on one die?'],
      o:[['高壓切換注入基板的雜訊與載子', 'Noise and carriers injected into the substrate by HV switching'], ['晶片顏色', 'Die colour'], ['封裝重量', 'Package weight'], ['Flash 容量', 'Flash size']],
      e:['需要隔離（DTI、保護環）與佈局分區來保護微伏級量測。', 'Isolation (DTI, guard rings) and floor-planning protect microvolt measurements.'], l:'process.html#isolation-dti'},

    /* ---------- Chapter 5 · Test ---------- */
    {ch:'test', q:['晶圓測試時做類比修調（trim）的目的？', 'Why trim analog circuits at wafer test?'],
      o:[['補償製程偏差，校正偏移、增益與溫漂', 'Compensate process variation: offset, gain, drift'], ['降低時脈', 'Lower the clock'], ['測試防水', 'Test waterproofing'], ['防止逆向工程', 'Prevent reverse engineering']],
      e:['ATE 量測後把校正碼寫入非揮發性記憶體，上電時載入。', 'ATE measures each die and stores correction codes in non-volatile memory, loaded at power-up.'], l:'test.html#ate-trimming'},
    {ch:'test', q:['為何車用晶片要做三溫測試？', 'Why do automotive parts get tri-temperature testing?'],
      o:[['高溫與低溫會暴露常溫看不到的缺陷', 'Hot and cold expose defects invisible at room temperature'], ['顏色變化', 'Colour change'], ['增加成本', 'To add cost'], ['只為封裝膠', 'Only for the mould compound']],
      e:['漏電在高溫惡化，時序與啟動問題常在低溫出現。', 'Leakage worsens hot; timing and start-up issues often show up cold.'], l:'test.html#multi-temp'},
    {ch:'test', q:['AEC-Q100 HTOL 的典型條件？', 'Typical AEC-Q100 HTOL condition?'],
      o:[['1000 小時，3 批 × 77 顆，零失效（Grade 1 為 125 °C）', '1000 h, 3 lots × 77, zero fails (125 °C for Grade 1)'], ['24 小時', '24 h'], ['100 小時', '100 h'], ['10 000 小時', '10 000 h']],
      e:['HTOL 以高溫與最大偏壓加速老化機制。', 'HTOL accelerates wear-out with high temperature and maximum bias.'], l:'test.html#aec-q100'},
    {ch:'test', q:['Wettable flank QFN 的好處？', 'Benefit of a wettable-flank QFN?'],
      o:[['焊錫爬上側面形成焊角，AOI 可從上方檢查', 'Solder wets the side fillet so AOI can inspect from above'], ['散熱多 10 倍', '10× better cooling'], ['尺寸縮小 80%', '80% smaller'], ['免焊接', 'No soldering needed']],
      e:['一般 QFN 側面切口無電鍍，焊點藏在底下無法光學檢查。', 'Standard QFN side cuts are unplated, hiding joints from optical inspection.'], l:'test.html#wettable-flanks'},
    {ch:'test', q:['AEC-Q100 Grade 1 的環境溫度範圍？', 'AEC-Q100 Grade 1 ambient temperature range?'],
      o:[['−40 至 +125 °C', '−40 to +125 °C'], ['0 至 70 °C', '0 to 70 °C'], ['−40 至 +85 °C', '−40 to +85 °C'], ['−40 至 +150 °C', '−40 to +150 °C']],
      e:['Grade 0 為 −40 至 150 °C，Grade 1 為 −40 至 125 °C。', 'Grade 0 is −40 to 150 °C; Grade 1 is −40 to 125 °C.'], l:'test.html#aec-q100'},
    {ch:'test', q:['HVPA 的封裝為何？', 'What package does the HVPA use?'],
      o:[['32-QFN 6×6 mm，具 wettable flanks', '32-QFN 6×6 mm with wettable flanks'], ['100-LQFP', '100-LQFP'], ['BGA-64', 'BGA-64'], ['DIP-8', 'DIP-8']],
      e:['資料手冊：32-QFN（6 × 6 mm）wettable flanks，最多 9 個 GPIO。', 'Datasheet: 32-QFN (6 × 6 mm) with wettable flanks, up to 9 GPIOs.'], l:'test.html#wettable-flanks'},
    {ch:'test', q:['HVPA 在 LIN、VBAT 等腳的 ESD 額定？', 'ESD rating on HVPA pins such as LIN and VBAT?'],
      o:[['±8 kV（ISO 10605，需依指引加外部保護）', '±8 kV (ISO 10605, with the recommended external protection)'], ['±200 V', '±200 V'], ['±50 kV', '±50 kV'], ['無額定', 'Not rated']],
      e:['資料手冊：所有腳 HBM ±2 kV；LIN、VBAT、VSENSE 等 ±8 kV（ISO 10605）。', 'Datasheet: HBM ±2 kV on all pins; ±8 kV on LIN, VBAT, VSENSE etc. per ISO 10605.'], l:'test.html#aec-q100'},
    {ch:'test', q:['IMO 內部振盪器精度？', 'Accuracy of the internal main oscillator (IMO)?'],
      o:[['±2%；以 HPOSC 軟體校準可達 ±1%（依料號）', '±2%; ±1% when software-calibrated to the HPOSC (part-dependent)'], ['±0.01%', '±0.01%'], ['±20%', '±20%'], ['需外部晶振才可工作', 'Needs an external crystal']],
      e:['資料手冊：IMO ±2%，HPOSC ±1%（2 MHz），軟體校準後 IMO/PILO 可達 ±1% 或 ±1.5%。', 'Datasheet: IMO ±2%, HPOSC ±1% (2 MHz); software calibration brings IMO/PILO to ±1% or ±1.5%.'], l:'test.html#ate-trimming'},
    {ch:'test', q:['CP 與 FT 的差別？', 'Difference between CP and FT?'],
      o:[['CP 在晶圓階段探針測試；FT 在封裝後測試', 'CP is wafer-level probe test; FT is after packaging'], ['兩者相同', 'They are the same'], ['CP 在車上做', 'CP happens in the vehicle'], ['FT 只看外觀', 'FT is only visual']],
      e:['修調通常在 CP 完成，FT 驗證封裝後的參數與溫度表現。', 'Trimming is usually done at CP; FT verifies packaged parameters over temperature.'], l:'test.html#ate-trimming'},
    {ch:'test', q:['N 位元修調、範圍 ±R 時，量化殘餘 σ 約為？', 'With N trim bits over ±R, the quantisation residual σ is about?'],
      o:[['步階/√12，步階 = 2R/2ᴺ', 'step/√12, where step = 2R/2ᴺ'], ['R', 'R'], ['0', '0'], ['R·N', 'R·N']],
      e:['均勻量化誤差的標準差為步階/√12；量測雜訊與範圍外晶粒會再增加誤差。', 'Uniform quantisation error has σ = step/√12; measurement noise and out-of-range dies add to it.'], l:'test.html#ate-trimming'},

    /* ---------- Chapter 6 · Safety ---------- */
    {ch:'safety', q:['ISO 26262 對 ASIL C 的 SPFM 目標？', 'ISO 26262 SPFM target for ASIL C?'],
      o:[['≥ 97%', '≥ 97%'], ['≥ 90%', '≥ 90%'], ['≥ 99%', '≥ 99%'], ['≥ 60%', '≥ 60%']],
      e:['SPFM：ASIL B ≥ 90%、C ≥ 97%、D ≥ 99%。', 'SPFM: ASIL B ≥ 90%, C ≥ 97%, D ≥ 99%.'], l:'safety.html#fmeda-metrics-detail'},
    {ch:'safety', q:['ISO 26262 對 ASIL C 的 LFM 目標？', 'ISO 26262 LFM target for ASIL C?'],
      o:[['≥ 80%', '≥ 80%'], ['≥ 60%', '≥ 60%'], ['≥ 90%', '≥ 90%'], ['≥ 97%', '≥ 97%']],
      e:['LFM：ASIL B ≥ 60%、C ≥ 80%、D ≥ 90%。', 'LFM: ASIL B ≥ 60%, C ≥ 80%, D ≥ 90%.'], l:'safety.html#fmeda-metrics-detail'},
    {ch:'safety', q:['資料手冊對 HVPA 功能安全的正式描述？', 'How does the datasheet describe HVPA functional safety?'],
      o:[['依 ISO 26262 開發，符合 ASIL C 流程要求與 ASIL B 硬體架構指標', 'Developed to ISO 26262: ASIL C process requirements, ASIL B hardware architectural metrics'], ['ASIL D 全面認證', 'Fully ASIL D certified'], ['僅 QM', 'QM only'], ['未提功能安全', 'No functional-safety claim']],
      e:['要在系統層達到 ASIL C 硬體指標，需要額外的系統級安全機制。', 'Reaching ASIL C hardware metrics at system level needs additional system-level safety mechanisms.'], l:'safety.html#safety-mechanisms'},
    {ch:'safety', q:['1 FIT 的定義？', 'Definition of 1 FIT?'],
      o:[['每 10⁹ 元件小時 1 次失效', '1 failure per 10⁹ device-hours'], ['每 10⁶ 小時 1 次', '1 per 10⁶ hours'], ['每年 1 次', '1 per year'], ['每 100 小時 1 次', '1 per 100 hours']],
      e:['FIT = Failures In Time，以 10⁹ 小時為基準。', 'FIT = Failures In Time, referenced to 10⁹ hours.'], l:'safety.html#fmeda-metrics-detail'},
    {ch:'safety', q:['問答式窗口看門狗在哪些情況判定故障？', 'When does a challenge-response window watchdog flag a fault?'],
      o:[['太早、太晚或金鑰錯誤', 'Serviced too early, too late, or with the wrong key'], ['只有太晚', 'Only too late'], ['只有金鑰錯誤', 'Only wrong key'], ['從不', 'Never']],
      e:['資料手冊：CRWDT 在 too soon、too late、wrong key 時產生重置或中斷，原因記錄於 Reset Cause。', 'Datasheet: the CRWDT resets or interrupts on too soon, too late or wrong key; the cause is latched.'], l:'safety.html#wdt-lfsr-circuit'},
    {ch:'safety', q:['ASIL D 的 PMHF 目標？', 'PMHF target for ASIL D?'],
      o:[['< 10 FIT', '< 10 FIT'], ['< 100 FIT', '< 100 FIT'], ['< 1000 FIT', '< 1000 FIT'], ['無要求', 'None']],
      e:['ISO 26262-5：ASIL B、C < 100 FIT；ASIL D < 10 FIT。', 'ISO 26262-5: ASIL B and C < 100 FIT; ASIL D < 10 FIT.'], l:'safety.html#fmeda-metrics-detail'},
    {ch:'safety', q:['SPFM 的正確公式？', 'Correct SPFM formula?'],
      o:[['1 − Σ(λ<sub>SPF</sub> + λ<sub>RF</sub>) / Σλ', '1 − Σ(λ<sub>SPF</sub> + λ<sub>RF</sub>) / Σλ'], ['Σλ<sub>SPF</sub> / Σλ', 'Σλ<sub>SPF</sub> / Σλ'], ['λ<sub>RF</sub> × 10⁹', 'λ<sub>RF</sub> × 10⁹'], ['1 / Σλ', '1 / Σλ']],
      e:['SPFM 衡量「未被單點/殘餘故障覆蓋」以外的比例，越高越好。', 'SPFM is the fraction not lost to single-point and residual faults; higher is better.'], l:'safety.html#fmeda-metrics-detail'},
    {ch:'safety', q:['為何要偵測「過早餵狗」？', 'Why detect servicing the watchdog too early?'],
      o:[['跑飛的迴圈可能高速重複餵狗', 'A runaway loop might service the dog repeatedly at high rate'], ['省電', 'To save power'], ['讓 LIN 更快', 'To speed up LIN'], ['無意義', 'It is pointless']],
      e:['窗口下限能抓到「程式卡在含餵狗指令的小迴圈」這類故障。', 'The lower window bound catches code stuck in a small loop that still services the dog.'], l:'safety.html#wdt-lfsr-circuit'},
    {ch:'safety', q:['HVPA 的電源監控涵蓋什麼？', 'What does HVPA supply monitoring cover?'],
      o:[['3.3 V 與 1.8 V 電源的過壓與欠壓（brown-out）', 'Over-voltage and brown-out on the 3.3 V and 1.8 V supplies'], ['只有 VBAT 過溫', 'Only VBAT over-temperature'], ['電池 SoC', 'Battery SoC'], ['LIN 錯誤', 'LIN errors']],
      e:['資料手冊功能安全特性：偵測 3.3 V 與 1.8 V 的過壓與 brown-out。', 'Datasheet safety features: over-voltage and brown-out detection on the 3.3 V and 1.8 V supplies.'], l:'safety.html#safety-mechanisms'},
    {ch:'safety', q:['HVPA 的類比診斷包含哪些？', 'Which analog diagnostics does the HVPA include?'],
      o:[['備援參考電壓，以及電壓、電流、溫度量測路徑的冗餘', 'A backup reference and redundant voltage, current and temperature paths'], ['只有 Flash CRC', 'Only flash CRC'], ['外部攝影機', 'An external camera'], ['沒有', 'None']],
      e:['兩顆 ADC 都能連到任何類比訊號，方便交叉檢查。', 'Either ADC can reach any analog signal, enabling cross-checks.'], l:'safety.html#safety-mechanisms'}
  ];

  /* ---------- UI ---------- */
  const selCh = document.getElementById('qz-chapter'), selCount = document.getElementById('qz-count');
  const btnStart = document.getElementById('qz-start'), box = document.getElementById('qz-container'), sum = document.getElementById('qz-summary');
  const tx = a => a[EN ? 1 : 0];
  const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let quiz = [], answers = {};

  function start(){
    const ch = selCh.value, n = +selCount.value;
    quiz = shuffle(Q.filter(x => ch === 'all' || x.ch === ch)).slice(0, n).map(x => {
      const order = shuffle(x.o.map((_, i) => i));
      return {x, order, ans: order.indexOf(0)};
    });
    answers = {};
    sum.style.display = 'none';
    box.innerHTML = quiz.map((it, qi) => `<div class="quiz-card" id="qcard-${qi}"><div class="quiz-q">${String(qi + 1).padStart(2, '0')}. ${tx(it.x.q)}</div><div class="quiz-opts" role="group">` +
      it.order.map((oi, k) => `<button class="quiz-opt" type="button" data-q="${qi}" data-o="${k}"><b>${'ABCD'[k]}.</b> <span>${tx(it.x.o[oi])}</span></button>`).join('') +
      `</div><div class="quiz-exp" id="qexp-${qi}" hidden aria-live="polite"></div></div>`).join('');
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('.quiz-opt'); if(!b) return;
    const qi = +b.dataset.q, k = +b.dataset.o;
    if(answers[qi] !== undefined) return;
    answers[qi] = k;
    const it = quiz[qi], card = document.getElementById('qcard-' + qi);
    card.querySelectorAll('.quiz-opt').forEach((btn, i) => { btn.disabled = true; if(i === it.ans) btn.classList.add('correct'); else if(i === k) btn.classList.add('wrong'); });
    const exp = document.getElementById('qexp-' + qi);
    exp.hidden = false;
    exp.innerHTML = `<b>${k === it.ans ? t('✓ 正確', '✓ Correct') : t('✕ 錯誤，正確答案是 ', '✕ Incorrect. Answer: ') + (k === it.ans ? '' : 'ABCD'[it.ans])}</b><br>${tx(it.x.e)}<br><a href="${L(it.x.l)}">${t('→ 回到相關章節', '→ Review the section')}</a>`;
    if(Object.keys(answers).length === quiz.length) summary();
  });
  function summary(){
    const right = quiz.filter((it, i) => answers[i] === it.ans).length, pct = Math.round(right / quiz.length * 100);
    const weak = {};
    quiz.forEach((it, i) => { if(answers[i] !== it.ans) weak[it.x.ch] = (weak[it.x.ch] || 0) + 1; });
    const names = {core: t('核心', 'Core'), analog: t('類比', 'Analog'), app: t('BMS 應用', 'BMS'), fab: t('製程', 'Process'), test: t('測試', 'Test'), safety: t('功能安全', 'Safety')};
    sum.style.display = 'block';
    sum.innerHTML = `<h2 style="margin:0 0 10px;font-family:var(--cond)">${t('得分', 'Score')}: ${pct} (${right} / ${quiz.length})</h2>` +
      `<p style="color:var(--muted)">${Object.keys(weak).length ? t('建議複習：', 'Review: ') + Object.entries(weak).map(([c, n]) => names[c] + ' ×' + n).join('、') : t('全部答對！', 'All correct!')}</p>` +
      `<div class="btnrow"><button class="btn pri" type="button" id="qz-again">${t('再測一次', 'Try again')}</button></div>`;
    document.getElementById('qz-again').addEventListener('click', () => { start(); window.scrollTo({top: 0, behavior: 'smooth'}); });
    sum.scrollIntoView({behavior: 'smooth'});
  }
  btnStart.addEventListener('click', start);
  start();
})();
