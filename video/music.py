"""8비트 칩튠 BGM + 효과음 합성 → assets/bgm.wav
timeline.js 의 장면 전환/효과음 시각을 그대로 읽어 영상과 싱크를 맞춘다."""
import json, os, re, wave
import numpy as np

DIR = os.path.dirname(os.path.abspath(__file__))
TL = json.loads(re.search(r'=\s*(\{.*\})\s*;', open(os.path.join(DIR, 'timeline.js'), encoding='utf-8').read(), re.S).group(1))
SR, END = 44100, TL['end']
N = int(SR * END)
music, sfx = np.zeros(N), np.zeros(N)
E8 = 0.2  # 8분음표 길이(150 BPM)

NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def hz(n):
    if isinstance(n, (int, float)): return 440 * 2 ** ((n - 69) / 12)
    m = re.match(r'([A-G]#?)(\d)', n); return 440 * 2 ** ((NOTE[m[1]] + 12 * (int(m[2]) + 1) - 69) / 12)

def env(n, a=0.004, r=0.03, sus=0.75):
    e = np.ones(n) * sus; ai = max(1, int(a * SR)); ri = max(1, min(n, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[ai:ai + ai * 4] = np.linspace(1, sus, len(e[ai:ai + ai * 4])); e[-ri:] *= np.linspace(1, 0, ri); return e
def ts(d): return np.arange(int(SR * d)) / SR
def square(f, d, duty=0.5, vol=0.2): t = ts(d); return np.where((t * f) % 1 < duty, 1.0, -1.0) * vol * env(len(t))
def tri(f, d, vol=0.3): t = ts(d); return (2 * np.abs(2 * ((t * f) % 1) - 1) - 1) * vol * env(len(t))
def noise(d, vol=0.2, hold=1, decay=8):
    n = int(SR * d); x = np.repeat(np.random.default_rng(n).uniform(-1, 1, n // hold + 1), hold)[:n]; return x * vol * np.exp(-np.arange(n) / SR * decay)
def sweep(f0, f1, d, duty=0.5, vol=0.2):
    t = ts(d); f = np.geomspace(f0, f1, len(t)); ph = np.cumsum(f) / SR; return np.where(ph % 1 < duty, 1.0, -1.0) * vol * env(len(t), r=0.02)
def add(buf, t0, sig, until=None):
    i = int(t0 * SR); j = min(N, i + len(sig), int(until * SR) if until else N)
    if 0 <= i < j: buf[i:j] += sig[:j - i]

def mx(*sigs):
    n = max(len(x) for x in sigs); out = np.zeros(n)
    for x in sigs: out[:len(x)] += x
    return out
def kick(): t = ts(0.14); return np.sin(2 * np.pi * np.cumsum(np.geomspace(160, 45, len(t))) / SR) * 0.5 * np.exp(-t * 18)
def snare(): return mx(noise(0.12, 0.22, 2, 22), tri(190, 0.06, 0.12))
def hat(v=0.06): return noise(0.03, v, 1, 90)

def seq(t0, notes, until, fn):
    """(음, 8분음표 개수) 목록을 순서대로 연주"""
    t = t0
    for n, l in notes:
        if n: add(music, t, fn(hz(n), l * E8 * 0.92), until)
        t += l * E8
    return t

# ── 타이틀 (0~3.5): 상승 아르페지오 → 경쾌한 인트로 ──
for i, n in enumerate(['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6']): add(music, i * 0.08, square(hz(n), 0.12, 0.25, 0.16))
seq(0.8, [('G5', 1), ('C6', 1), ('E6', 2), ('D6', 1), ('C6', 1), ('G5', 2), ('A5', 1), ('C6', 1), ('F6', 2), ('E6', 1), ('D6', 1), ('C6', 2)], 3.4, lambda f, d: square(f, d, 0.25, 0.14))
for k, root in enumerate(['C3', 'C3', 'F2', 'G2']):
    for e in range(4): add(music, 0.8 + k * 0.8 + e * E8, tri(hz(root) * (2 if e % 2 else 1), E8 * 0.9, 0.28), 3.4)
for b in range(8): add(music, 0.8 + b * 0.4, kick() if b % 2 == 0 else snare(), 3.4)
# 스테이지 카드 (3.5~5.5): 짧은 준비 징글
seq(3.7, [('G4', 1), ('C5', 1), ('E5', 1), ('G5', 2), ('E5', 1), ('G5', 4)], 5.4, lambda f, d: square(f, d, 0.5, 0.12))

# ── 메인 테마 (5.5~17.5, 23~26.5) ──
MEL = [[('E5',1),('G5',1),('C6',2),('B5',1),('G5',1),('E5',2)], [('D5',1),('G5',1),('B5',2),('A5',1),('G5',1),('D5',2)],
       [('C5',1),('E5',1),('A5',2),('G5',1),('E5',1),('C5',1),('E5',1)], [('F5',1),('A5',1),('C6',2),('A5',1),('F5',1),('G5',2)],
       [('E5',1),('G5',1),('C6',1),('E6',2),('D6',1),('C6',1),('G5',1)], [('D6',1),('B5',1),('G5',1),('B5',1),('D6',2),('G5',2)],
       [('A5',1),('C6',1),('A5',1),('F5',1),('G5',1),('B5',1),('D6',2)], [('C6',4),('G5',2),('C6',2)]]
BASS = ['C3', 'G2', 'A2', 'F2', 'C3', 'G2', 'F2', 'C3']
def theme(t0, t1, lead=True, drums=True):
    b = 0; t = t0
    while t < t1:
        bar = b % 8
        if lead: seq(t, MEL[bar], t1, lambda f, d: square(f, d, 0.25, 0.13) + square(f * 1.005, d, 0.5, 0.03))
        for e in range(8):
            root = hz('G2') if bar == 6 and e >= 4 else hz(BASS[bar])
            add(music, t + e * E8, tri(root * (2 if e % 2 else 1), E8 * 0.9, 0.3), t1)
            if drums: add(music, t + e * E8, hat(), t1)
        if drums:
            for q in range(4): add(music, t + q * 0.4, kick() if q % 2 == 0 else snare(), t1)
        t += 1.6; b += 1
theme(5.5, 17.4)
theme(23.0, 26.4, lead=True, drums=False)

# ── 보스전 (17.5~21.0): 단조, 빠른 16분 아르페지오 ──
CH = [('A2', ['A4', 'C5', 'E5']), ('F2', ['F4', 'A4', 'C5']), ('G2', ['G4', 'B4', 'D5']), ('E2', ['E4', 'G#4', 'B4'])]
for k in range(3):
    t = 17.5 + k * 1.6; root, arp = CH[k % 4]
    for s in range(16):
        add(music, t + s * 0.1, square(hz(arp[s % 3]) * (2 if s % 6 > 2 else 1), 0.09, 0.125, 0.07), 21.0)
        add(music, t + s * 0.1, hat(0.04), 21.0)
    for e in range(8): add(music, t + e * E8, square(hz(root), E8 * 0.8, 0.5, 0.1) + tri(hz(root), E8 * 0.8, 0.2), 21.0)
    for q in range(4): add(music, t + q * 0.4, mx(kick(), snare()) if q % 2 else kick(), 21.0)
seq(17.5, [('A5', 4), ('G5', 2), ('E5', 2), ('F5', 4), ('E5', 2), ('D5', 2), ('E5', 4), ('G#5', 4)], 21.0, lambda f, d: square(f, d, 0.5, 0.1))

# ── 클리어 팡파레 (26.5~30) ──
for i, n in enumerate(['G4', 'C5', 'E5', 'G5', 'C6', 'E6']): add(music, 26.5 + i * 0.07, square(hz(n), 0.1, 0.25, 0.15))
add(music, 26.92, square(hz('G6'), 0.5, 0.25, 0.14))
for k, ch in enumerate([['G#4', 'C5', 'D#5'], ['A#4', 'D5', 'F5'], ['C5', 'E5', 'G5', 'C6']]):
    d = 0.35 if k < 2 else 2.3
    for n in ch: add(music, 27.5 + k * 0.4, square(hz(n), d, 0.5, 0.07) * np.exp(-ts(d) * (0.8 if k == 2 else 2)))
    add(music, 27.5 + k * 0.4, tri(hz(ch[0]) / 2, d, 0.3))
for q in range(6): add(music, 28.3 + q * 0.2, hat(0.05))

# ── 효과음 ──
def fx(name):
    if name == 'coin': return np.concatenate([square(hz('B5'), 0.05, 0.5, 0.16), square(hz('E6'), 0.22, 0.5, 0.16) * np.exp(-ts(0.22) * 10)])
    if name == 'jump': return sweep(260, 900, 0.16, 0.5, 0.14)
    if name == 'bump': return mx(tri(110, 0.1, 0.35), noise(0.08, 0.15, 4, 30))
    if name == 'powerup': return np.concatenate([square(hz(n), 0.045, 0.5, 0.13) for n in ['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7']])
    if name == 'pop': return sweep(400, 1200, 0.06, 0.25, 0.1)
    if name == 'select': return np.concatenate([square(880, 0.05, 0.5, 0.12), square(1320, 0.08, 0.5, 0.12)])
    if name == 'start': return np.concatenate([square(hz(n), 0.07, 0.5, 0.14) for n in ['C6', 'E6', 'G6', 'C7']])
    if name == 'thud': return np.sin(2 * np.pi * np.cumsum(np.geomspace(120, 35, int(SR * .35))) / SR) * 0.7 * np.exp(-ts(.35) * 9)[:int(SR * .35)] + mx(np.zeros(int(SR * .35)), noise(0.25, 0.25, 8, 14))
    if name == 'roar': return mx(noise(0.8, 0.35, 30, 3), sweep(180, 50, 0.8, 0.5, 0.1))
    if name == 'laser': return sweep(1800, 180, 0.35, 0.5, 0.14)
    if name == 'bubble': return np.concatenate([sweep(300 + k * 90, 900 + k * 90, 0.05, 0.5, 0.08) for k in range(7)])
    if name == 'hit': return mx(noise(0.18, 0.4, 3, 16), sweep(300, 80, 0.12, 0.5, 0.12))
    if name == 'explode': return mx(noise(1.2, 0.55, 12, 3.2), noise(0.4, 0.3, 3, 8))
    if name == 'achieve': return np.concatenate([square(hz(n), 0.09, 0.25, 0.13) for n in ['C5', 'E5', 'G5', 'C6']] + [square(hz('E6'), 0.5, 0.25, 0.13) * np.exp(-ts(0.5) * 3)])
    if name == 'launch': return sweep(300, 1400, 0.3, 0.5, 0.05)
    if name == 'firework': return noise(0.7, 0.4, 6, 5)
    raise KeyError(name)
for t, name in TL['sfx']: add(sfx, t, fx(name))

mix = music * 0.8 + sfx
mix *= np.minimum(1, np.minimum(np.arange(N) / (SR * 0.02), (N - np.arange(N)) / (SR * 0.5)))
mix = np.tanh(mix / np.abs(mix).max() * 1.3) * 0.85
out = os.path.join(DIR, 'assets', 'bgm.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('BGM 생성:', out)
