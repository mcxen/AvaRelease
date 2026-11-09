// Animated visuals for the landing page: ASCII volcano, task-window loop and feature demos.
// Text comes from the dictionaries below; the page language is read from <html lang>.
(() => {
  const lang = document.documentElement.lang === "en" ? "en" : "zh";
  const BASE = new URL("./", (document.currentScript && document.currentScript.src) || location.href).href;
  const mediaUrl = (name) => new URL(`media/${name}`, BASE).href;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const pad = (n) => String(Math.floor(n)).padStart(2, "0");
  const clock = (s) => `${pad(s / 60)}:${pad(s % 60)}`;
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  // Run step(seconds) every frame while `node` is on screen. With reduced motion, draw one still frame.
  function whenVisible(node, step, still = 0) {
    let on = false, raf = 0, t0 = 0, last = 0;
    const frame = (now) => { last = (now - t0) / 1000; step(last); raf = requestAnimationFrame(frame); };
    if (reduce) { step(still); return; }
    new IntersectionObserver((entries) => {
      const visible = entries[0].isIntersecting;
      if (visible && !on) { on = true; t0 = performance.now() - last * 1000; raf = requestAnimationFrame(frame); }
      else if (!visible && on) { on = false; cancelAnimationFrame(raf); }
    }, { threshold: 0.05 }).observe(node);
  }

  /* ---------- ASCII volcano on canvas ---------- */
  function volcano(canvas) {
    const ctx = canvas.getContext("2d");
    const FS = 13;
    let W = 0, H = 0, CW = 8, CH = FS, cols = 0, rows = 0;
    const embers = Array.from({ length: 46 }, () => ({ x: 0, y: -1, vx: 0, vy: 0, life: 0 }));
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random() * 0.4, p: Math.random() * 6 }));
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FS}px "Fragment Mono",ui-monospace,Menlo,Consolas,monospace`;
      ctx.textBaseline = "top";
      CW = ctx.measureText("M").width; CH = FS * 1.02;
      cols = Math.floor(W / CW); rows = Math.floor(H / CH);
    }
    resize();
    new ResizeObserver(resize).observe(canvas);
    const SMOKE = " .:-=+*#%@", ROCK = ".:;+=x%#", FLAME = "*+#%@&";
    const cx = () => W / 2;
    function spawn(e, t) {
      const half = Math.min(W * 0.1, H * 0.13);
      e.x = cx() + (Math.random() - 0.5) * half * 1.6; e.y = H * 0.5 - Math.random() * CH;
      e.vx = (Math.random() - 0.5) * 22 + Math.sin(t) * 6; e.vy = -(30 + Math.random() * 70); e.life = 1;
    }
    let prev = 0;
    function draw(t) {
      const dt = Math.min(0.05, t - prev); prev = t;
      ctx.clearRect(0, 0, W, H);
      const peak = H * 0.5, half = Math.min(W * 0.1, H * 0.13), slope = 0.6;
      for (const s of stars) {
        const a = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.5 + s.p));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillText(s.p > 3 ? "." : "+", Math.floor((s.x * cols)) * CW, Math.floor((s.y * rows)) * CH);
      }
      for (let y = 0; y < rows; y++) {
        const py = y * CH;
        for (let x = 0; x < cols; x++) {
          const px = x * CW, dx = px - cx();
          const surf = peak + Math.max(0, Math.abs(dx) - half) * slope;
          const n = 0.5 + 0.5 * Math.sin(x * 0.9 + y * 1.7 - t * 2.3 + Math.sin(y * 0.5 + t));
          let ch = "", fill = "";
          const lake = Math.abs(dx) < half * 0.95 && py > peak - CH * 1.6 && py <= peak + CH * 1.2;
          const streamR = cx() + half * 0.55 + (py - peak) * 0.38 + Math.sin(py * 0.05 - t * 2) * 7;
          const streamL = cx() - half * 0.5 - (py - peak) * 0.3 + Math.sin(py * 0.06 - t * 1.6 + 2) * 6;
          if (lake) {
            const k = 0.5 + 0.5 * Math.sin(x * 1.3 - t * 3 + y);
            ch = FLAME[Math.floor(k * (FLAME.length - 1))];
            fill = `hsl(${18 + k * 24},95%,${52 + k * 20}%)`;
          } else if (py > surf && py - CH <= surf) {
            ch = Math.abs(dx) <= half ? "_" : dx < 0 ? "/" : "\\";
            fill = "rgba(236,176,132,.85)";
          } else if (py > surf) {
            const onStream = py > peak + CH && (Math.abs(px - streamR) < CW * 1.1 || Math.abs(px - streamL) < CW * 0.8);
            if (onStream) {
              const k = 0.5 + 0.5 * Math.sin(py * 0.2 - t * 4 + x);
              ch = FLAME[Math.floor(k * 3)];
              fill = `hsl(${14 + k * 20},90%,${44 + k * 18}%)`;
            } else {
              const glow = Math.exp(-Math.hypot(dx, py - peak) / (H * 0.32));
              const level = clamp(0.2 + 0.5 * n + glow * 0.5, 0, 0.99);
              if (level > 0.38) {
                ch = ROCK[Math.floor(level * ROCK.length)];
                fill = `rgba(${130 + glow * 120},${100 + glow * 20},${92 - glow * 40},${0.22 + glow * 0.5})`;
              }
            }
          } else {
            const dy = peak - py;
            if (dy > 0) {
              const spread = half * 0.7 + dy * 0.42;
              const ox = Math.sin(dy * 0.028 - t * 1.1) * dy * 0.14;
              const d = Math.min(1, 1.5 * Math.exp(-(((dx - ox) / spread) ** 2)) * clamp(1 - dy / (H * 0.52)) * (0.5 + 0.5 * n));
              if (d > 0.1) {
                ch = SMOKE[Math.min(SMOKE.length - 1, Math.floor(d * SMOKE.length * 1.3))];
                const warm = clamp(1 - dy / (H * 0.2));
                fill = `rgba(${190 + warm * 60},${195 - warm * 60},${205 - warm * 120},${0.2 + d * 0.65})`;
              }
            }
          }
          if (ch && ch !== " ") { ctx.fillStyle = fill; ctx.fillText(ch, px, py); }
        }
      }
      for (const e of embers) {
        if (e.life <= 0) { if (Math.random() < 0.08) spawn(e, t); continue; }
        e.x += e.vx * dt; e.y += e.vy * dt; e.vx += Math.sin(t * 2 + e.y * 0.05) * 14 * dt; e.life -= dt * 0.38;
        ctx.fillStyle = `hsla(${22 + e.life * 20},100%,${55 + e.life * 15}%,${clamp(e.life)})`;
        ctx.fillText(e.life > 0.55 ? "*" : ".", Math.round(e.x / CW) * CW, Math.round(e.y / CH) * CH);
      }
    }
    whenVisible(canvas, draw, 2.5);
  }

  /* ---------- task window loop (stages section) ---------- */
  function stageLoop() {
    const win = document.querySelector(".dark-win");
    if (!win) return;
    const items = [...win.querySelectorAll("ol li")];
    const bar = win.querySelector(".progress div");
    const stats = [...win.querySelectorAll(".stat-row b")];
    const frames = [...win.querySelectorAll(".frames i")];
    const counter = win.querySelector("aside em");
    const queueBars = [...document.querySelectorAll(".queue .progress div")];
    const base = queueBars.map((b) => parseFloat(b.style.width));
    const mark = (li, state, label) => {
      li.className = state;
      const s = li.querySelector("span");
      s.className = state === "run" ? "spin" : "";
      s.textContent = state === "run" ? "" : label;
    };
    const T = 12;
    whenVisible(win, (t) => {
      const p = (t % T) / T;
      const third = ease(seg(p, 0.06, 0.62));
      const fourth = ease(seg(p, 0.66, 0.92));
      const overall = p < 0.62 ? lerp(0.25, 0.74, third) : lerp(0.74, 1, fourth);
      bar.style.width = `${(overall * 100).toFixed(1)}%`;
      stats[0].textContent = clock(lerp(98, 312, overall) % 600);
      stats[1].textContent = String(Math.min(11, 3 + Math.floor(overall * 9)));
      stats[2].textContent = `${Math.round(overall * 100)}%`;
      const done = p > 0.62, finished = p > 0.92;
      mark(items[2], done ? "done" : "run", done ? "✓" : "");
      mark(items[3], finished ? "done" : done ? "run" : "", finished ? "✓" : "4");
      counter.textContent = `${finished ? 4 : done ? 3 : 2} / 4`;
      const lit = Math.floor(overall * frames.length);
      frames.forEach((f, i) => { f.className = i < lit ? "d" : i === lit ? "r" : ""; });
      queueBars[1].style.width = `${(base[1] + 20 * Math.sin(t * 0.6)).toFixed(1)}%`;
      queueBars[2].style.width = `${(base[2] + 6 * Math.sin(t * 0.4 + 1)).toFixed(1)}%`;
    }, T * 0.55);
  }

  /* ---------- feature demos ---------- */
  const TXT = {
    zh: {
      tabs: { convert: "格式转换", clip: "快速剪辑", subs: "自动字幕", summary: "视频总结", tags: "标签整理", pdf: "PDF" },
      title: { convert: "格式转换 · 旅行.mov", clip: "快速剪辑 · 旅行片段.mp4", subs: "自动字幕 · 旅行.mp4", summary: "视频总结 · 旅行.mp4", tags: "自动标签与媒体整理", pdf: "PDF 工作区" },
      steps: {
        convert: ["拖入文件，选择目标格式或预设", "设置画质、码率或目标体积，可用显卡硬件转码", "加入队列，完成后对比前后体积"],
        clip: ["拖动播放头，点“设为起点”和“设为终点”框定要保留的片段", "右侧片段列表实时显示起点、终点和时长，可新增、分割、删除片段", "点“下一步：导出选项”，选择输出格式和保存位置，再开始导出"],
        subs: ["本地语音识别，文件不离开电脑", "逐句校对时间和文字", "导出字幕文件，或烧录进视频"],
        summary: ["语音识别与画面抽帧", "按分段理解画面和语音", "生成带章节的报告，线上模型会明确提示"],
        tags: ["给图片和视频打中文标签", "按标签、语义、人物、时长分组", "复制或移动到文件夹，可撤销"],
        pdf: ["可视化选页，拖动排序", "旋转倒置的页面，拆分或合并", "导出新的 PDF，也能提取文字或压缩"]
      },
      convert: { file: "旅行.mov", out: "旅行.mp4", wait: "等待", run: "转换中", done: "完成 ✓", saved: "体积 -83%" },
      subs: { lines: ["今天我们去了海边，天气非常好。", "先在沙滩上走了一会儿。", "下午换到老街，吃了当地的小吃。"], run: "识别中", proof: "校对 ✓", srt: "导出 .srt", burn: "烧录进视频" },
      summary: { stages: ["语音识别", "抽取画面", "逐段理解", "成文报告"], chapters: ["港口与水面", "船只穿行", "岸边建筑", "收尾画面"], head: "章节" },
      tags: { names: ["海边", "山景", "美食", "花园"] },
      pdf: { merged: "合并.pdf · 3 页", rotate: "旋转", order: "排序", merge: "合并" }
    },
    en: {
      tabs: { convert: "Convert", clip: "Quick clip", subs: "Subtitles", summary: "Summary", tags: "Tagging", pdf: "PDF" },
      title: { convert: "Convert · trip.mov", clip: "Quick clip · trip segment.mp4", subs: "Auto subtitles · trip.mp4", summary: "Video summary · trip.mp4", tags: "Auto tagging & organizing", pdf: "PDF workspace" },
      steps: {
        convert: ["Drop a file and pick a format or preset", "Set quality, bitrate or target size; GPU encoding when available", "Queue it and compare sizes when it finishes"],
        clip: ["Drag the playhead, then press Set start and Set end to frame the part you keep", "The segment panel shows start, end and duration live; add, split or delete segments", "Press Next: export options, pick the output format and folder, then export"],
        subs: ["Local speech recognition; files stay on your machine", "Proofread timing and text line by line", "Export a subtitle file or burn it into the video"],
        summary: ["Speech recognition and frame extraction", "Segment-by-segment analysis of picture and speech", "A chaptered report; online models are clearly flagged"],
        tags: ["Tag images and videos", "Group by tag, meaning, person or duration", "Copy or move into folders, with undo"],
        pdf: ["Pick pages visually and drag to reorder", "Rotate sideways pages, split or merge", "Export a new PDF, extract text or compress"]
      },
      convert: { file: "trip.mov", out: "trip.mp4", wait: "Waiting", run: "Converting", done: "Done ✓", saved: "Size -83%" },
      subs: { lines: ["Today we went to the beach, and the weather was great.", "We walked along the sand for a while.", "In the afternoon we tried local snacks in the old town."], run: "Recognizing", proof: "Proofread ✓", srt: "Export .srt", burn: "Burn into video" },
      summary: { stages: ["Speech to text", "Extract frames", "Segment analysis", "Write report"], chapters: ["Harbour and water", "Boats crossing", "Waterfront", "Closing shot"], head: "Chapters" },
      tags: { names: ["Beach", "Mountains", "Food", "Garden"] },
      pdf: { merged: "merged.pdf · 3 pages", rotate: "Rotate", order: "Reorder", merge: "Merge" }
    }
  }[lang];

  const QC = lang === "en" ? {
    title: "Quick clip · trip segment.mp4", tabs: ["Edit", "Crop", "Auto-level"],
    add: "Add segment", split: "Split here", setStart: "Set start", setEnd: "Set end",
    clip: "Segments", seg: "Segment 1", startEnd: "Start / end", start: "Start", end: "End",
    speed: "Speed", def: "Default", fade: "Fade in / out", off: "Off", crop: "Crop", none: "None", rot: "Rotation", keep: "Keep orientation",
    play: "Play segment", preview: "Preview result", invert: "Invert: remove selected", output: "Output settings…", next: "Next: export options →",
    prec: "Precision", count: "1 segment · total output"
  } : {
    title: "快速剪辑 · 旅行片段.mp4", tabs: ["剪辑", "画面裁剪", "自动转正"],
    add: "新增片段", split: "在此分割", setStart: "设为起点", setEnd: "设为终点",
    clip: "片段", seg: "片段 1", startEnd: "起点 / 终点", start: "起点", end: "终点",
    speed: "速度", def: "默认", fade: "淡入 / 淡出", off: "关闭", crop: "裁剪", none: "无", rot: "旋转方向", keep: "保持原方向",
    play: "播放片段", preview: "预览结果", invert: "反选：去除所选片段", output: "输出配置…", next: "下一步：导出选项 →",
    prec: "精度", count: "1 个片段 · 总输出时长"
  };

  const SCENES = {
    convert: { T: 8, init(root) {
      const t = TXT.convert;
      const thumb = mediaUrl("poster-water.webp");
      root.innerHTML = `
        <div class="cv-file card"><img class="th" src="${thumb}" alt=""><div><b>${t.file}</b><small class="cv-size mono">1.8 GB</small></div></div>
        <div class="cv-arrow mono" aria-hidden="true">====&gt;</div>
        <div class="cv-out card"><img class="th" src="${thumb}" alt=""><div><b>${t.out}</b><small class="cv-size2 mono"></small></div><span class="cv-saved pill ok">${t.saved}</span></div>
        <div class="cv-chips"><span class="chip on">MP4 · H.265</span><span class="chip">MKV</span><span class="chip">WEBM</span><span class="chip">GPU</span></div>
        <div class="cv-bar"><div class="mono cv-ascii"></div><div class="progress"><div></div></div><div class="cv-row"><span class="cv-state pill wait"></span><span class="mono cv-pct"></span></div></div>`;
      const q = (s) => root.querySelector(s);
      const file = q(".cv-file"), out = q(".cv-out"), arrow = q(".cv-arrow"), chips = [...root.querySelectorAll(".chip")];
      const bar = q(".progress div"), asc = q(".cv-ascii"), st = q(".cv-state"), pct = q(".cv-pct"), s1 = q(".cv-size"), s2 = q(".cv-size2"), saved = q(".cv-saved");
      return (p) => {
        file.style.opacity = seg(p, 0, 0.08);
        file.style.transform = `translateY(${(1 - seg(p, 0, 0.08)) * 12}px)`;
        chips.forEach((c, i) => c.classList.toggle("on", i === 0 ? p > 0.14 : false));
        const pr = ease(seg(p, 0.3, 0.86));
        bar.style.width = `${pr * 100}%`;
        const n = Math.round(pr * 24);
        asc.textContent = `[${"#".repeat(n)}${"-".repeat(24 - n)}]`;
        pct.textContent = `${Math.round(pr * 100)}%`;
        const mb = lerp(1800, 312, pr);
        s2.textContent = mb >= 1000 ? `${(mb / 1000).toFixed(2)} GB` : `${Math.round(mb)} MB`;
        s1.textContent = "1.8 GB";
        out.style.opacity = seg(p, 0.3, 0.38);
        saved.style.opacity = seg(p, 0.86, 0.92);
        arrow.textContent = p > 0.3 && p < 0.86 ? ["=>   ", "==>  ", "===> ", "====>"][Math.floor(p * 40) % 4] : "====>";
        arrow.style.opacity = p > 0.28 ? 1 : 0.25;
        st.textContent = p < 0.3 ? t.wait : p < 0.86 ? t.run : t.done;
        st.className = "cv-state pill " + (p < 0.3 ? "wait" : p < 0.86 ? "run" : "ok");
      };
    } },

    clip: { T: 14, init(root) {
      const Q = QC;
      const TOTAL = 8, TRACK = 548, A = 2, B = 6, E0 = TOTAL;
      const CLIPS = {
        city: { video: "clip-city.mp4", poster: "poster-city.webp", strip: "strip-city.webp", start: "start-city.webp", end: "end-city.webp" },
        water: { video: "clip-water.mp4", poster: "poster-water.webp", strip: "strip-water.webp", start: "start-water.webp", end: "end-water.webp" }
      };
      const media = (name) => new URL(`media/${name}`, BASE).href;
      const f = (s) => s / TOTAL;
      const fmt = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return `${pad(m)}:${r.toFixed(3).padStart(6, "0")}`; };
      const ruler = Array.from({ length: TOTAL + 1 }, (_, i) => `<span style="left:${(f(i) * TRACK).toFixed(1)}px">0:${String(i).padStart(2, "0")}</span>`).join("");
      root.innerHTML = `<div class="qc-scale"><div class="qc" aria-hidden="true">
        <div class="qc-bar">
          <span class="qc-dots"><i></i><i></i><i></i></span>
          <span class="qc-app"></span>
          <span class="qc-title">${Q.title}</span>
          <div class="qc-tabs"><span class="on">${Q.tabs[0]}</span><span>${Q.tabs[1]}</span><span>${Q.tabs[2]}</span></div>
          <span class="qc-undo">↶ &nbsp;↷</span>
        </div>
        <div class="qc-preview"><video class="qc-video" muted playsinline preload="auto"></video><span class="qc-badge"></span></div>
        <div class="qc-transport">
          <span class="qc-time"></span>
          <span class="qc-ctl">⏮ &nbsp; ◀ &nbsp; <b class="qc-play">▶</b> &nbsp; ▶ &nbsp; ⏭ &nbsp; ■</span>
          <span class="qc-prec">${Q.prec} 0.1 s</span>
        </div>
        <div class="qc-timeline">
          <div class="qc-tools">
            <span>＋ ${Q.add}</span><span>✂ ${Q.split}</span><span class="b-ss">${Q.setStart}</span><span class="b-se">${Q.setEnd}</span>
          </div>
          <div class="qc-ruler">${ruler}</div>
          <div class="qc-track">
            <div class="qc-thumbs"></div>
            <div class="qc-mask ml"></div><div class="qc-mask mr"></div>
            <div class="qc-seg"></div>
            <div class="qc-head"></div>
          </div>
          <div class="qc-count"></div>
        </div>
        <aside class="qc-side">
          <div class="qc-sidehead">${Q.clip}</div>
          <div class="qc-card"><div class="qc-strip"><i></i><i></i></div><div class="qc-cardtxt"><b class="seg-name"></b><small class="seg-range"></small></div><span class="seg-dur"></span></div>
          <div class="qc-sub">${Q.seg} · ${Q.startEnd}</div>
          <div class="qc-pair">
            <div class="qc-pthumb ps"><em>${Q.start}</em></div>
            <div class="qc-pthumb pe"><em>${Q.end}</em></div>
          </div>
          <div class="qc-times"><span class="t-start"></span><span class="t-end"></span></div>
          <div class="qc-rows">
            <div><span>${Q.speed}</span><b>${Q.def}</b></div>
            <div><span>${Q.fade}</span><b>${Q.off} · ${Q.off}</b></div>
            <div><span>${Q.crop}</span><b>${Q.none} ›</b></div>
            <div><span>${Q.rot}</span><b>${Q.keep}</b></div>
          </div>
          <div class="qc-btns"><span>▷ ${Q.play}</span><span>◉ ${Q.preview}</span></div>
          <div class="qc-inv"><i></i>${Q.invert}</div>
        </aside>
        <div class="qc-foot">
          <span class="qc-footname">${Q.seg}</span>
          <span class="qc-out">${Q.output}</span>
          <span class="qc-next">${Q.next}</span>
        </div>
        <div class="qc-ring"></div>
        <svg class="qc-cursor" width="14" height="20" viewBox="0 0 14 20"><path d="M1 1v15l4-4 3 7 2.6-1.2-3-6.6H13z" fill="#fff" stroke="#000" stroke-width="1"/></svg>
      </div></div>`;

      const q = (s) => root.querySelector(s);
      const scale = () => { const s = root.clientWidth / 1000; q(".qc").style.transform = `scale(${s})`; q(".qc-scale").style.height = `${640 * s}px`; };
      scale();
      if (root._qcObserver) root._qcObserver.disconnect();
      root._qcObserver = new ResizeObserver(scale);
      root._qcObserver.observe(root);

      const video = q(".qc-video"), thumbs = q(".qc-thumbs"), pS = q(".ps"), pE = q(".pe");
      const head = q(".qc-head"), seg = q(".qc-seg"), ml = q(".ml"), mr = q(".mr");
      const badge = q(".qc-badge"), time = q(".qc-time"), count = q(".qc-count"), root2 = q(".qc");
      const sName = q(".seg-name"), sRange = q(".seg-range"), sDur = q(".seg-dur"), tS = q(".t-start"), tE = q(".t-end");
      const cursor = q(".qc-cursor"), ring = q(".qc-ring"), bSS = q(".b-ss"), bSE = q(".b-se"), next = q(".qc-next");
      sName.textContent = Q.seg;
      q(".qc-footname").textContent = Q.seg;
      video.muted = true;

      let current = null;
      const useClip = (key) => {
        if (current === key) return;
        current = key;
        const c = CLIPS[key];
        video.poster = media(c.poster);
        video.src = media(c.video);
        video.load();
        thumbs.style.backgroundImage = `url("${media(c.strip)}")`;
        pS.style.backgroundImage = `url("${media(c.start)}")`;
        pE.style.backgroundImage = `url("${media(c.end)}")`;
      };

      // playhead in fractions of the clip: hold, move to A, hold, move to B
      const xPh = (p) => (p < 0.10 ? 0 : p < 0.32 ? clamp((p - 0.10) / 0.22) * f(A) : p < 0.49 ? f(A) : p < 0.72 ? f(A) + clamp((p - 0.49) / 0.23) * (f(B) - f(A)) : f(B));
      const KEYS = [[0, 60, 520], [0.10, 26, 523], [0.32, 26 + f(A) * TRACK, 523], [0.355, 293, 447], [0.49, 26 + f(A) * TRACK, 523], [0.72, 26 + f(B) * TRACK, 523], [0.76, 397, 447], [0.84, 397, 447], [0.86, 891, 618], [1, 891, 618]];
      const cursorAt = (p) => {
        for (let i = 0; i < KEYS.length - 1; i++) {
          const [a, ax, ay] = KEYS[i], [b, bx, by] = KEYS[i + 1];
          if (p <= b) { const t = (p - a) / (b - a || 1); return [ax + (bx - ax) * t, ay + (by - ay) * t]; }
        }
        return [891, 618];
      };
      const PRESS = [[0.37, 0.39, 293, 447, bSS], [0.77, 0.79, 397, 447, bSE], [0.875, 0.895, 891, 618, next]];

      return (p, tt) => {
        useClip(Math.floor(tt / 14) % 2 ? "water" : "city");
        const ph = xPh(p), at = ph * TOTAL;
        if (video.readyState >= 1 && Math.abs(video.currentTime - at) > 0.12) video.currentTime = at;
        const startS = p >= 0.39 ? A : 0;
        const endS = p >= 0.79 ? B : E0;
        const op = Math.min(clamp(p / 0.05), clamp((1 - p) / 0.06));
        root2.style.opacity = op.toFixed(3);
        head.style.left = `${(ph * TRACK).toFixed(1)}px`;
        seg.style.left = `${(f(startS) * TRACK).toFixed(1)}px`;
        seg.style.width = `${((f(endS) - f(startS)) * TRACK).toFixed(1)}px`;
        ml.style.width = `${(f(startS) * TRACK).toFixed(1)}px`;
        mr.style.width = `${((1 - f(endS)) * TRACK).toFixed(1)}px`;
        badge.textContent = `${Q.seg} · ${fmt(startS)} — ${fmt(endS)}`;
        time.textContent = `${fmt(at)} / ${fmt(TOTAL)}`;
        count.textContent = `${Q.count} ${fmt(endS - startS)}`;
        sRange.textContent = `${fmt(startS)} — ${fmt(endS)}`;
        sDur.textContent = `${(endS - startS).toFixed(1)} s`;
        tS.textContent = fmt(startS);
        tE.textContent = fmt(endS);
        const [cx, cy] = cursorAt(p);
        cursor.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
        let pressed = null;
        PRESS.forEach(([a, b, x, y, el]) => { el.classList.toggle("on", p >= a && p <= b); if (p >= a && p <= b) pressed = [x, y]; });
        if (pressed) { ring.style.opacity = "1"; ring.style.transform = `translate(${pressed[0] - 14}px, ${pressed[1] - 14}px)`; }
        else ring.style.opacity = "0";
      };
    } },

    subs: { T: 10, init(root) {
      const t = TXT.subs, N = 40;
      root.innerHTML = `
        <div class="sub-top"><span class="pill run sub-state"></span><span class="mono sub-clock">00:00</span></div>
        <img class="sub-bg" src="${mediaUrl("poster-city.webp")}" alt="">
        <div class="wave">${"<i></i>".repeat(N)}</div>
        <div class="sub-lines">${t.lines.map((l, i) => `<div class="sub-line"><span class="mono">${clock(2 + i * 4.5 + (i > 1 ? 1.5 : 0))}</span><span class="sub-text"></span></div>`).join("")}</div>
        <div class="sub-actions"><span class="chip">${t.proof}</span><span class="chip">${t.srt}</span><span class="chip">${t.burn}</span></div>`;
      const bars = [...root.querySelectorAll(".wave i")], lines = [...root.querySelectorAll(".sub-line")], texts = [...root.querySelectorAll(".sub-text")];
      const acts = [...root.querySelectorAll(".sub-actions .chip")], state = root.querySelector(".sub-state"), clk = root.querySelector(".sub-clock");
      const starts = [0.12, 0.38, 0.62];
      return (p, tt) => {
        const speaking = starts.some((s) => p > s && p < s + 0.2);
        bars.forEach((b, i) => {
          const amp = speaking ? 0.35 + 0.65 * Math.abs(Math.sin(i * 0.7 + tt * 6)) * (0.6 + 0.4 * Math.sin(i * 1.9 + tt * 2.3)) : 0.1 + 0.05 * Math.sin(i + tt * 2);
          b.style.height = `${3 + amp * 26}px`;
        });
        clk.textContent = clock(p * 14);
        state.textContent = p < 0.9 ? `${t.run} ${"▮".repeat(1 + Math.floor(tt * 3) % 3)}` : t.proof;
        state.className = "pill sub-state " + (p < 0.9 ? "run" : "ok");
        lines.forEach((ln, i) => {
          const f = seg(p, starts[i], starts[i] + 0.2);
          ln.style.opacity = f > 0 ? 1 : 0;
          texts[i].textContent = t.lines[i].slice(0, Math.floor(f * t.lines[i].length));
        });
        acts.forEach((a, i) => { a.style.opacity = seg(p, 0.86 + i * 0.03, 0.9 + i * 0.03); });
      };
    } },

    summary: { T: 10, init(root) {
      const t = TXT.summary;
      const frames = ["sum-water-2", "sum-water-6", "sum-water-10", "sum-water-14"], times = [2, 6, 10, 14];
      root.innerHTML = `
        <div class="sm-cols">
          <ol class="sm-stages">${t.stages.map((s) => `<li><span></span>${s}</li>`).join("")}</ol>
          <div class="sm-report"><b class="mono">${t.head}</b>${t.chapters.map((c, i) => `<div class="sm-ch"><img src="${mediaUrl(frames[i] + ".webp")}" alt=""><span class="mono">${clock(times[i])}</span>${c}</div>`).join("")}</div>
        </div>
        <div class="progress sm-bar"><div></div></div>`;
      const lis = [...root.querySelectorAll(".sm-stages li")], chs = [...root.querySelectorAll(".sm-ch")], bar = root.querySelector(".sm-bar div");
      return (p) => {
        bar.style.width = `${clamp(p / 0.9) * 100}%`;
        lis.forEach((li, i) => {
          const a = 0.05 + i * 0.2, state = p > a + 0.2 ? "done" : p > a ? "run" : "";
          li.className = state;
          const s = li.querySelector("span");
          s.className = state === "run" ? "spin" : "";
          s.textContent = state === "done" ? "✓" : state === "run" ? "" : String(i + 1);
        });
        chs.forEach((c, i) => {
          const f = ease(seg(p, 0.5 + i * 0.1, 0.58 + i * 0.1));
          c.style.opacity = f; c.style.transform = `translateX(${(1 - f) * 18}px)`;
        });
      };
    } },

    tags: { T: 9, init(root) {
      const t = TXT.tags, order = [0, 1, 2, 3, 0, 1, 2, 3];
      const sets = [["tile-beach1", "tile-beach2"], ["tile-mount1", "tile-mount2"], ["tile-food1", "tile-food2"], ["tile-flower1", "tile-flower2"]];
      const within = [], cnt = [0, 0, 0, 0];
      order.forEach((g, i) => { within[i] = cnt[g]++; });
      const tiles = order.map((g, i) => `<div class="tile" style="background-image:url('${mediaUrl(sets[g][within[i]] + ".webp")}')"><span class="tag">${t.names[g]}</span></div>`).join("");
      root.innerHTML = `${tiles}${t.names.map((n, g) => `<div class="grp mono" style="left:${6 + g * 24}%">${n}</div>`).join("")}`;
      const els = [...root.querySelectorAll(".tile")], tags = [...root.querySelectorAll(".tag")], grps = [...root.querySelectorAll(".grp")];
      return (p) => {
        const m = ease(seg(p, 0.58, 0.82));
        els.forEach((e, i) => {
          const gx = 4 + (i % 4) * 24, gy = 24 + Math.floor(i / 4) * 140;
          const tx = 6 + order[i] * 24, ty = 64 + within[i] * 44;
          e.style.left = `${lerp(gx, tx, m)}%`;
          e.style.top = `${lerp(gy, ty, m)}px`;
          e.style.transform = `scale(${lerp(1, 0.82, m)})`;
          tags[i].style.opacity = seg(p, 0.1 + i * 0.05, 0.16 + i * 0.05);
        });
        grps.forEach((g) => { g.style.opacity = m; });
      };
    } },

    pdf: { T: 9, init(root) {
      const t = TXT.pdf;
      const pages = ["page-doc1", "page-doc2", "page-doc3"];
      root.innerHTML = `${pages.map((n, i) => `<div class="pg" style="background-image:url('${mediaUrl(n + ".webp")}')"><b>${i + 1}</b></div>`).join("")}
        <div class="pg-label mono"></div><div class="pg-merged pill ok">${t.merged}</div>`;
      const pgs = [...root.querySelectorAll(".pg")], label = root.querySelector(".pg-label"), merged = root.querySelector(".pg-merged");
      const slotX = (s) => 6 + s * 31;
      return (p) => {
        const sw = ease(seg(p, 0.12, 0.3)), rot = ease(seg(p, 0.38, 0.52)), mg = ease(seg(p, 0.64, 0.86));
        pgs.forEach((e, i) => {
          const target = i === 0 ? 0 : i === 1 ? lerp(1, 2, sw) : lerp(2, 1, sw);
          const x = lerp(slotX(target), 36 + i * 1.6, mg);
          const y = lerp(70, 70 - i * 3, mg);
          const angle = i === 2 ? 90 * rot : 0;
          e.style.left = `${x}%`; e.style.top = `${y}px`;
          e.style.transform = `rotate(${angle}deg)`;
          e.style.zIndex = i;
        });
        label.textContent = p < 0.34 ? t.order : p < 0.56 ? t.rotate : p < 0.9 ? t.merge : "";
        merged.style.opacity = seg(p, 0.86, 0.92);
      };
    } }
  };

  function demos() {
    const tabsEl = document.getElementById("demo-tabs"), info = document.getElementById("demo-info");
    const scene = document.getElementById("demo-scene"), title = document.getElementById("demo-title"), stage = document.querySelector(".demo-stage");
    if (!tabsEl) return;
    const keys = Object.keys(SCENES);
    let current = -1, auto = true, update = null, t0 = performance.now(), visible = false, raf = 0;
    tabsEl.innerHTML = keys.map((k, i) => `<button role="tab" id="dt-${k}" aria-selected="false" aria-controls="demo-scene" tabindex="-1" data-i="${i}">${TXT.tabs[k]}</button>`).join("");
    const buttons = [...tabsEl.children];
    function select(i, byUser) {
      if (byUser) auto = false;
      current = i;
      const k = keys[i];
      buttons.forEach((b, j) => { b.setAttribute("aria-selected", String(j === i)); b.tabIndex = j === i ? 0 : -1; });
      title.textContent = TXT.title[k];
      info.innerHTML = `<ol>${TXT.steps[k].map((s, n) => `<li><span class="mono">${n + 1}</span>${s}</li>`).join("")}</ol>`;
      scene.className = "demo-scene scene-" + k;
      scene.innerHTML = "";
      update = SCENES[k].init(scene);
      t0 = performance.now();
      if (reduce) update(0.9, 0.9 * SCENES[k].T);
    }
    function frame(now) {
      const k = keys[current], T = SCENES[k].T, sec = (now - t0) / 1000;
      if (sec >= T && auto) { select((current + 1) % keys.length, false); } else { update((sec % T) / T, sec); }
      raf = requestAnimationFrame(frame);
    }
    tabsEl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) select(+b.dataset.i, true); });
    tabsEl.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const i = (current + d + keys.length) % keys.length;
      select(i, true); buttons[i].focus();
    });
    select(0, false);
    if (!reduce) {
      new IntersectionObserver((es) => {
        const v = es[0].isIntersecting;
        if (v && !visible) { visible = true; t0 = performance.now(); raf = requestAnimationFrame(frame); }
        else if (!v && visible) { visible = false; cancelAnimationFrame(raf); }
      }, { threshold: 0.2 }).observe(stage);
    }
  }

  const canvas = document.getElementById("ascii-volcano");
  if (canvas) volcano(canvas);
  stageLoop();
  demos();
})();
