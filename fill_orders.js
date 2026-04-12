const ExcelJS = require('exceljs');
const path = require('path');

const FOLDER = 'd:/민지 사업자료/강의공부/사업가 무기창고 올웨이즈 황금코볼트19기/실습/실습 파일';

// SD 발주서 보내는이 고정 정보
const SD_SENDER = {
  name: '픽노바',
  phone: '010-7662-0250',
  address: '충청남도 서천군 장항읍 장마로80 601호'
};

async function main() {
  // 1. orderlist 읽기
  const orderWb = new ExcelJS.Workbook();
  await orderWb.xlsx.readFile(path.join(FOLDER, 'orderlist_260311.xlsx'));
  const orderWs = orderWb.worksheets[0];

  const sdOrders = [];
  const jbOrders = [];

  orderWs.eachRow((row, rowNum) => {
    if (rowNum === 1) return; // 헤더 건너뜀
    const 상품명 = row.getCell(3).value;
    if (!상품명) return;

    const order = {
      주문번호: row.getCell(1).value,
      상품명: row.getCell(3).value,
      수량: row.getCell(5).value,
      주문자: row.getCell(6).value,
      주문자연락처1: row.getCell(7).value,
      수령인: row.getCell(9).value,
      수령인연락처1: row.getCell(10).value,
      우편번호: row.getCell(12).value,
      주소: row.getCell(13).value,
      배송메모: row.getCell(14).value || '',
      플랫폼: row.getCell(15).value,
    };

    if (String(상품명).startsWith('[sd]')) sdOrders.push(order);
    else if (String(상품명).startsWith('[jb]')) jbOrders.push(order);
  });

  console.log(`[sd] 상품: ${sdOrders.length}개, [jb] 상품: ${jbOrders.length}개`);

  // 2. sd발주서.xlsx 업데이트 (없는 것만 추가)
  const sdWb = new ExcelJS.Workbook();
  await sdWb.xlsx.readFile(path.join(FOLDER, 'sd발주서.xlsx'));
  const sdWs = sdWb.worksheets[0];

  // 기존 sd발주서에 있는 수령인 목록 수집
  const existingSdNames = new Set();
  sdWs.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const name = row.getCell(1).value;
    const product = row.getCell(8).value;
    if (name && product) existingSdNames.add(`${name}_${product}`);
  });

  let sdAdded = 0;
  for (const order of sdOrders) {
    const key = `${order.수령인}_${order.상품명}`;
    if (!existingSdNames.has(key)) {
      sdWs.addRow([
        order.수령인,          // 받는분성명
        order.수령인연락처1,   // 연락처
        order.우편번호,        // 우편번호
        order.주소,            // 받는분주소
        SD_SENDER.name,        // 보내는이
        SD_SENDER.phone,       // 보내는분전화번호
        SD_SENDER.address,     // 보내는분주소
        order.상품명,          // 품목명
        order.수량,            // 수량
        order.배송메모         // 배송메세지
      ]);
      sdAdded++;
    }
  }

  await sdWb.xlsx.writeFile(path.join(FOLDER, 'sd발주서.xlsx'));
  console.log(`sd발주서.xlsx: ${sdAdded}개 추가 완료`);

  // 3. tt발주서.xlsx 업데이트 ([jb] 상품 추가)
  const ttWb = new ExcelJS.Workbook();
  await ttWb.xlsx.readFile(path.join(FOLDER, 'tt발주서.xlsx'));
  const ttWs = ttWb.worksheets[0];

  // 기존 tt발주서에 있는 항목 수집
  const existingTtKeys = new Set();
  ttWs.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const product = row.getCell(1).value;
    const recipient = row.getCell(7).value;
    if (product && recipient) existingTtKeys.add(`${recipient}_${product}`);
  });

  let ttAdded = 0;
  for (const order of jbOrders) {
    const key = `${order.수령인}_${order.상품명}`;
    if (!existingTtKeys.has(key)) {
      ttWs.addRow([
        order.상품명,          // 상품명
        order.우편번호,        // 우편번호
        order.주소,            // 주소
        order.수량,            // 수량
        order.주문자,          // 주문자
        order.주문자연락처1,   // 주문자연락처1
        order.수령인,          // 수령인
        order.수령인연락처1,   // 수령인연락처1
        order.배송메모,        // 배송메모
        order.플랫폼           // 플랫폼
      ]);
      ttAdded++;
    }
  }

  await ttWb.xlsx.writeFile(path.join(FOLDER, 'tt발주서.xlsx'));
  console.log(`tt발주서.xlsx: ${ttAdded}개 추가 완료`);

  console.log('\n작업 완료!');
}

main().catch(err => console.error('오류 발생:', err));
