#!/usr/bin/env python3
"""Claude Code Statusline — Compact format
Format: ctx ━─────── 6% 57k/1000k  |  5h/7d 16%/22%  |  t 11m51s
"""
import json, sys

data = json.load(sys.stdin)

# ── Colors ──
B = '\033[1m'
DIM = '\033[2m'
GREEN = '\033[32m'
YELLOW = '\033[33m'
RED = '\033[31m'
CYAN = '\033[36m'
R = '\033[0m'

def fk(n):
    return f"{n/1000:.0f}k" if n >= 1000 else str(n)

def pct_color(p):
    return GREEN if p < 50 else YELLOW if p < 75 else RED

# ── Context Window ──
cw = data.get('context_window', {})
pct = cw.get('used_percentage')
window_size = cw.get('context_window_size', 0) or 0

cu = cw.get('current_usage') or {}
input_tk = (cu.get('input_tokens', 0) or 0) + \
           (cu.get('cache_creation_input_tokens', 0) or 0) + \
           (cu.get('cache_read_input_tokens', 0) or 0)

# ── Duration ──
dur = data.get('cost', {}).get('total_duration_ms', 0) or 0
m, s = dur // 60000, (dur % 60000) // 1000

# ── Context bar ──
BAR_W = 8
if pct is not None:
    p = int(pct)
    c = pct_color(p)
    filled = max(p * BAR_W // 100, 1 if p > 0 else 0)
    bar = f"{c}{'━' * filled}{DIM}{'─' * (BAR_W - filled)}{R}"
    ctx = f"ctx {bar} {c}{B}{p}%{R} {DIM}{fk(input_tk)}/{fk(window_size)}{R}"
else:
    ctx = f"ctx {DIM}{'─' * BAR_W} 0% 0/{fk(window_size)}{R}"

# ── Rate Limits (combined: 5h/7d 16%/22%) ──
rl = data.get('rate_limits', {})
fh = rl.get('five_hour', {})
sd = rl.get('seven_day', {})

rate_str = ''
h_pct = fh.get('used_percentage', 0) or 0
d_pct = sd.get('used_percentage', 0) or 0
if h_pct or d_pct:
    hc = pct_color(h_pct)
    dc = pct_color(d_pct)
    rate_str = f"{DIM}5h/7d{R} {hc}{h_pct}%{R}{DIM}/{R}{dc}{d_pct}%{R}"

# ── Output ──
parts = [ctx]
if rate_str:
    parts.append(rate_str)
parts.append(f"t {CYAN}{m}m{s:02d}s{R}")

dir_name = __import__('os').path.basename(data.get('workspace', {}).get('current_dir', ''))
print(f"{CYAN}{dir_name}{R}  {DIM}|{R}  " + f"  {DIM}|{R}  ".join(parts))
