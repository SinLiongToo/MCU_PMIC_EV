"""Build assets/search-index.js (Chinese) and assets/search-index-en.js (English).
Indexes every <h2 id>/<h3 id> and provides Ctrl+K fast search.
"""
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAGES = [
    ("core.html", "core"),
    ("analog.html", "analog"),
    ("application.html", "app"),
    ("process.html", "fab"),
    ("test.html", "test"),
    ("safety.html", "safety"),
    ("roles.html", "roles"),
    ("lessons.html", "lessons"),
]

EXTRA = [
    {"p": "lab.html", "a": "shunt", "t": "分流電阻與快速 AGC 模擬器", "s": "分流器 Shunt AGC 自動增益 PGA 滿量程 150mV LSB 微伏解析度 啟動電流 1500A 暗電流", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "coulomb", "t": "庫倫積分與 SoC 漂移模擬", "s": "安時積分 Coulomb Counting 偏移電壓 Offset 溫漂 Chopping 斬波 OCV 開路電壓校準", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "loaddump", "t": "42V 拋負載突降模擬器", "s": "ISO 7637-2 Pulse 5b 負載突降 42V 箝位 VDDD 3.3V VCCD 1.8V LDO 瞬態保護", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "wdt", "t": "問答式窗口看門狗模擬", "s": "Window WDT Challenge-Response 窗口時間 早餵故障 超時復位 SafeTlib 獨立 ILO 時脈", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "sinc", "t": "Sinc³ 數位濾波頻譜模擬", "s": "Sinc3 Sinc4 OSR 抽取率 50Hz 60Hz 工頻消除 陷波 Notch 逆變器 PWM 抑制", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "ecc", "t": "SECDED ECC 錯誤注入模擬器", "s": "漢明碼 Hamming 單粒子翻轉 SEU 單錯自動修正 雙錯 NMI 中斷 症狀碼 Syndrome", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "lin", "t": "LIN 2.2A 總線實體層傳輸", "s": "LIN 匯流排 Synch Break 0x55 PID Checksum 波特率校準 斜率控制 EMI", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "trim", "t": "類比晶圓修調與良率模擬", "s": "eFuse Laser Trim Offset 偏移校正 常態分佈 晶圓良率提升 CP ATE 測試", "g": "lab", "lv": 1},
    {"p": "designer.html", "a": "", "t": "BMS 分流與前端選型設計器", "s": "分流電阻計算 峰值跨壓 溫升熱損耗 I2R ADC 裕度 LSB 動態範圍", "g": "designer", "lv": 1},
    {"p": "designer.html", "a": "", "t": "電瓶休眠與待機壽命評估器", "s": "車載暗電流 Deep Sleep 停放天數 電瓶自放電 剩餘容量 50% 啟動極限", "g": "designer", "lv": 1},
    {"p": "designer.html", "a": "", "t": "韌體記憶體分區與安全開銷設計器", "s": "Flash SRAM Bootloader SafeTlib 連結腳本 Linker Script 堆疊深度", "g": "designer", "lv": 1},
    {"p": "quiz.html", "a": "", "t": "MCU 專業知識測驗 (60題)", "s": "車規測驗 題庫 自我檢測 核心 類比 BMS 製程 測試 ISO 26262", "g": "quiz", "lv": 1},
]

