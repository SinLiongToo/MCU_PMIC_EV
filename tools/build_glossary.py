# -*- coding: utf-8 -*-
"""Build the term grid of glossary.html (Chinese) and en/glossary.html (English)
from one bilingual list, so both editions always carry the same terms.

Edit TERMS below, then run:  python tools/build_glossary.py
Only the block between <!-- TERMS:BEGIN --> and <!-- TERMS:END --> is rewritten.
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CAT = {
    "core":    ("核心微架構", "Core"),
    "analog":  ("類比與感測", "Analog"),
    "app":     ("車用與電池", "BMS"),
    "safety":  ("功能安全", "FuSa"),
    "process": ("製程與車規", "Process"),
    "adas":    ("ADAS 與雷達", "ADAS"),
}

# (category, search keys, title, (zh subtitle, en subtitle), (zh def, en def), (zh fact, en fact), link)
# "DS" = Infineon PSoC 4 HVPA-144K datasheet 002-28660 Rev. *K.
TERMS = [
    ("core", "cortex m0+ cpu pipeline nvic", "Arm® Cortex®-M0+",
     ("32 位元低功耗處理器核心", "32-bit low-power processor core"),
     ("2 級管線（Fetch、Execute）的 ARMv6-M 核心，NVIC 最多 32 個中斷、4 級優先，中斷延遲 15 週期（零等待狀態）。HVPA 依料號運作於 24 或 48 MHz。",
      "ARMv6-M core with a 2-stage pipeline (fetch, execute), an NVIC with up to 32 interrupts and 4 priority levels, and 15-cycle interrupt latency (zero wait states). The HVPA runs it at 24 or 48 MHz depending on the part."),
     ("Arm 公布約 2.46 CoreMark/MHz、0.93 DMIPS/MHz。", "Arm quotes about 2.46 CoreMark/MHz and 0.93 DMIPS/MHz."),
     "core.html#cortex-m0plus-details"),
    ("core", "single cycle io ioport gpio fast", "Single-cycle I/O port",
     ("單週期 I/O 埠（IOPORT）", "Single-cycle I/O port (IOPORT)"),
     ("Cortex-M0+ 的架構選配：核心不經 AHB 仲裁直接存取 GPIO 暫存器。是否實作與位址由晶片廠決定。",
      "An optional Cortex-M0+ feature that lets the core reach GPIO registers without AHB arbitration. Whether it is implemented, and where, is up to the silicon vendor."),
     ("只省下數十 ns；外部驅動器與致動器時間通常大得多。", "Saves only tens of ns; external driver and actuator times are usually far longer."),
     "core.html#fast-io-circuit"),
    ("core", "secded ecc hamming seu syndrome parity", "SECDED ECC",
     ("單錯修正、雙錯偵測", "Single-error correct, double-error detect"),
     ("32 位元資料加 6 個 Hamming 檢查位元與 1 個整體同位位元，組成 39 位元碼字。症狀碼指出單錯位置以修正；雙錯只能偵測。",
      "32 data bits plus 6 Hamming check bits and 1 overall parity bit form a 39-bit codeword. The syndrome points at a single error so it can be corrected; double errors are detected only."),
     ("DS：SRAM、Code Flash、Data Flash 都有 ECC；單錯在線修正並記錄位址與資料。", "DS: SRAM, code flash and data flash have ECC; single-bit errors are corrected in-line and the address and data logged."),
     "core.html#memory-ecc"),
    ("core", "dma ping pong descriptor", "DMA",
     ("直接記憶體存取", "Direct memory access"),
     ("不經 CPU 搬移資料的引擎，常用於把 ADC 結果送進 SRAM 的 ping-pong 緩衝，讓 CPU 保持睡眠。",
      "Moves data without the CPU, typically ADC results into SRAM ping-pong buffers so the CPU can stay asleep."),
     ("DS：8 通道、32 位元傳輸、可串接 ping-pong 描述符。", "DS: 8 channels, 32-bit transfers, chainable ping-pong descriptors."),
     "core.html#bus-matrix"),
    ("core", "deep sleep power mode current quiescent", "Deep Sleep",
     ("深度睡眠模式", "Deep Sleep power mode"),
     ("CPU 與高速時脈關閉，低功耗振盪器、計時器、LIN 與看門狗保持運作；所有 RAM 內容保持。",
      "CPU and high-speed clocks off; low-power oscillator, timers, LIN and watchdogs stay active; all RAM retained."),
     ("DS：35 µA typ（無週期喚醒）；每秒喚醒量測 85 µA typ；喚醒 ≤ 35 µs。", "DS: 35 µA typ (no periodic wake-up); 85 µA typ with 1 Hz measurement; wake-up ≤ 35 µs."),
     "core.html#clock-power"),
    ("core", "imo pilo ilo hposc oscillator clock", "IMO / HPOSC / PILO / ILO",
     ("晶片內振盪器", "On-chip oscillators"),
     ("IMO 為主時脈（最高 49.152 MHz）；HPOSC 是 2 MHz ±1% 的校準參考；PILO 32 kHz 驅動看門狗與喚醒計時；ILO 40 kHz。",
      "IMO is the main clock (up to 49.152 MHz); HPOSC is a 2 MHz ±1% calibration reference; the 32 kHz PILO clocks watchdogs and wake-up timers; ILO runs at 40 kHz."),
     ("DS：IMO ±2%，以 HPOSC 軟體校準後 ±1% 或 ±1.5%。", "DS: IMO ±2%, ±1% or ±1.5% after software calibration to the HPOSC."),
     "core.html#clock-power"),
    ("analog", "pacss analog subsystem adc channel", "PACSS",
     ("精密類比通道子系統", "Precision analog channel subsystem"),
     ("HVPA 的類比前端：兩顆 ΔΣ ADC、電流／電壓／溫度／診斷通道、序列器、數位濾波與窗口比較。任一 ADC 都能連到任一類比訊號，方便交叉檢查。",
      "The HVPA analog front end: two ΔΣ ADCs, current/voltage/temperature/diagnostic channels, a sequencer, digital filtering and window compare. Either ADC can reach any analog signal for cross-checking."),
     ("DS：ADC 16–20+ 位元；ADC 滿量程輸入 1.2 V。", "DS: 16–20+ bit ADCs; 1.2 V ADC full-scale input."),
     "analog.html#delta-sigma-schematic"),
    ("analog", "kelvin 4 wire four terminal shunt sense", "Kelvin 4-wire",
     ("四端子凱爾文接線", "Four-terminal Kelvin sensing"),
     ("大電流走外側端子，量測線直接取自電阻本體，排除焊點與走線電阻。對 100 µΩ 分流器是必要條件。",
      "High current uses the outer terminals while the sense lines tap the resistor body directly, excluding solder and trace resistance. Mandatory for a 100 µΩ shunt."),
     ("搭配對稱 RC 濾波，例：100 Ω + 100 nF → 約 7.6 kHz。", "Paired with a symmetric RC filter, e.g. 100 Ω + 100 nF → about 7.6 kHz."),
     "analog.html#kelvin-filter"),
    ("analog", "chopper chopping auto zero offset 1/f", "Chopper stabilisation",
     ("斬波穩零", "Chopper stabilisation"),
     ("放大前把輸入極性週期性反轉，放大後再反轉回來，使放大器自身的偏移與 1/f 雜訊被搬到高頻，再由數位濾波器濾除。",
      "Periodically swaps input polarity before amplification and swaps back afterwards, moving the amplifier’s own offset and 1/f noise to high frequency where the digital filter removes them."),
     ("無法消除分流器上的熱電勢等真實輸入誤差。", "Cannot remove real input errors such as thermo-EMF at the shunt."),
     "analog.html#chopper-pga"),
    ("analog", "delta sigma adc dsm modulator noise shaping oversampling", "ΔΣ ADC",
     ("Delta-Sigma 類比數位轉換器", "Delta-sigma analog-to-digital converter"),
     ("以超取樣與雜訊整形把量化雜訊推到高頻，再由抽取濾波器濾除。二階調變器的 NTF = (1 − z⁻¹)²。",
      "Oversampling and noise shaping push quantisation noise to high frequency, where the decimator removes it. A second-order modulator has NTF = (1 − z⁻¹)²."),
     ("DS：HVPA 使用多位準（multi-level）調變器。", "DS: the HVPA uses a multi-level modulator."),
     "analog.html#delta-sigma-schematic"),
    ("analog", "agc automatic gain control scaler pga", "AGC &amp; scaler",
     ("自動增益控制與正規化", "Automatic gain control &amp; scaler"),
     ("比較器監看輸入，超過門檻時查找表同時調整 PGA、調變器增益與 scaler（×512/G），使 LSB 權重不隨增益改變。",
      "Comparators watch the input; when a threshold is crossed a lookup table sets PGA, modulator gain and scaler (×512/G) together so the LSB weight does not change with gain."),
     ("DS：電流通道增益 1–512；100 µΩ 時 1 LSB = 0.715 mA。", "DS: current-channel gain 1–512; 1 LSB = 0.715 mA at 100 µΩ."),
     "analog.html#agc-scaler"),
    ("analog", "sinc3 sinc2 decimation cic fir filter notch", "Sinc³ / Sinc² decimation",
     ("抽取濾波器", "Decimation filters"),
     ("Sinc 濾波器（CIC）以累加與差分實現，零點在輸出資料率的整數倍。HVPA 依序為 Sinc³、Sinc² 與 16 tap 可程式 FIR。",
      "Sinc (CIC) filters use integrators and differentiators and have nulls at multiples of their output rate. The HVPA chain is Sinc³, then Sinc², then a programmable 16-tap FIR."),
     ("DS 範例：3.072 MHz、OSR 64 → 48 kHz；DR2 48 → 1 kHz 零點。", "DS example: 3.072 MHz, OSR 64 → 48 kHz; DR2 48 → nulls every 1 kHz."),
     "analog.html#decimation-chain"),
    ("analog", "bandgap reference vbg ptat ctat", "Bandgap reference",
     ("能隙基準", "Bandgap reference"),
     ("把正溫度係數的 kT/q 與負溫度係數的 V<sub>BE</sub> 加權相加，得到約 1.2 V、溫漂很低的參考電壓。",
      "Adds the positive-tempco kT/q to the negative-tempco V<sub>BE</sub> to obtain a reference of about 1.2 V with very low drift."),
     ("通常在晶圓測試時修調。", "Usually trimmed at wafer test."),
     "analog.html#hv-pmic-schematic"),
    ("analog", "hv regulator vbat vddd vdda vccd ldo", "HV regulator",
     ("高壓穩壓器", "High-voltage regulator"),
     ("由電瓶 VBAT 直接產生 3.3 V 的 VDDD 與 VDDA；核心穩壓器再產生 1.8 V VCCD。",
      "Produces 3.3 V VDDD and VDDA directly from battery VBAT; core regulators then make the 1.8 V VCCD."),
     ("DS：VBAT 3.6–28 V 工作，可運作至 42 V（絕對最大 42 V）。", "DS: VBAT 3.6–28 V operating, functional to 42 V (42 V absolute maximum)."),
     "analog.html#hv-pmic-schematic"),
    ("app", "ibs intelligent battery sensor", "IBS",
     ("智慧電池感測器", "Intelligent battery sensor"),
     ("裝在 12 V/24 V 電瓶負極端子上的模組，量測電流、電壓與溫度，計算 SoC/SoH，經 LIN 回報車身控制器。",
      "A module on the negative terminal of a 12 V/24 V battery that measures current, voltage and temperature, estimates SoC/SoH and reports over LIN."),
     ("HVPA 的主要目標應用（鉛酸電池監測）。", "The HVPA’s main target application (lead-acid monitoring)."),
     "application.html#ibs-schematic"),
    ("app", "coulomb counting soc ampere hour integration", "Coulomb counting",
     ("安時積分", "Ampere-hour integration"),
     ("以電流積分追蹤 SoC：SoC(t) = SoC(t₀) − (1/Q<sub>n</sub>)∫I dt。偏移會被線性累積。",
      "Tracks SoC by integrating current: SoC(t) = SoC(t₀) − (1/Q<sub>n</sub>)∫I dt. Offset accumulates linearly."),
     ("1 µV 偏移在 100 µΩ 上 = 10 mA，30 天累積 7.2 Ah。", "1 µV of offset across 100 µΩ = 10 mA, or 7.2 Ah over 30 days."),
     "application.html#soc-coulomb-detail"),
    ("app", "ocv open circuit voltage rest soc", "OCV",
     ("開路電壓", "Open-circuit voltage"),
     ("電池充分靜置、電流接近零時的端電壓，可查表得到 SoC，用來重新定錨庫倫積分。",
      "Terminal voltage after a long rest at near-zero current; a lookup table maps it to SoC to re-anchor Coulomb counting."),
     ("鉛酸電池通常需靜置數小時；結果受溫度影響。", "Lead-acid usually needs hours of rest; the result depends on temperature."),
     "application.html#soc-coulomb-detail"),
    ("app", "soh state of health internal resistance cranking", "SoH / internal resistance",
     ("健康狀態與內阻", "State of health &amp; internal resistance"),
     ("啟動時同步量測電壓下陷與電流步階，R = ΔV/ΔI；內阻長期上升代表老化。",
      "During cranking, synchronised voltage-sag and current-step readings give R = ΔV/ΔI; a long-term rise indicates ageing."),
     ("比較前需做溫度補償。", "Needs temperature compensation before comparison."),
     "application.html#soh-impedance-detail"),
    ("app", "lin bus pid checksum sync j2602 iso 17987", "LIN",
     ("區域互連網路", "Local Interconnect Network"),
     ("單線、主從式車載匯流排，通常 19.2 kbit/s。訊框為主節點 header（Break、Sync 0x55、PID）加從節點 response（資料、checksum）。",
      "Single-wire master/slave in-vehicle bus, typically 19.2 kbit/s. A frame is the master header (break, sync 0x55, PID) plus the slave response (data, checksum)."),
     ("DS：相容 LIN 2.2A / ISO 17987 / SAE J2602；LIN 腳 −27 V 至 +42 V。", "DS: LIN 2.2A / ISO 17987 / SAE J2602 compliant; LIN pin −27 V to +42 V."),
     "application.html#lin-bus"),
    ("app", "bdu battery disconnect contactor pyro fuse economizer", "BDU",
     ("電池斷路單元", "Battery disconnect unit"),
     ("高壓電池包內的主接觸器、預充電路、電流感測與火工切斷器。接觸器以 PWM 節能保持、以齊納箝位加速斷開。",
      "Main contactors, pre-charge circuit, current sensing and pyro-fuse inside a high-voltage pack. Contactors are held with PWM economisers and opened faster with a Zener clamp."),
     ("不是 HVPA 的目標應用（HVPA 最高 42 V）。", "Not an HVPA target application (HVPA max 42 V)."),
     "application.html#bdu-circuit"),
    ("app", "seebeck thermo emf thermocouple drift shunt", "Seebeck thermo-EMF",
     ("熱電勢", "Thermo-electric voltage"),
     ("異質金屬接面在溫差下產生電壓。分流器兩端溫差會產生真實的偏移電壓，被庫倫積分累積。",
      "Junctions of dissimilar metals generate a voltage under a temperature difference. A temperature gradient across a shunt creates a real offset that Coulomb counting accumulates."),
     ("對策：熱對稱、低熱電勢合金、零電流校準。", "Fixes: thermal symmetry, low-EMF alloys, zero-current calibration."),
     "lessons.html#case3-seebeck"),
    ("safety", "iso 26262 asil functional safety", "ISO 26262 / ASIL",
     ("道路車輛功能安全", "Road-vehicle functional safety"),
     ("以 ASIL A–D 分級，對開發流程與硬體指標（SPFM、LFM、PMHF）提出要求。",
      "Grades risk as ASIL A–D and sets requirements on the development process and hardware metrics (SPFM, LFM, PMHF)."),
     ("DS：HVPA 符合 ASIL C 流程要求與 ASIL B 硬體架構指標。", "DS: HVPA meets ASIL C process requirements and ASIL B hardware architectural metrics."),
     "safety.html#safety-mechanisms"),
    ("safety", "spfm single point fault metric", "SPFM",
     ("單點故障指標", "Single-point fault metric"),
     ("SPFM = 1 − Σ(λ<sub>SPF</sub> + λ<sub>RF</sub>) / Σλ，衡量單點與殘餘故障被涵蓋的程度。",
      "SPFM = 1 − Σ(λ<sub>SPF</sub> + λ<sub>RF</sub>) / Σλ, measuring how well single-point and residual faults are covered."),
     ("目標：ASIL B ≥ 90%、C ≥ 97%、D ≥ 99%。", "Targets: ASIL B ≥ 90%, C ≥ 97%, D ≥ 99%."),
     "safety.html#fmeda-metrics-detail"),
    ("safety", "lfm latent fault metric", "LFM",
     ("潛伏故障指標", "Latent fault metric"),
     ("衡量潛伏的多點故障被偵測的比例。",
      "Measures the fraction of latent multi-point faults that are detected."),
     ("目標：ASIL B ≥ 60%、C ≥ 80%、D ≥ 90%。", "Targets: ASIL B ≥ 60%, C ≥ 80%, D ≥ 90%."),
     "safety.html#fmeda-metrics-detail"),
    ("safety", "fit pmhf failure rate", "FIT / PMHF",
     ("失效率與隨機硬體失效機率", "Failure rate &amp; probabilistic metric for hardware failures"),
     ("1 FIT = 每 10⁹ 元件小時 1 次失效。PMHF 是系統層的隨機硬體失效率。",
      "1 FIT = 1 failure per 10⁹ device-hours. PMHF is the system-level random hardware failure rate."),
     ("PMHF 目標：ASIL B/C &lt; 100 FIT、D &lt; 10 FIT。", "PMHF targets: ASIL B/C &lt; 100 FIT, D &lt; 10 FIT."),
     "safety.html#fmeda-metrics-detail"),
    ("safety", "fmeda failure modes effects diagnostic analysis", "FMEDA",
     ("失效模式、影響與診斷分析", "Failure modes, effects &amp; diagnostic analysis"),
     ("把每個電路區塊拆成失效模式、分配失效率與診斷涵蓋率，計算 SPFM、LFM 與 PMHF。",
      "Breaks each block into failure modes with failure-rate shares and diagnostic coverage to compute SPFM, LFM and PMHF."),
     ("ISO 26262-5 的核心量化方法。", "The core quantitative method of ISO 26262-5."),
     "safety.html#fmeda-metrics-detail"),
    ("safety", "watchdog crwdt challenge response window wdt", "Challenge-response WDT",
     ("問答式窗口看門狗", "Challenge-response window watchdog"),
     ("除了限制餵狗時間窗口，還要求送出正確的金鑰序列，證明安全任務確實執行。",
      "Besides a timing window, requires the correct key sequence, proving the safety tasks actually ran."),
     ("DS：太早、太晚或金鑰錯誤 → 重置或中斷，原因記錄於 Reset Cause。", "DS: too soon, too late or wrong key → reset or interrupt; cause latched in Reset Cause."),
     "safety.html#wdt-lfsr-circuit"),
    ("safety", "open wire break diagnosis shunt diagnostic", "Open-wire diagnosis",
     ("斷線診斷", "Open-wire diagnosis"),
     ("注入微小診斷電流或交叉量測，偵測分流器焊點或量測線開路，避免浮接輸入看起來像正常讀值。",
      "Injects a tiny diagnostic current or cross-checks measurements to detect an open shunt joint or sense wire, so a floating input is not mistaken for a valid reading."),
     ("HVPA 提供備援參考與量測路徑冗餘（DS）。", "HVPA provides a backup reference and redundant measurement paths (DS)."),
     "safety.html#wire-break-circuit"),
    ("process", "bcd bipolar cmos dmos process", "BCD process",
     ("Bipolar-CMOS-DMOS 製程", "Bipolar-CMOS-DMOS process"),
     ("在同一晶圓整合精密雙極元件、高密度 CMOS 與高壓 DMOS 的混合訊號製程。",
      "A mixed-signal process combining precision bipolar devices, dense CMOS and high-voltage DMOS on one wafer."),
     ("Infineon 未公開 HVPA 的確切製程。", "Infineon does not publish the exact HVPA process."),
     "process.html#bcd-technology"),
    ("process", "ldmos drift region high voltage transistor", "LDMOS",
     ("橫向雙擴散 MOS", "Lateral double-diffused MOS"),
     ("以長且輕摻雜的漂移區承受高汲極電壓的功率電晶體，用於高壓穩壓器與 LIN 驅動等。",
      "A power transistor whose long, lightly doped drift region sustains high drain voltage; used in HV regulators, LIN drivers and similar."),
     ("崩潰電壓提高的代價是導通電阻與面積。", "Higher breakdown costs on-resistance and area."),
     "process.html#bcd-technology"),
    ("process", "dti deep trench isolation latch up substrate", "DTI",
     ("深溝槽隔離", "Deep trench isolation"),
     ("以介電質溝槽隔開元件，阻擋高壓區注入基板的載子與雜訊，降低閂鎖風險。",
      "Dielectric trenches separate devices, blocking carriers and noise injected into the substrate by HV blocks and reducing latch-up risk."),
     ("常與保護環、分區佈局一起使用。", "Used together with guard rings and floor-planning."),
     "process.html#isolation-dti"),
    ("process", "load dump iso 16750 7637 pulse 5a 5b alternator", "Load dump",
     ("拋負載", "Load dump"),
     ("發電機充電中電瓶斷開造成的長時間過壓。ISO 16750-2 Test A 未抑制（12 V：79–101 V），Test B 由發電機內抑制（常見 35 V）。",
      "A long over-voltage caused by disconnecting the battery while the alternator charges. ISO 16750-2 Test A is unsuppressed (12 V: 79–101 V); Test B is suppressed in the alternator (commonly 35 V)."),
     ("DS：VBAT 絕對最大 42 V，可能需要外部保護。", "DS: VBAT absolute maximum 42 V; external protection may be required."),
     "process.html#active-clamp-circuit"),
    ("process", "aec q100 grade htol qualification", "AEC-Q100",
     ("車用 IC 應力驗證", "Automotive IC stress qualification"),
     ("汽車電子協會的 IC 驗證規範。Grade 1 為 −40 至 +125 °C；HTOL 1000 小時、3 批 × 77 顆零失效。",
      "The Automotive Electronics Council qualification for ICs. Grade 1 covers −40 to +125 °C; HTOL is 1000 h on 3 lots × 77 with zero fails."),
     ("DS：HVPA 為 AEC-Q100 qualified，T<sub>A</sub> −40 至 125 °C。", "DS: HVPA is AEC-Q100 qualified, T<sub>A</sub> −40 to 125 °C."),
     "test.html#aec-q100"),
    ("process", "trim trimming calibration ate wafer probe cp", "Trimming",
     ("修調", "Trimming"),
     ("晶圓測試時量測每顆晶粒並寫入校正碼，補償偏移、增益與溫漂。殘餘誤差約為步階/√12 加上量測雜訊。",
      "Each die is measured at wafer test and correction codes are stored to compensate offset, gain and drift. Residual error is about step/√12 plus measurement noise."),
     ("可在互動實驗室用 Monte Carlo 試算。", "Try the Monte Carlo model in the MCU Lab."),
     "test.html#ate-trimming"),
    ("process", "wettable flank qfn aoi solder", "Wettable-flank QFN",
     ("側面可潤濕 QFN", "Wettable-flank QFN"),
     ("引腳側面有電鍍凹階的 QFN，焊錫會形成可見側面焊角，AOI 可直接檢查焊點。",
      "A QFN with plated steps on the lead sides so solder forms a visible side fillet that AOI can inspect."),
     ("DS：HVPA 為 32-QFN 6 × 6 mm wettable flank。", "DS: HVPA comes in a 32-QFN 6 × 6 mm wettable-flank package."),
     "test.html#wettable-flanks"),
    ("adas", "delayed lockstep checker core smu aurix r5f m7 asil d", "Delayed Lockstep",
     ("雙核延遲鎖步", "Dual-core delayed lockstep"),
     ("主核心與影子檢查核執行相同指令流並由硬體逐週期比對輸出；檢查核延遲 2 個時脈週期且實體分離佈局，以消除電源毛刺與 EMI 造成的共模錯誤。",
      "A master core and a shadow checker core run the same instruction stream while hardware compares their outputs every cycle; a 2-clock delay and physical floorplan separation prevent common-mode glitches from corrupting both identically."),
     ("常見於 ASIL D MCU（如 AURIX TC39x、Cortex-R5F/M7 lockstep）。", "Used in ASIL D MCUs such as AURIX TC39x and lockstep Cortex-R5F/M7."),
     "adas.html#delayed-lockstep"),
    ("adas", "safety pmic tlf35584 ss1 ss2 fsp err wwd fwd abist", "Safety PMIC (SS1 / SS2)",
     ("外掛安全電源管理晶片", "External safety PMIC &amp; safe-state outputs"),
     ("以獨立矽晶粒提供多軌電源、冗餘能隙電壓監控（含上電 ABIST/LBIST）、窗口+問答雙看門狗與 FSP 故障腳位監控；異常時由硬體直接拉低 SS1/SS2 切斷致動器。",
      "An independent SEooC power IC providing multi-rail supplies, redundant bandgap voltage monitors (with startup ABIST/LBIST), window + functional watchdogs and FSP error-pin monitoring; drives SS1/SS2 low in hardware on fault."),
     ("例：Infineon OPTIREG™ TLF35584（ISO 26262 ASIL D）。", "Example: Infineon OPTIREG™ TLF35584 (ISO 26262 ASIL D)."),
     "adas.html#safety-pmic-tlf35584"),
    ("adas", "fmcw radar cube 2d fft cfar hwa spt 77 ghz awr2944 s32r45", "FMCW Radar Cube &amp; CFAR",
     ("77 GHz 調頻連續波雷達立方體與恆虛警率檢測", "77 GHz FMCW Radar Cube &amp; CFAR detection"),
     ("76–81 GHz 混頻拍頻經高速 IF ADC 取樣存入數 MB 片上 SRAM（Radar Cube），由硬體加速器執行 1D 距離 FFT、2D 多普勒 FFT 與 CA/OS-CFAR 動態背景雜訊門檻檢測。",
      "76–81 GHz beat signals are digitized by IF ADCs into multi-MB on-chip SRAM (the Radar Cube), where hardware accelerators run 1D Range FFT, 2D Doppler FFT and CA/OS-CFAR adaptive thresholding."),
     ("例：TI AWR2944（HWA 2.1，4.5 MB RAM）、NXP S32R45（SPT 3.1，8 MB SRAM）。", "Examples: TI AWR2944 (HWA 2.1, 4.5 MB RAM), NXP S32R45 (SPT 3.1, 8 MB SRAM)."),
     "adas.html#radar-signal-chain"),
    ("adas", "autosar e2e tsn 802.1qbv can fd can xl ethernet", "AUTOSAR E2E &amp; Ethernet TSN",
     ("端到端通訊安全保護與時間敏感網路", "End-to-end safety protection &amp; Time-Sensitive Networking"),
     ("E2E 在安全關鍵訊框加入 CRC、序號計數器與 Data ID 以偵測封包遺失、重複或篡改；IEEE 802.1Qbv 時間感知整形器則為車載乙太網保留確定性低延遲通道。",
      "AUTOSAR E2E adds a CRC, sequence counter and Data ID to safety frames to detect loss, repetition or corruption; IEEE 802.1Qbv time-aware shaping reserves deterministic low-latency windows over Automotive Ethernet."),
     ("搭配 CAN FD（64 B）、CAN XL（2048 B）與 100/1000BASE-T1。", "Used across CAN FD (64 B), CAN XL (2048 B) and 100/1000BASE-T1."),
     "adas.html#adas-networking"),
]


def card(term, en):
    cat, keys, title, sub, d, fact, link = term
    i = 1 if en else 0
    badge = CAT[cat][i]
    go = ("Go to section →" if en else "前往相關章節 →")
    return f'''      <div class="term-card" data-cat="{cat}" data-term="{html.escape(keys)}">
        <div class="term-head">
          <h3 class="term-title">{title} <small>{sub[i]}</small></h3>
          <span class="term-badge cat-{cat}">{badge}</span>
        </div>
        <p class="term-def">{d[i]}</p>
        <div class="term-meta">
          <span class="term-prop">{fact[i]}</span>
          <a class="term-link" href="{link}">{go}</a>
        </div>
      </div>
'''


def build(rel, en):
    path = ROOT / rel
    s = path.read_text(encoding='utf-8')
    block = '<!-- TERMS:BEGIN -->\n' + ''.join(card(t, en) for t in TERMS) + '      <!-- TERMS:END -->'
    if '<!-- TERMS:BEGIN -->' in s:
        s = re.sub(r'<!-- TERMS:BEGIN -->.*?<!-- TERMS:END -->', lambda m: block, s, flags=re.S)
    else:  # first run: replace the whole hand-written grid
        a = s.index('<div class="term-grid" id="termGrid">') + len('<div class="term-grid" id="termGrid">')
        b = s.index('</article>')
        b = s.rindex('</div>', a, b)
        s = s[:a] + '\n      ' + block + '\n    ' + s[b:]
    path.write_text(s, encoding='utf-8', newline='\n')
    print(f'{len(TERMS)} terms -> {rel}')


if __name__ == '__main__':
    build('glossary.html', False)
    build('en/glossary.html', True)
