# -*- coding: utf-8 -*-
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
    {"p": "lab.html", "a": "shunt", "t": "分流器與 AGC 模擬", "s": "分流器 Shunt AGC 自動增益 1–512 scaler 512/G 0.715 mA LSB 1.2 V 滿量程 冷啟動 暗電流", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "coulomb", "t": "庫倫積分 SoC 漂移模擬", "s": "安時積分 Coulomb Counting 偏移 虛假電流 斬波 Chopping OCV 定錨 暗電流", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "loaddump", "t": "拋負載與 42 V 絕對最大額定模擬", "s": "ISO 16750-2 Test A Test B 拋負載 Load dump 42V TVS 能量 VBAT", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "wdt", "t": "問答式窗口看門狗模擬", "s": "CRWDT Window WDT Challenge-Response 過早 逾時 金鑰錯誤 Reset Cause PILO", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "sinc", "t": "Sinc³ / Sinc² 抽取濾波模擬", "s": "Sinc3 Sinc2 DR DR2 OSR 3.072 MHz 50Hz 60Hz 陷波 平均 8 kSPS", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "ecc", "t": "SECDED(39,32) ECC 錯誤注入", "s": "漢明碼 Hamming 症狀碼 Syndrome 單錯修正 雙錯偵測 誤修正 SEU", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "lin", "t": "LIN 訊框模擬", "s": "LIN Break Sync 0x55 PID 同位 Enhanced Classic checksum 鮑率", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "trim", "t": "修調與良率 Monte Carlo", "s": "修調 Trim 偏移分佈 良率 量化 步階 ATE 量測雜訊 修調範圍", "g": "lab", "lv": 1},
    {"p": "designer.html", "a": "", "t": "分流器與前端設計器", "s": "分流電阻 功耗 溫升 TCR AGC 量程 LSB", "g": "designer", "lv": 1},
    {"p": "designer.html", "a": "", "t": "停車待機耗電評估", "s": "Deep Sleep 35 µA 85 µA 喚醒 暗電流 自放電 50% SoC", "g": "designer", "lv": 1},
    {"p": "designer.html", "a": "", "t": "Flash/SRAM 記憶體配置", "s": "Code Flash 128 KB Data Flash 8 KB SRAM 8 KB Bootloader linker", "g": "designer", "lv": 1},
    {"p": "quiz.html", "a": "", "t": "MCU 專業測驗（60 題）", "s": "測驗 題庫 自我檢測 核心 類比 BMS 製程 測試 ISO 26262", "g": "quiz", "lv": 1},
    {"p": "glossary.html", "a": "", "t": "MCU 術語辭典（35 項）", "s": "術語 PACSS AGC SECDED FIT SPFM LFM BCD LDMOS Kelvin Chopper Sinc OCV LIN AEC-Q100", "g": "glossary", "lv": 1},
]

EXTRA_EN = [
    {"p": "lab.html", "a": "shunt", "t": "Shunt & AGC Simulator", "s": "Shunt AGC gain 1–512 scaler 512/G 0.715 mA LSB 1.2 V full scale cranking parked current", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "coulomb", "t": "Coulomb-Counting SoC Drift Simulator", "s": "Ampere-hour integration offset phantom current chopping OCV anchoring quiescent current", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "loaddump", "t": "Load Dump vs 42 V Absolute Maximum", "s": "ISO 16750-2 Test A Test B load dump 42V TVS energy VBAT", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "wdt", "t": "Challenge-Response Window Watchdog Simulator", "s": "CRWDT window watchdog too early too late wrong key Reset Cause PILO", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "sinc", "t": "Sinc³ / Sinc² Decimation Simulator", "s": "Sinc3 Sinc2 DR DR2 OSR 3.072 MHz 50Hz 60Hz notch averaging 8 kSPS", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "ecc", "t": "SECDED(39,32) ECC Fault Injection", "s": "Hamming syndrome single-error correct double-error detect miscorrection SEU", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "lin", "t": "LIN Frame Simulator", "s": "LIN break sync 0x55 PID parity enhanced classic checksum baud", "g": "lab", "lv": 1},
    {"p": "lab.html", "a": "trim", "t": "Trim & Yield Monte Carlo", "s": "trim offset distribution yield quantisation step ATE measurement noise trim range", "g": "lab", "lv": 1},
    {"p": "designer.html", "a": "", "t": "Shunt & Front-End Designer", "s": "shunt resistor dissipation temperature rise TCR AGC range LSB", "g": "designer", "lv": 1},
    {"p": "designer.html", "a": "", "t": "Parked Standby Budget", "s": "Deep Sleep 35 µA 85 µA wake-up quiescent current self-discharge 50% SoC", "g": "designer", "lv": 1},
    {"p": "designer.html", "a": "", "t": "Flash / SRAM Memory Layout", "s": "code flash 128 KB data flash 8 KB SRAM 8 KB bootloader linker", "g": "designer", "lv": 1},
    {"p": "quiz.html", "a": "", "t": "MCU Knowledge Quiz (60 Questions)", "s": "quiz self-check core analog BMS process test ISO 26262", "g": "quiz", "lv": 1},
    {"p": "glossary.html", "a": "", "t": "MCU Glossary (35 terms)", "s": "glossary PACSS AGC SECDED FIT SPFM LFM BCD LDMOS Kelvin chopper Sinc OCV LIN AEC-Q100", "g": "glossary", "lv": 1},
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
    # Remove raw math delimiters and clean spaces
    s = re.sub(r"\\\([^\\]+\\\)", "", s)
    s = re.sub(r"\$[^$]+\$", "", s)
    s = re.sub(r"\\[a-zA-Z]+", "", s)
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
