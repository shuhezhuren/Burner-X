(function () {
  const swatch = document.getElementById("swatch");
  const leather = document.getElementById("leather");
  const fabric = document.getElementById("fabric");
  const photo = document.getElementById("photo");
  const water = document.getElementById("water");
  const cloth = document.getElementById("cloth");
  const status = document.getElementById("status");
  const photoNote = document.getElementById("photoNote");
  const fileInput = document.getElementById("file");
  const compareBtn = document.querySelector('[data-act="compare"]');
  const cutCaption = document.getElementById("cutCaption");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let fabricOn = false;
  let bending = false;
  let touched = false;
  let photoUrl = "";
  let introTimers = [];
  let paintTimer = 0;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function paint(canvas, kind) {
    const rect = swatch.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const maxW = 960;
    const scale = Math.min(window.devicePixelRatio || 1, 2, maxW / width);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    if (canvas.width === w && canvas.height === h && canvas.dataset.kind === kind) return;
    canvas.width = w;
    canvas.height = h;
    canvas.dataset.kind = kind;
    const ctx = canvas.getContext("2d");
    const rand = mulberry32(kind === "leather" ? 0x51da : 0x19ab);

    if (kind === "leather") {
      ctx.fillStyle = "#6f3d28";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = w * (0.12 + rand() * 0.28);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const light = rand() > 0.45;
        g.addColorStop(0, light ? "rgba(186, 112, 68, 0.42)" : "rgba(42, 16, 8, 0.5)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      const gap = Math.max(6, Math.round(7 * scale));
      for (let y = 0; y < h + gap; y += gap) {
        const row = Math.floor(y / gap);
        for (let x = 0; x < w + gap; x += gap) {
          const jx = x + (rand() - 0.5) * gap * 0.45 + (row % 2) * gap * 0.35;
          const jy = y + (rand() - 0.5) * gap * 0.35;
          const rx = (1.6 + rand() * 1.5) * scale;
          const ry = rx * (0.72 + rand() * 0.2);
          ctx.fillStyle = "rgba(" + (28 + rand() * 24) + "," + (12 + rand() * 10) + ",8," + (0.16 + rand() * 0.22) + ")";
          ctx.beginPath();
          ctx.ellipse(jx, jy, rx, ry, (rand() - 0.5) * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,214,176," + (0.035 + rand() * 0.05) + ")";
          ctx.beginPath();
          ctx.ellipse(jx - rx * 0.28, jy - ry * 0.32, rx * 0.5, ry * 0.36, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const vignette = ctx.createRadialGradient(w * 0.45, h * 0.4, w * 0.15, w * 0.5, h * 0.5, w * 0.75);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(28,10,6,0.42)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    ctx.fillStyle = "#c3b19a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(92, 70, 48, 0.22)";
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = "rgba(255, 248, 236, 0.09)";
    for (let x = 0; x < w; x += 3) ctx.fillRect(x, 0, 1, h);
    for (let i = 0; i < 8; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = 40 + rand() * 90;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(90, 68, 46, 0.28)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function repaint() {
    paint(leather, "leather");
    paint(fabric, "fabric");
  }

  function setStatus(text) {
    status.textContent = text;
  }

  function setLive(name) {
    document.querySelectorAll(".props li").forEach((li) => {
      li.dataset.on = li.dataset.live === name ? "true" : "false";
    });
  }

  function clearWater() {
    water.replaceChildren();
  }

  function place(el, x, y, size) {
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.left = x + "px";
    el.style.top = y + "px";
  }

  function trim(limit) {
    while (water.children.length > limit) water.firstElementChild.remove();
  }

  function spawnBead(x, y) {
    const bead = document.createElement("span");
    bead.className = "bead";
    const size = 11 + Math.random() * 12;
    place(bead, x, y, size);
    water.appendChild(bead);
    trim(18);
    const dx = (Math.random() - 0.5) * 28;
    const dy = 10 + Math.random() * 26;
    if (reduced) {
      bead.style.transform = "translate(-50%, -50%)";
      return;
    }
    bead.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.2)", opacity: 0 },
        { transform: "translate(-50%, -62%) scale(1.08)", opacity: 1, offset: 0.28 },
        { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(1)", opacity: 1 }
      ],
      { duration: 780, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" }
    );
  }

  function spawnStain(x, y) {
    const stain = document.createElement("span");
    stain.className = "stain";
    const size = 16 + Math.random() * 14;
    place(stain, x, y, size);
    water.appendChild(stain);
    trim(18);
    if (reduced) {
      stain.style.transform = "translate(-50%, -50%) scale(1.7)";
      return;
    }
    stain.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0.25 },
        { transform: "translate(-50%, -50%) scale(1.85)", opacity: 0.8 }
      ],
      { duration: 650, easing: "ease-out", fill: "forwards" }
    );
  }

  function dropAt(x, y) {
    if (bending) return;
    const rect = swatch.getBoundingClientRect();
    const px = Math.min(Math.max(x, 12), rect.width - 12);
    const py = Math.min(Math.max(y, 12), rect.height - 12);
    if (fabricOn) {
      spawnStain(px, py);
      setLive("");
      setStatus("水渗进去了，颜色变深。这是对照织物，不是这张革。");
      cutCaption.textContent = "水进了织物。切回去，看这张革把水留在面上。";
      return;
    }
    spawnBead(px, py);
    setLive("drop");
    setStatus("水珠鼓在表面上，没有渗进去。");
    cutCaption.textContent = "水在面层上。这是示意，不是显微镜照片。";
  }

  function pour() {
    cancelIntro();
    const rect = swatch.getBoundingClientRect();
    const spots = [
      [0.3, 0.26],
      [0.42, 0.34],
      [0.55, 0.28],
      [0.36, 0.46],
      [0.62, 0.42]
    ];
    spots.forEach(([px, py], i) => {
      const t = setTimeout(() => dropAt(rect.width * px, rect.height * py), reduced ? 0 : i * 90);
      introTimers.push(t);
    });
  }

  function wipe() {
    cancelIntro();
    if (!reduced) {
      cloth.style.opacity = "1";
      const anim = cloth.animate(
        [{ transform: "translateX(-140%)" }, { transform: "translateX(320%)" }],
        { duration: 880, easing: "cubic-bezier(.4,0,.2,1)" }
      );
      anim.onfinish = () => {
        cloth.style.opacity = "0";
      };
    }
    if (fabricOn) {
      [...water.querySelectorAll(".stain")].forEach((el) => {
        if (reduced) return;
        el.animate(
          [
            { transform: "translate(-50%, -50%) scale(1.8)", opacity: 0.8 },
            { transform: "translate(-10%, -50%) scale(2.6, 1.15)", opacity: 0.72 }
          ],
          { duration: 780, fill: "forwards", easing: "ease-out" }
        );
      });
      setLive("");
      setStatus("往旁边一抹，水还在织物里，只是摊大了。");
      return;
    }
    const beads = [...water.querySelectorAll(".bead")];
    if (!beads.length) {
      setLive("wipe");
      setStatus("皮面上没有水。先滴几滴，再擦。");
      return;
    }
    beads.forEach((el, i) => {
      const delay = reduced ? 0 : 180 + i * 50;
      setTimeout(() => {
        el.animate([{ opacity: 1 }, { opacity: 0, transform: "translate(-40%, -80%) scale(0.6)" }], {
          duration: reduced ? 1 : 220,
          fill: "forwards"
        }).onfinish = () => el.remove();
      }, delay);
    });
    setLive("wipe");
    setStatus("水被抹掉了。皮面没有变深。");
  }

  function bend() {
    cancelIntro();
    if (bending) return;
    bending = true;
    swatch.classList.remove("bending");
    void swatch.offsetWidth;
    swatch.classList.add("bending");
    setLive("bend");
    const wet = water.childElementCount > 0;
    setStatus(
      fabricOn
        ? "织物也会弯。水渍还在里面。"
        : wet
          ? "弯下去，再弹回来。水还在表面上。"
          : "弯下去，再弹回来。"
    );
    window.setTimeout(() => {
      swatch.classList.remove("bending");
      bending = false;
    }, reduced ? 80 : 1250);
  }

  function setFabric(on) {
    cancelIntro();
    fabricOn = on;
    compareBtn.setAttribute("aria-pressed", on ? "true" : "false");
    compareBtn.textContent = on ? "回到这张革" : "吸水对照";
    document.body.classList.toggle("is-fabric", on);
    swatch.classList.toggle("is-fabric", on);
    const spots = [...water.children].map((el) => ({
      x: parseFloat(el.style.left),
      y: parseFloat(el.style.top)
    }));
    clearWater();
    if (on) {
      const use = spots.length ? spots : [
        { x: swatch.clientWidth * 0.4, y: swatch.clientHeight * 0.38 },
        { x: swatch.clientWidth * 0.56, y: swatch.clientHeight * 0.48 }
      ];
      use.forEach((s) => spawnStain(s.x, s.y));
      setLive("");
      setStatus("对照：水渗进织物，颜色变深。这不是新科达的革。");
      cutCaption.textContent = "水进了织物。切回去，看这张革把水留在面上。";
      return;
    }
    setLive("drop");
    setStatus("回到这张革。再滴一次，水只会停在表面。");
    cutCaption.textContent = "水在面层上。这是示意，不是显微镜照片。";
  }

  function applyPhoto(url) {
    if (photoUrl && photoUrl.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    photoUrl = url;
    photo.src = url;
    swatch.classList.add("has-photo");
    photoNote.textContent = "实拍已换上 · 再拖一张可替换";
    setStatus("已换上实拍。水还是叠在皮面上，方便看它防不防水。");
  }

  function readFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setStatus("这个文件不是图片。请拖皮革的照片。");
      return;
    }
    applyPhoto(URL.createObjectURL(file));
  }

  function cancelIntro() {
    touched = true;
    introTimers.forEach(clearTimeout);
    introTimers = [];
  }

  function localPoint(event) {
    const rect = swatch.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  swatch.addEventListener("pointermove", (event) => {
    const rect = swatch.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    swatch.style.setProperty("--sx", x + "%");
    swatch.style.setProperty("--sy", y + "%");
  });

  swatch.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    cancelIntro();
    const p = localPoint(event);
    dropAt(p.x, p.y);
  });

  document.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "drop") pour();
      else if (act === "wipe") wipe();
      else if (act === "bend") bend();
      else if (act === "compare") setFabric(!fabricOn);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (event.key === "1") pour();
    else if (event.key === "2") wipe();
    else if (event.key === "3") bend();
    else if (event.key === "4") setFabric(!fabricOn);
    else return;
    event.preventDefault();
  });

  ["dragenter", "dragover"].forEach((name) => {
    swatch.addEventListener(name, (event) => {
      event.preventDefault();
      swatch.classList.add("is-drag");
    });
  });
  swatch.addEventListener("dragleave", () => swatch.classList.remove("is-drag"));
  document.addEventListener("dragover", (event) => event.preventDefault());
  document.addEventListener("drop", (event) => {
    event.preventDefault();
    swatch.classList.remove("is-drag");
    if (!swatch.contains(event.target)) return;
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    readFile(file);
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    readFile(file);
    fileInput.value = "";
  });

  const resize = new ResizeObserver(() => {
    clearTimeout(paintTimer);
    paintTimer = setTimeout(repaint, 120);
  });
  resize.observe(swatch);
  repaint();

  fetch("assets/leather.jpg", { method: "HEAD" })
    .then((res) => {
      if (res.ok) applyPhoto("assets/leather.jpg");
    })
    .catch(() => {});

  window.setTimeout(() => {
    if (touched || fabricOn || swatch.classList.contains("has-photo")) return;
    pour();
    setLive("drop");
  }, 700);
})();
