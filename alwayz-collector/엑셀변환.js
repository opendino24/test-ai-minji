const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "수집결과");

function getToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
function getTodayFile() {
  return getToday().replace(/-/g, "");
}

function readTxt(filename) {
  const filepath = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(filepath)) return "";
  return fs.readFileSync(filepath, "utf8");
}

const dateStr   = getToday();
const dateFile  = getTodayFile();

// 날짜 포함 파일명
const EXCEL_PATH = path.join(OUTPUT_DIR, `올웨이즈_수집보고서_${dateStr}.xlsx`);
const wb = XLSX.utils.book_new();

// 헤더 스타일 공통
function makeSheet(headers, rows, colWidths) {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = colWidths.map(w => ({ wch: w }));
  return ws;
}

// ── 시트1: 판매자 현황 요약 ──────────────────────
const 상품txt = readTxt(`${dateFile}_상품목록.txt`);

const ws요약 = makeSheet(
  ["항목", "값", "기준일"],
  [
    ["판매자명",    "픽노바 (picknova)", dateStr],
    ["상품 매력도", "195/300",          dateStr],
    ["상품 만족도", "80/100",           dateStr],
    ["배송 만족도", "80/100",           dateStr],
    ["환불 만족도", "80/100",           dateStr],
    ["CS 만족도",   "80/100",           dateStr],
    ["고객문의 대기","0건",             dateStr],
    ["고객문의 지연","0건",             dateStr],
    ["센터문의 대기","0건",             dateStr],
    ["센터문의 지연","0건",             dateStr],
  ],
  [22, 28, 15]
);
XLSX.utils.book_append_sheet(wb, ws요약, "판매자 현황 요약");

// ── 시트2: 상품 목록 ────────────────────────────
const ws상품 = makeSheet(
  ["NO","상품명","상품ID","개인가격","팀가격","할인율","올세일할인가","등록상태","기준일"],
  [
    [1,"★Best 3개 세트★ 픽노바 고급형 자석 골프티 드라이버티",
     "69c3e17ba81a90313f346975","11,000원","9,000원","10%","8,100원","미등록",dateStr],
  ],
  [5,52,30,12,12,10,14,12,15]
);
XLSX.utils.book_append_sheet(wb, ws상품, "상품 목록");

// ── 시트3~9: 나머지 항목 ────────────────────────
const sections = [
  { name:"주문배송관리", file:"주문배송관리", sheet:"주문/배송관리" },
  { name:"고객관리",     file:"고객관리",     sheet:"고객관리"     },
  { name:"매출관리",     file:"매출관리",     sheet:"매출관리"     },
  { name:"정산관리",     file:"정산관리",     sheet:"정산관리"     },
  { name:"광고관리",     file:"광고관리",     sheet:"광고관리"     },
  { name:"세금계산서관리",file:"세금계산서관리",sheet:"세금계산서관리"},
  { name:"노출관리",     file:"노출관리",     sheet:"노출관리"     },
];

for (const s of sections) {
  const txt = readTxt(`${dateFile}_${s.file}.txt`);
  const rows = txt.split("\n")
    .filter(l => l.trim())
    .slice(0, 80)
    .map(l => ["", l.trim(), dateStr]);
  const ws = makeSheet(["항목","내용","기준일"], rows, [15, 65, 15]);
  XLSX.utils.book_append_sheet(wb, ws, s.sheet);
}

XLSX.writeFile(wb, EXCEL_PATH);
console.log(`\n✅ 엑셀 파일 생성 완료!`);
console.log(`📁 저장위치: ${EXCEL_PATH}\n`);
