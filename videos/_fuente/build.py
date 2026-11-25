# Construye los videos paso a paso: escena HTML → PNG (Chromium) + voz ElevenLabs → MP4.
# uso: .venv/bin/python build.py <salida_dir> [video ...]
import json, os, subprocess, sys, html
from guiones import VIDEOS
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
MOTOR = os.path.expanduser('~/Documents/videos-propuesta/_motor')
FF = open(f'{MOTOR}/ff.path').read().strip()
KEY = [l.split('=', 1)[1].strip().strip('"') for l in open(os.path.expanduser('~/.claude/voz.env')) if l.startswith('ELEVENLABS_API_KEY')][0]
VOZ = 'CSmLPGVvfSyFSjFdlTSm'  # "Libia IA"
OUT = sys.argv[1]; SOLO = sys.argv[2:] or list(VIDEOS)
W, H = 1280, 720

CSS = """
*{box-sizing:border-box;margin:0}
body{width:1280px;height:720px;background:#f5f1ea;color:#2d2a26;font-family:Inter,system-ui,sans-serif;
 background-image:linear-gradient(rgba(45,42,38,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(45,42,38,.04) 1px,transparent 1px);
 background-size:40px 40px;display:flex;flex-direction:column;padding:56px 80px;position:relative}
.top{font-family:'Space Mono',monospace;font-size:15px;letter-spacing:.12em;color:#782626;display:flex;justify-content:space-between}
.top b{color:#2d2a26}
h1{font-size:64px;line-height:1.05;font-weight:700;letter-spacing:-.02em;margin-top:28px;text-wrap:balance}
.sub{font-family:'Space Mono',monospace;font-size:20px;color:#7a766f;margin-top:18px}
.centro{flex:1;display:flex;flex-direction:column;justify-content:center}
.nav{margin-top:26px;border:1.5px solid rgba(45,42,38,.25);background:rgba(255,255,255,.75);flex:1;display:flex;flex-direction:column}
.bar{border-bottom:1.5px solid rgba(45,42,38,.15);padding:12px 18px;display:flex;gap:10px;align-items:center;font-family:'Space Mono',monospace;font-size:17px;color:#7a766f}
.dot{width:12px;height:12px;border-radius:50%;background:rgba(45,42,38,.2)}
.url{margin-left:14px;padding:6px 14px;background:#f5f1ea;flex:1}
.cuerpo{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:16px;padding:20px}
.campo{width:560px;border:1.5px solid rgba(45,42,38,.25);padding:14px 18px;font-size:22px;background:#fff}
.boton{margin-top:10px;background:#782626;color:#f5f1ea;font-weight:600;font-size:24px;padding:16px 36px;position:relative;
 box-shadow:0 0 0 8px rgba(120,38,38,.15)}
.cursor{position:absolute;right:-34px;bottom:-30px;font-size:44px}
.nota{font-family:'Space Mono',monospace;font-size:16px;color:#7a766f}
ul{list-style:none;margin-top:34px;display:flex;flex-direction:column;gap:18px}
li{font-size:32px;display:flex;gap:22px;align-items:baseline}
li span{font-family:'Space Mono',monospace;color:#782626;font-size:22px}
.marca{position:absolute;bottom:26px;right:80px;font-family:'Space Mono',monospace;font-size:14px;color:#a9a49d}
"""

def escena_html(tipo, d, video, n, total):
    top = f'<div class="top"><span>[::] AZXION · ONBOARDING</span><b>{n:02d}/{total:02d}</b></div>'
    e = html.escape
    if tipo == 'titulo':
        cuerpo = f'<div class="centro"><h1>{e(d["t"])}</h1><div class="sub">// {e(d["s"])}</div></div>'
    elif tipo == 'lista':
        items = ''.join(f'<li><span>{i+1:02d}</span>{e(x)}</li>' for i, x in enumerate(d['items']))
        cuerpo = f'<h1 style="font-size:52px">{e(d["t"])}</h1><ul>{items}</ul>'
    else:
        campos = ''.join(f'<div class="campo">{e(c)}</div>' for c in d['campos'])
        nota = f'<div class="nota">{e(d["nota"])}</div>' if d.get('nota') else ''
        cuerpo = (f'<h1 style="font-size:46px;margin-top:20px">{e(d["t"])}</h1>'
                  f'<div class="nav"><div class="bar"><i class="dot"></i><i class="dot"></i><i class="dot"></i>'
                  f'<span class="url">{e(d["url"])}</span></div><div class="cuerpo">{campos}'
                  f'<div class="boton">{e(d["boton"])}<span class="cursor">👆</span></div>{nota}</div></div>')
    return f'<!doctype html><meta charset=utf-8><style>{CSS}</style><body>{top}{cuerpo}<div class="marca">onboarding.azxion.com</div></body>'

def tts(texto, mp3):
    if os.path.exists(mp3) and os.path.getsize(mp3) > 1000: return
    body = {"text": texto, "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.4, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True}}
    tmp = mp3 + '.json'; json.dump(body, open(tmp, 'w'))
    for intento in range(3):
      r = subprocess.run(["curl", "-s", "--max-time", "90", "-o", mp3, "-w", "%{http_code}", "-X", "POST",
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOZ}?output_format=mp3_44100_128",
        "-H", f"xi-api-key: {KEY}", "-H", "Content-Type: application/json", "--data-binary", "@" + tmp],
        capture_output=True, text=True)
      if r.stdout == '200': break
    os.remove(tmp)
    if r.stdout != '200':
        err = open(mp3, errors='ignore').read()[:300] if os.path.exists(mp3) else r.stderr
        if os.path.exists(mp3): os.remove(mp3)
        raise SystemExit(f'ElevenLabs HTTP {r.stdout}: {err}')

def dur(path):
    out = subprocess.run([FF, '-i', path], capture_output=True, text=True).stderr
    h, m, s = out.split('Duration: ')[1].split(',')[0].split(':')
    return int(h) * 3600 + int(m) * 60 + float(s)

os.makedirs(OUT, exist_ok=True)
with sync_playwright() as p:
    nav = p.chromium.launch()
    pag = nav.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
    for v in SOLO:
        work = os.path.join(HERE, 'work', v); os.makedirs(work, exist_ok=True)
        escenas = VIDEOS[v]; partes = []
        for i, ((tipo, d), texto) in enumerate(escenas):
            png, mp3, mp4 = f'{work}/e{i}.png', f'{work}/e{i}.mp3', f'{work}/e{i}.mp4'
            pag.set_content(escena_html(tipo, d, v, i + 1, len(escenas))); pag.wait_for_timeout(150)
            pag.screenshot(path=png)
            tts(texto, mp3)
            t = dur(mp3) + 0.6
            frames = int(t * 30)
            # acercamiento lento (Ken Burns) para que no se sienta estático
            subprocess.run([FF, '-y', '-loglevel', 'error', '-loop', '1', '-i', png, '-i', mp3,
                '-filter_complex', f"[0]scale=2560:1440,zoompan=z='min(1+on*0.00025,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps=30,format=yuv420p[v];[1]apad=pad_dur=0.6[a]",
                '-map', '[v]', '-map', '[a]', '-t', f'{t:.2f}', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
                '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', mp4], check=True)
            partes.append(mp4)
        lista = f'{work}/lista.txt'; open(lista, 'w').write(''.join(f"file '{x}'\n" for x in partes))
        final = os.path.join(OUT, f'{v}.mp4')
        subprocess.run([FF, '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-movflags', '+faststart', final], check=True)
        print(v, f'{dur(final):.1f}s', flush=True)
    nav.close()