EXTRA_EN = [
    {"p": "lab.html", "a": "shunt", "t": "Shunt Sensing & Fast AGC Simulator", "s": "Shunt resistor, AGC dynamic range, PGA gains, 150mV FSR, LSB resolution, cranking current", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "coulomb", "t": "Coulomb Counting & SoC Drift Simulator", "s": "Ampere-hour integration, offset drift, Chopping auto-zero, OCV recalibration", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "loaddump", "t": "42V Load Dump Transient Simulator", "s": "ISO 7637-2 Pulse 5b, unsuppressed surge, 42V clamp, VDDD 3.3V, VCCD 1.8V LDO", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "wdt", "t": "Challenge-Response Window WDT Simulator", "s": "Windowed watchdog, Early feed violation, Timeout reset, SafeTlib token, ILO clock", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "sinc", "t": "Sinc³ Decimation Filter Frequency Response", "s": "Sinc3 Sinc4 OSR decimation, 50Hz 60Hz notch rejection, PWM carrier suppression", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "ecc", "t": "SECDED ECC Fault Injection Simulator", "s": "Hamming code, Single Event Upset SEU, 1-bit auto correction, 2-bit fatal NMI interrupt", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "lin", "t": "LIN 2.2A Physical Layer Transceiver Simulator", "s": "LIN bus, Synch Break, 0x55, PID parity, Enhanced checksum, Slew-rate control", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "trim", "t": "Analog Trimming & Wafer Yield Simulator", "s": "eFuse laser trim, ADC offset distribution, Gaussian yield upgrade, CP ATE testing", "g": "lab", "lv": 1},
    {"p": "designer.html", "a": "", "t": "BMS Shunt & Frontend Spec Designer", "s": "Shunt dimensioning, peak Vdiff, thermal dissipation, LSB resolution, dynamic range", "g": "designer", "lv": 1},
    {"p": "designer.html", "a": "", "t": "Battery Standby & Sleep Budget Calculator", "s": "Dark quiescent current, Deep Sleep, parking duration, self-discharge, cranking threshold", "g": "designer", "lv": 1},
    {"p": "designer.html", "a": "", "t": "Firmware Memory & Safety Budget Designer", "s": "Flash, SRAM, Bootloader, SafeTlib footprint, linker script, stack depth", "g": "designer", "lv": 1},
    {"p": "quiz.html", "a": "", "t": "MCU Knowledge Quiz (60 Questions)", "s": "Automotive test, self-check, Core, Analog, BMS, Fab, Test, ISO 26262 FuSa", "g": "quiz", "lv": 1},
]


class Collector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.entries = []
        self.cur = None
        self.mode = None
        self.section = ""
        self.skip = 0
        self.in_article = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "article":
            self.in_article = True
        if not self.in_article:
            return
        if tag in ("svg", "script", "style", "figure"):
            self.skip += 1
            return
        if self.skip:
            return
        if tag in ("h2", "h3") and a.get("id"):
            if tag == "h2":
                self.section = a["id"]
            self.cur = {"a": a["id"], "t": "", "s": "", "lv": 1 if tag == "h2" else 2}
            self.entries.append(self.cur)
            self.mode = "head"
        elif tag == "dt":
            self.cur = {"a": self.section, "t": "", "s": "", "lv": 3}
            self.entries.append(self.cur)
            self.mode = "dt"
        elif tag == "dd":
            self.mode = "dd"

    def handle_endtag(self, tag):
        if tag == "article":
            self.in_article = False
        if tag in ("svg", "script", "style", "figure") and self.skip:
            self.skip -= 1
            return
        if tag in ("h2", "h3") and self.mode == "head":
            self.mode = "body"
        elif tag == "dt" and self.mode == "dt":
            self.mode = None
        elif tag == "dd":
            self.mode = None

    def handle_data(self, data):
        if self.skip or not self.cur or not self.mode:
            return
        if self.mode in ("head", "dt"):
            self.cur["t"] += data
        elif self.mode in ("body", "dd") and len(self.cur["s"]) < 260:
            self.cur["s"] += data


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def build(subdir, extra, out_name):
    out = []
    base_dir = ROOT / subdir if subdir else ROOT
    for fname, group in PAGES:
        p = base_dir / fname
        if not p.exists():
            continue
        c = Collector()
        c.feed(p.read_text(encoding="utf-8"))
        for e in c.entries:
            t = clean(e["t"])
            if not t:
                continue
            out.append({"p": fname, "a": e["a"], "t": t, "s": clean(e["s"])[:240], "g": group, "lv": e["lv"]})
    out.extend(extra)
    js = "/* Generated by tools/build_index.py -- do not edit by hand. */\nwindow.SEARCH_INDEX = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ROOT / "assets" / out_name).write_text(js, encoding="utf-8")
    print(f"{len(out)} entries -> assets/{out_name}")


def main():
    build("", EXTRA, "search-index.js")
    build("en", EXTRA_EN, "search-index-en.js")


if __name__ == "__main__":
    main()
