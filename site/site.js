// Purchase link. Leave empty until the checkout page exists: buttons then point to the feedback form.
const BUY_URL = "";
if (BUY_URL) {
  document.querySelectorAll("[data-buy]").forEach((a) => { a.href = BUY_URL; });
  const main = document.getElementById("buy-btn");
  if (main) main.textContent = document.documentElement.lang === "en" ? "Buy now · US$8.99" : "立即购买 · US$8.99";
}

// Nav gets a solid background once the page scrolls past the top.
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("solid", window.scrollY > 40);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Skin tabs: swap the real screenshot, era label and caption.
const tabs = [...document.querySelectorAll(".tabs [role=tab]")];
const panel = document.getElementById("skin-panel");
const image = document.getElementById("skin-img");
const era = document.getElementById("skin-era");
const caption = document.getElementById("skin-cap");
function selectSkin(tab, focus) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
  image.src = image.src.replace(/main-[a-z0-9]+\.webp$/, `main-${tab.dataset.skin}.webp`);
  image.alt = tab.dataset.alt;
  era.textContent = tab.dataset.era;
  caption.textContent = tab.dataset.cap;
  panel.setAttribute("aria-labelledby", tab.id);
  if (focus) tab.focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectSkin(tab));
  tab.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      selectSkin(tabs[(i + step + tabs.length) % tabs.length], true);
    }
  });
});

// Reveal-on-scroll; without IntersectionObserver everything stays visible.
const items = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
} else {
  items.forEach((el) => el.classList.add("in"));
}

// Remember an explicit language choice so the Chinese page stops redirecting English browsers.
document.querySelectorAll("a[data-lang]").forEach((a) => {
  a.addEventListener("click", () => {
    try { localStorage.setItem("lang", a.dataset.lang); } catch (e) { /* storage unavailable */ }
  });
});

// Download buttons: resolve the latest AvaRelease assets; fall back to the release page when offline or rate limited.
(async () => {
  const buttons = [...document.querySelectorAll("[data-asset]")];
  if (!buttons.length) return;
  const patterns = { setup: /-win-x64-setup\.exe$/, portable: /-win-x64-portable\.zip$/, dmg: /-osx-arm64\.dmg$/, linux: /-linux-x64\.tar\.gz$/ };
  try {
    const response = await fetch("https://api.github.com/repos/mcxen/AvaRelease/releases/latest", { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) return;
    const release = await response.json();
    const assets = release.assets || [];
    buttons.forEach((a) => {
      const asset = assets.find((x) => patterns[a.dataset.asset]?.test(x.name) && x.browser_download_url.startsWith("https://github.com/mcxen/AvaRelease/releases/download/"));
      if (asset) a.href = asset.browser_download_url;
    });
    const version = document.getElementById("dl-version");
    if (version && release.tag_name) version.textContent = release.tag_name;
    const mirror = document.getElementById("dl-mirror");
    const setup = assets.find((x) => patterns.setup.test(x.name));
    if (mirror && setup) {
      mirror.href = "https://tvv.tw/" + setup.browser_download_url;
      mirror.textContent = document.documentElement.lang === "en" ? "Mirror download (mainland China)" : "国内加速下载（Windows 安装版）";
    }
  } catch (e) { /* keep the release page links */ }
})();
