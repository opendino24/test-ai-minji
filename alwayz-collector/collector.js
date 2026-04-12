const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const config = require("./config");

const OUTPUT_DIR = path.join(__dirname, "수집결과");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

function getDateStr() {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

function saveText(filename, content) {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, content, "utf8");
  console.log(`  저장완료: ${filepath}`);
}

const BASE = "https://alwayzseller.ilevit.com";

async function main() {
  console.log("==============================================");
  console.log("  올웨이즈 판매자센터 자동 수집 시작");
  console.log("==============================================\n");

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page    = await context.newPage();

  // ── 1. 로그인 ──────────────────────────────────────
  console.log("[1/9] 로그인 중...");
  await page.goto(config.LOGIN_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const inputs = await page.locator("input").all();
  if (inputs.length >= 2) {
    await inputs[0].fill(config.ID);
    await inputs[1].fill(config.PW);
  } else {
    await page.locator('input[type="text"],input[type="email"]').first().fill(config.ID);
    await page.locator('input[type="password"]').first().fill(config.PW);
  }
  await page.locator('button[type="submit"],button:has-text("로그인")').first().click();
  await page.waitForTimeout(4000);

  if (page.url().includes("login")) {
    console.log("  ❌ 로그인 실패! config.js 아이디/비밀번호를 확인해주세요.");
    await browser.close();
    return;
  }
  console.log(`  ✅ 로그인 성공! (현재URL: ${page.url()})\n`);

  const dateStr = getDateStr();

  // ── URL 이동 후 수집 함수 ──────────────────────────
  async function collect(step, label, urlPath, filename) {
    console.log(`[${step}/9] ${label} 수집 중...`);
    const targetUrl = `${BASE}${urlPath}`;
    try {
      await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(3000);

      const landedUrl = page.url();
      console.log(`  → 이동된 URL: ${landedUrl}`);

      const text = await page.evaluate(() => document.body.innerText);
      saveText(`${dateStr}_${filename}.txt`, text);

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${dateStr}_${filename}.png`),
        fullPage: true,
      });
      console.log(`  ✅ ${label} 수집 완료\n`);
    } catch (e) {
      console.log(`  ⚠️ ${label} 오류: ${e.message}\n`);
    }
  }

  // ── 로그인 직후 실제 URL 패턴 파악용 스크린샷 ──────
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${dateStr}_홈화면.png`),
    fullPage: true,
  });

  // ── 2. 상품목록 (이미 확인된 URL) ─────────────────
  await collect(2, "상품목록",       "/items/management",    "상품목록");

  // ── 3. 주문/배송관리 ───────────────────────────────
  await collect(3, "주문/배송관리",  "/orders",              "주문배송관리");

  // ── 4. 고객관리 ────────────────────────────────────
  await collect(4, "고객관리",       "/cs",                  "고객관리");

  // ── 5. 매출관리 ────────────────────────────────────
  await collect(5, "매출관리",       "/revenue",             "매출관리");

  // ── 6. 정산관리 ────────────────────────────────────
  await collect(6, "정산관리",       "/settlement",          "정산관리");

  // ── 7. 광고관리 ────────────────────────────────────
  await collect(7, "광고관리",       "/ads",                 "광고관리");

  // ── 8. 세금계산서관리 ──────────────────────────────
  await collect(8, "세금계산서관리", "/tax-invoice",         "세금계산서관리");

  // ── 9. 노출관리 ────────────────────────────────────
  await collect(9, "노출관리",       "/display",             "노출관리");

  console.log("==============================================");
  console.log("  모든 수집 완료!");
  console.log(`  결과 폴더: ${OUTPUT_DIR}`);
  console.log("==============================================");

  await browser.close();
}

main().catch((e) => {
  console.error("오류 발생:", e);
  process.exit(1);
});
