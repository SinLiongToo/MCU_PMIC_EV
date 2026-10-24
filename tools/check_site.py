# -*- coding: utf-8 -*-
"""Static health check for MCU Notes. Run before every commit:

    python tools/check_site.py

Checks
  1. every local href (pages + #anchors) resolves
  2. zh and en editions have the same pages and the same h2/h3 ids
  3. links inside assets/quiz.js and the search indexes point at real anchors
  4. glossary.html and en/glossary.html carry the same number of terms
  5. SVG numeric attributes are plain numbers (catches x1="355,123")
Exit code 1 if anything fails.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = []


def err(msg):
    errors.append(msg)


def read(p):
    return p.read_text(encoding='utf-8')


pages = sorted([p for p in ROOT.glob('*.html')] + [p for p in (ROOT / 'en').glob('*.html')])
ids = {p: set(re.findall(r'\bid="([^"]+)"', read(p))) for p in pages}

# 1. links and anchors
for p in pages:
    s = read(p)
    for href in re.findall(r'href="([^"]*)"', s):
        if href.startswith(('http:', 'https:', 'mailto:', 'data:', 'javascript:')) or href == '#':
            continue
        path, _, anchor = href.partition('#')
        target = (p.parent / path).resolve() if path else p
        if path.endswith('/') or path in ('en', '../'):
            target = target / 'index.html'
        if path and not target.exists():
            err(f'{p.relative_to(ROOT)}: missing file {href}')
            continue
        if anchor and target.suffix == '.html' and target in ids and anchor not in ids[target]:
            # lab tabs are created by JS; their ids are known
            if target.name == 'lab.html' and anchor in {'shunt', 'coulomb', 'loaddump', 'wdt', 'sinc', 'ecc', 'lin', 'trim'}:
                continue
            err(f'{p.relative_to(ROOT)}: missing anchor {href}')

# 2. zh/en parity
for p in ROOT.glob('*.html'):
    if p.name == 'en.html':
        continue
    e = ROOT / 'en' / p.name
    if not e.exists():
        err(f'no English edition for {p.name}')
        continue
    hz = re.findall(r'<h[23][^>]*\bid="([^"]+)"', read(p))
    he = re.findall(r'<h[23][^>]*\bid="([^"]+)"', read(e))
    if hz != he:
        err(f'{p.name}: section ids differ zh={hz} en={he}')
for e in (ROOT / 'en').glob('*.html'):
    if not (ROOT / e.name).exists():
        err(f'no Chinese edition for en/{e.name}')

# 3. links stored in JS
def check_js_link(src, link):
    page, _, anchor = link.partition('#')
    target = ROOT / page
    if not target.exists():
        err(f'{src}: missing page {link}')
    elif anchor and anchor not in ids.get(target, set()) and page != 'lab.html':
        err(f'{src}: missing anchor {link}')

for link in re.findall(r"l:'([^']+)'", read(ROOT / 'assets' / 'quiz.js')):
    check_js_link('assets/quiz.js', link)
for name in ('search-index.js', 'search-index-en.js'):
    s = read(ROOT / 'assets' / name)
    for page, anchor in re.findall(r'"p":"([^"]+)","a":"([^"]*)"', s):
        check_js_link('assets/' + name, page + ('#' + anchor if anchor else ''))

# 4. glossary parity
gz = read(ROOT / 'glossary.html').count('class="term-card"')
ge = read(ROOT / 'en' / 'glossary.html').count('class="term-card"')
if gz != ge:
    err(f'glossary term count differs: zh={gz} en={ge} (run tools/build_glossary.py)')

# 5. SVG numeric attributes
for p in pages:
    for m in re.finditer(r'<(?:line|rect|circle|text)\b[^>]*>', read(p)):
        for attr, val in re.findall(r'\b(x|y|x1|x2|y1|y2|cx|cy|r|width|height)="([^"]*)"', m.group(0)):
            if not re.fullmatch(r'-?\d+(\.\d+)?%?', val):
                err(f'{p.relative_to(ROOT)}: bad SVG {attr}="{val}"')

if errors:
    print('\n'.join(errors))
    print(f'\n{len(errors)} problem(s) found.')
    sys.exit(1)
print(f'OK: {len(pages)} pages, links, anchors, zh/en parity, quiz links, search index, glossary and SVG attributes all pass.')
