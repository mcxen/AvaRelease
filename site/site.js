// Purchase link. Leave empty until the checkout page exists: buttons then point to the feedback form.
const BUY_URL = "";
if (BUY_URL) {
  document.querySelectorAll("[data-buy]").forEach((a) => { a.href = BUY_URL; });
  const main = document.getElementById("buy-btn");
  if (main) main.textContent = "立即购买 · US$8.99";
}
