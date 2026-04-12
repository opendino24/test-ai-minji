const fs   = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "수집결과");

function getToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
function getTodayFile() { return getToday().replace(/-/g,""); }

function readTxt(filename) {
  const fp = path.join(OUTPUT_DIR, filename);
  return fs.existsSync(fp) ? fs.readFileSync(fp,"utf8") : "";
}

// 특정 키워드 다음 줄 숫자 추출
function numAfter(txt, keyword) {
  const lines = txt.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === keyword && lines[i+1]) {
      const m = lines[i+1].trim().match(/[\d.]+/);
      return m ? m[0] : "0";
    }
  }
  return "0";
}

// 키워드 포함 줄에서 숫자만
function numInLine(txt, keyword) {
  const lines = txt.split("\n");
  for (const l of lines) {
    if (l.includes(keyword)) {
      const m = l.match(/[\d.]+/);
      return m ? m[0] : "0";
    }
  }
  return "0";
}

const dateStr  = getToday();
const dateFile = getTodayFile();

const 주문txt = readTxt(`${dateFile}_주문배송관리.txt`);
const 상품txt = readTxt(`${dateFile}_상품목록.txt`);
const 고객txt = readTxt(`${dateFile}_고객관리.txt`);
const 광고txt = readTxt(`${dateFile}_광고관리.txt`); // 실제로 문의관리 페이지
const 매출txt = readTxt(`${dateFile}_매출관리.txt`);
const 정산txt = readTxt(`${dateFile}_정산관리.txt`);
const 세금txt = readTxt(`${dateFile}_세금계산서관리.txt`);
const 노출txt = readTxt(`${dateFile}_노출관리.txt`);

// 주문/배송 데이터 파싱
const 팀모집완료    = numAfter(주문txt, "팀모집완료");
const 상품준비중    = numAfter(주문txt, "상품준비중");
const 발송중        = numAfter(주문txt, "발송중");
const 배송중        = numAfter(주문txt, "배송중");
const 배송완료      = numAfter(주문txt, "배송완료");
const 지연_팀모집   = numAfter(주문txt, "팀모집완료 지연");
const 지연_취소     = numAfter(주문txt, "취소요청 처리 지연");
const 지연_고객문의 = numAfter(주문txt, "고객 문의 응답 지연");
const 지연_상품준비 = numAfter(주문txt, "상품준비중 지연");
const 지연_환불     = numAfter(주문txt, "환불요청 처리 지연");
const 지연_발송     = numAfter(주문txt, "발송중 지연");
const 지연_배송     = numAfter(주문txt, "배송중 지연");
const 정시발송율    = numAfter(주문txt, "[정시 발송 완료 비율 (7일 간)]");
const 익일발송율    = numAfter(주문txt, "[+1 영업일 발송 완료 비율 (7일 간)]");
const 당일발송율    = numAfter(주문txt, "[당일 발송 완료 비율 (7일 간)]");

// 고객 문의 데이터 (광고관리 txt에서 수집됨)
const 전체문의건수  = numInLine(광고txt, "전체 문의 내역");
const 검색결과건수  = numInLine(광고txt, "검색 결과");
const 문의기준시간  = (() => {
  const m = 광고txt.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) 기준/);
  return m ? m[1] : dateStr;
})();

// 색상 뱃지 함수
function badge(v, type) {
  return `<span class="badge badge-${type}">${v}</span>`;
}

// 카드
function card(label, value, sub, color, icon="") {
  return `<div class="card ${color}">
    <div class="card-label">${icon} ${label}</div>
    <div class="card-value">${value}</div>
    ${sub ? `<div class="card-sub">${sub}</div>` : ""}
  </div>`;
}

// 리스트 아이템
function li(label, value, good=true, unit="") {
  const cls = good ? "li-good" : "li-warn";
  return `<div class="list-item">
    <span class="li-label">${label}</span>
    <span class="li-val ${cls}">${value}${unit}</span>
  </div>`;
}

