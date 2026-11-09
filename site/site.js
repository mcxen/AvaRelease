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
  image.src = image.src.replace(/main-[a-z0-9]+\.png$/, `main-${tab.dataset.skin}.png`);
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
