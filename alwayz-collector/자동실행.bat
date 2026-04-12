@echo off
cd /d "C:\AI minji\Test ai\alwayz-collector"
echo [1/3] 데이터 수집 중...
node collector.js
echo [2/3] 엑셀 파일 생성 중...
node 엑셀변환.js
echo [3/3] 대시보드 생성 중...
node 대시보드생성.js
echo.
echo ✅ 모든 작업 완료! 수집결과 폴더를 확인하세요.
start "" "수집결과"