// 섹션 제목
function sec(icon, title) {
  return `<div class="section-title"><span>${icon}</span>${title}</div>`;
}

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>올웨이즈 대시보드 — ${dateStr}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI','Apple SD Gothic Neo',sans-serif;background:#f0f4ff;color:#1a1a2e}

/* 헤더 */
.header{
  background:linear-gradient(135deg,#4f8ef7,#7c6aff);
  color:#fff;padding:26px 48px;
  display:flex;justify-content:space-between;align-items:center;
  box-shadow:0 4px 24px rgba(79,142,247,.3);
  position:sticky;top:0;z-index:99;
}
.header h1{font-size:22px;font-weight:800}
.header .sub{font-size:12px;opacity:.8;margin-bottom:4px}
.header .dbadge{background:rgba(255,255,255,.2);border-radius:20px;padding:6px 18px;font-size:13px;font-weight:600}

/* 컨테이너 */
.wrap{max-width:1380px;margin:0 auto;padding:32px 28px 60px}

/* 섹션 타이틀 */
.section-title{
  font-size:16px;font-weight:800;margin:32px 0 14px;
  display:flex;align-items:center;gap:10px;color:#1a1a2e;
}
.section-title::before{
  content:'';width:5px;height:20px;
  background:linear-gradient(#4f8ef7,#7c6aff);
  border-radius:3px;display:inline-block;
}

/* 카드 그리드 */
.grid{display:grid;gap:14px;margin-bottom:20px}
.g5{grid-template-columns:repeat(5,1fr)}
.g4{grid-template-columns:repeat(4,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}
.g2{grid-template-columns:repeat(2,1fr)}

/* 카드 */
.card{
  background:#fff;border-radius:16px;padding:20px 18px 16px;
  box-shadow:0 2px 12px rgba(0,0,0,.06);
  border-top:4px solid transparent;
  transition:transform .18s,box-shadow .18s;
}
.card:hover{transform:translateY(-3px);box-shadow:0 8px 22px rgba(0,0,0,.1)}
.card.blue  {border-color:#4f8ef7}
.card.purple{border-color:#7c6aff}
.card.green {border-color:#34c58b}
.card.orange{border-color:#ff8c42}
.card.red   {border-color:#ff5c7a}
.card.teal  {border-color:#00bcd4}
.card.gray  {border-color:#b0b8cc}
.card.indigo{border-color:#5c6bc0}
.card-label{font-size:11px;color:#8a93a8;font-weight:700;letter-spacing:.5px;margin-bottom:10px}
.card-value{font-size:28px;font-weight:900;color:#1a1a2e;line-height:1}
.card-sub  {font-size:11px;color:#aab0c0;margin-top:6px}

/* 패널 */
.panel{background:#fff;border-radius:16px;padding:22px 24px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.panel-title{font-size:13px;font-weight:800;margin-bottom:16px;display:flex;align-items:center;gap:6px}

/* 리스트 아이템 */
.list-item{
  display:flex;justify-content:space-between;align-items:center;
  padding:10px 0;border-bottom:1px solid #f0f3fb;font-size:13px;
}
.list-item:last-child{border-bottom:none}
.li-label{color:#5a6378;font-weight:500}
.li-val{font-weight:800;font-size:15px;color:#1a1a2e}
.li-good{color:#34c58b}
.li-warn{color:#ff5c7a}

/* 뱃지 */
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.badge-green {background:#e6faf2;color:#34c58b}
.badge-orange{background:#fff3ec;color:#ff8c42}
.badge-red   {background:#fff0f3;color:#ff5c7a}
.badge-blue  {background:#e8f0ff;color:#4f8ef7}
.badge-gray  {background:#f0f3fb;color:#8a93a8}

/* 진행바 */
.prog-row{margin:10px 0}
.prog-label{display:flex;justify-content:space-between;font-size:12px;color:#5a6378;margin-bottom:4px}
.prog-bar{height:8px;background:#f0f3fb;border-radius:6px;overflow:hidden}
.prog-fill{height:100%;border-radius:6px}

/* 2열 패널 */
.pgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.pgrid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px}

/* 테이블 */
.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
thead th{padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#8a93a8;letter-spacing:.4px;background:#f5f7ff;border-bottom:1px solid #e8ecf8}
tbody tr{border-bottom:1px solid #f0f3fb}
tbody tr:hover{background:#fafbff}
tbody td{padding:12px 14px;color:#2d3561}

/* 공지박스 */
.notice{background:linear-gradient(135deg,#f0edff,#e8f0ff);border-radius:14px;padding:18px 22px;border-left:4px solid #7c6aff;font-size:13px;color:#3d3d6b;line-height:1.8;margin-bottom:20px}
.notice strong{color:#4f8ef7}

.footer{text-align:center;padding:24px;font-size:12px;color:#b0b8cc;margin-top:10px}

@media(max-width:1100px){
  .g5,.g4{grid-template-columns:repeat(2,1fr)}
  .pgrid,.pgrid3{grid-template-columns:1fr}
  .g3{grid-template-columns:1fr 1fr}
}
@media(max-width:640px){
  .g5,.g4,.g3,.g2{grid-template-columns:1fr}
  .wrap{padding:16px 14px 40px}
}
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="sub">올웨이즈 판매자센터 · picknova</div>
    <h1>📊 일일 판매자 대시보드</h1>
  </div>
  <div class="dbadge">📅 ${dateStr} 기준</div>
</div>

<div class="wrap">

<!-- ① 판매자 현황 요약 -->
${sec("🏪","판매자 현황 요약")}
<div class="grid g5">
  ${card("상품 매력도","195","/ 300점","blue","📦")}
  ${card("상품 만족도","80","/ 100점","purple","😊")}
  ${card("배송 만족도","80","/ 100점","green","🚚")}
  ${card("환불 만족도","80","/ 100점","orange","🔄")}
  ${card("CS 만족도","80","/ 100점","red","💬")}
</div>

<!-- ② 주문/배송관리 -->
${sec("📦","주문/배송관리")}
<div class="grid g5" style="margin-bottom:14px">
  ${card("팀모집완료",팀모집완료,"건 (엑셀추출 전)","blue","🛒")}
  ${card("상품준비중",상품준비중,"건 (엑셀추출 후)","purple","📋")}
  ${card("발송중",발송중,"건 (송장업로드 후)","orange","📮")}
  ${card("배송중",배송중,"건 (배송 시작)","teal","🚛")}
  ${card("배송완료",배송완료,"건 (고객수령 완료)","green","✅")}
</div>
<div class="pgrid">
  <div class="panel">
    <div class="panel-title" style="color:#ff5c7a">⚠️ 지연 처리 현황</div>
    ${li("팀모집완료 지연", 지연_팀모집, 지연_팀모집==="0", "건")}
    ${li("취소요청 처리 지연", 지연_취소, 지연_취소==="0", "건")}
    ${li("고객 문의 응답 지연", 지연_고객문의, 지연_고객문의==="0", "건")}
    ${li("상품준비중 지연", 지연_상품준비, 지연_상품준비==="0", "건")}
    ${li("환불요청 처리 지연", 지연_환불, 지연_환불==="0", "건")}
    ${li("발송중 지연", 지연_발송, 지연_발송==="0", "건")}
    ${li("배송중 지연", 지연_배송, 지연_배송==="0", "건")}
  </div>
  <div class="panel">
    <div class="panel-title" style="color:#4f8ef7">📈 발송 성과 (최근 7일)</div>
    <div class="prog-row">
      <div class="prog-label"><span>정시 발송 완료율</span><span style="font-weight:800">${정시발송율}%</span></div>
      <div class="prog-bar"><div class="prog-fill" style="width:${정시발송율}%;background:linear-gradient(90deg,#4f8ef7,#7c6aff)"></div></div>
    </div>
    <div class="prog-row">
      <div class="prog-label"><span>+1 영업일 발송율</span><span style="font-weight:800">${익일발송율}%</span></div>
      <div class="prog-bar"><div class="prog-fill" style="width:${익일발송율}%;background:linear-gradient(90deg,#34c58b,#00bcd4)"></div></div>
    </div>
    <div class="prog-row">
      <div class="prog-label"><span>당일 발송 완료율</span><span style="font-weight:800">${당일발송율}%</span></div>
      <div class="prog-bar"><div class="prog-fill" style="width:${당일발송율}%;background:linear-gradient(90deg,#ff8c42,#ff5c7a)"></div></div>
    </div>
    <div style="margin-top:14px;padding:10px 14px;background:#f5f7ff;border-radius:10px;font-size:12px;color:#5a6378;line-height:1.7">
      💡 발송 처리 기한: 주문 성사일로부터 <strong>+3 영업일</strong> 이내<br>
      📌 +1 영업일 발송 시 구매자 만족도와 노출량이 향상됩니다
    </div>
  </div>
</div>

<!-- ③ 고객관리 -->
${sec("👥","고객관리")}
<div class="grid g4" style="margin-bottom:14px">
  ${card("고객문의 대기","0","건","green","📩")}
  ${card("고객문의 지연","0","건","green","⏰")}
  ${card("센터문의 대기","0","건","green","🏢")}
  ${card("센터문의 지연","0","건","green","⚡")}
</div>
<div class="pgrid">
  <div class="panel">
    <div class="panel-title" style="color:#34c58b">📋 문의 현황 (${문의기준시간} 기준)</div>
    ${li("전체 문의 내역", 전체문의건수+"개", true)}
    ${li("미답변 문의", "0개", true)}
    ${li("답변 완료", "0개", true)}
    ${li("지연 문의", "0건", true)}
  </div>
  <div class="panel">
    <div class="panel-title" style="color:#7c6aff">📌 문의 응대 안내</div>
    ${li("미답변 처리 기한", "1 영업일 이내", true)}
    ${li("상품문의 공개여부", "전체 고객 공개", true)}
    ${li("주문문의 공개여부", "주문자 본인만 공개", true)}
  </div>
</div>

<!-- ④ 매출관리 -->
${sec("💰","매출관리")}
<div class="grid g4" style="margin-bottom:14px">
  ${card("오늘 매출","—","원 (데이터 없음)","blue","📈")}
  ${card("이번주 매출","—","원 (데이터 없음)","purple","📊")}
  ${card("이번달 매출","—","원 (데이터 없음)","green","💵")}
  ${card("정산 예정금액","—","원 (데이터 없음)","orange","🏦")}
</div>
<div class="notice">
  ⚠️ <strong>매출 데이터</strong>는 올웨이즈 판매자센터 → 매출 관리 탭에서 직접 확인해주세요.<br>
  수수료 정책: 카테고리별 수수료 + ROAS 1,000% (VAT 별도) · CPS 광고비 중복 차감 없음
</div>

<!-- ⑤ 정산관리 -->
${sec("🧾","정산관리")}
<div class="pgrid">
  <div class="panel">
    <div class="panel-title" style="color:#ff8c42">💳 정산 현황</div>
    ${li("정산 예정 금액", "—", true)}
    ${li("정산 완료 금액", "—", true)}
    ${li("보류 금액", "—", true)}
    ${li("최근 정산일", "—", true)}
  </div>
  <div class="panel">
    <div class="panel-title" style="color:#5c6bc0">📑 정산 정책</div>
    ${li("수수료 기준", "카테고리별 상이", true)}
    ${li("CPS 광고비 중복차감", "없음", true)}
    ${li("VAT", "각 항목별 별도", true)}
  </div>
</div>

<!-- ⑥ 광고관리 -->
${sec("📣","광고관리")}
<div class="grid g4" style="margin-bottom:14px">
  ${card("진행중 광고","—","개","blue","📣")}
  ${card("오늘 광고비","—","원","red","💸")}
  ${card("목표 ROAS","1,000%","VAT 별도","orange","🎯")}
  ${card("CPS 광고","중복차감 없음","","green","✅")}
</div>
<div class="panel">
  <div class="panel-title" style="color:#ff8c42">🟠 올세일 프로모션 광고 현황</div>
  ${li("등록 기간", "2026.02.23(월) ~ 상시", true)}
  ${li("판매 시작", "2026.03.03(화) ~ 상시", true)}
  ${li("등록 상품", "1개 (미등록 상태)", false)}
  ${li("수수료 정책", "카테고리별 + ROAS 1,000%", true)}
</div>

<!-- ⑦ 노출관리 -->
${sec("👁️","노출관리")}
<div class="grid g3" style="margin-bottom:14px">
  ${card("가격 퀘스트","달성 확인 필요","","orange","🎮")}
  ${card("노출 부스팅","신청 가능","일주일 노출도 부스팅","green","⚡")}
  ${card("상품 노출 상태","집계중","","blue","📡")}
</div>
<div class="panel">
  <div class="panel-title" style="color:#4f8ef7">📌 노출 향상 체크리스트</div>
  ${li("올웨이즈 가격정책 확인", "확인 필요", false)}
  ${li("상품 대량 등록 확인", "확인 필요", false)}
  ${li("일주일 노출 부스팅 신청", "신청 가능", true)}
  ${li("올세일 프로모션 참여", "미등록 상태", false)}
</div>

<!-- ⑧ 세금계산서관리 -->
${sec("🧾","세금계산서관리")}
<div class="pgrid">
  <div class="panel">
    <div class="panel-title" style="color:#7c6aff">📄 발행 현황</div>
    ${li("이번달 발행", "—", true)}
    ${li("발행 예정", "—", true)}
    ${li("미발행", "—", true)}
    ${li("발행 완료", "—", true)}
  </div>
  <div class="panel">
    <div class="panel-title" style="color:#ec407a">💡 세금 정보</div>
    ${li("과세 상품", "픽노바 고급형 자석 골프티", true)}
    ${li("면세 여부", "과세 상품", true)}
    ${li("VAT 적용", "수수료 항목별 별도", true)}
  </div>
</div>

<!-- ⑨ 상품 목록 -->
${sec("🛍️","상품 목록")}
<div class="panel">
  <div class="tbl-wrap">
    <table>
      <thead>
        <tr>
          <th>NO</th><th>상품명</th><th>개인가격</th><th>팀가격</th>
          <th>올세일 할인율</th><th>올세일 할인가</th><th>등록상태</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1</strong></td>
          <td>★Best 3개 세트★ 픽노바 고급형 자석 골프티 드라이버티</td>
          <td><strong>11,000원</strong></td>
          <td>9,000원</td>
          <td><span class="badge badge-blue">10%</span></td>
          <td><strong>8,100원</strong></td>
          <td><span class="badge badge-orange">미등록</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ⑩ 공지 -->
${sec("📌","주요 공지")}
<div class="notice">
  <strong>📢 올세일 프로모션 상시 운영 중</strong><br>
  등록기간: 2026.02.23(월) ~ 상시 &nbsp;|&nbsp; 판매시작: 2026.03.03(화) ~ 상시<br>
  총 수수료: 카테고리별 수수료 + ROAS 1,000% (VAT 별도) · CPS 광고비 중복 차감 없음<br>
  ⚠️ 올세일 할인가는 [상품 관리] 탭에서 가격 수정 시 <strong>반영되지 않습니다</strong>. 반드시 [올세일 프로모션] 탭에서 별도 수정해주세요.
</div>

</div>

<div class="footer">
  올웨이즈 판매자센터 자동 수집 보고서 &nbsp;·&nbsp; 수집일: ${dateStr} &nbsp;·&nbsp; picknova
</div>

</body>
</html>`;

const HTML_PATH = path.join(OUTPUT_DIR, `올웨이즈_대시보드_${dateStr}.html`);
fs.writeFileSync(HTML_PATH, html, "utf8");
console.log(`\n✅ 대시보드 생성 완료!`);
console.log(`📁 저장위치: ${HTML_PATH}`);
console.log(`\n💡 파일을 더블클릭하면 브라우저에서 바로 열립니다!\n`);
