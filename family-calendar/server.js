const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const today = new Date();
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function dateKey(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
    function offsetKey(days) {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    }
    function uid() { return 'id' + Math.random().toString(36).slice(2, 9); }

    const defaultData = {
      members: [
        { id: 'm1', name: '엄마', color: '#E8927C' },
        { id: 'm2', name: '아빠', color: '#C98BA7' },
        { id: 'm3', name: '민준', color: '#D9556B' }
      ],
      schedules: [
        { id: uid(), date: offsetKey(0), time: '19:00', endTime: '20:30', title: '가족 저녁 식사', memberId: 'm1', note: '외식 예정', createdBy: '엄마', createdAt: Date.now(), updatedBy: null, updatedAt: null },
        { id: uid(), date: offsetKey(1), time: '10:00', endTime: '11:00', title: '병원 예약', memberId: 'm2', note: '정기 검진', createdBy: '아빠', createdAt: Date.now(), updatedBy: null, updatedAt: null }
      ]
    };
    saveData(defaultData);
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

let appData = loadData();

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('가족 구성원 접속:', socket.id);
  socket.emit('init', appData);

  socket.on('add-schedule', (schedule) => {
    appData.schedules.push(schedule);
    saveData(appData);
    io.emit('schedules-updated', appData.schedules);
  });

  socket.on('edit-schedule', (updated) => {
    const idx = appData.schedules.findIndex(s => s.id === updated.id);
    if (idx !== -1) {
      appData.schedules[idx] = updated;
      saveData(appData);
      io.emit('schedules-updated', appData.schedules);
    }
  });

  socket.on('delete-schedule', (id) => {
    appData.schedules = appData.schedules.filter(s => s.id !== id);
    saveData(appData);
    io.emit('schedules-updated', appData.schedules);
  });

  socket.on('add-member', (member) => {
    appData.members.push(member);
    saveData(appData);
    io.emit('members-updated', appData.members);
  });

  socket.on('delete-member', (id) => {
    appData.members = appData.members.filter(m => m.id !== id);
    saveData(appData);
    io.emit('members-updated', appData.members);
  });

  socket.on('disconnect', () => {
    console.log('가족 구성원 접속 종료:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('✅ 가족 스케줄 서버가 시작되었습니다!');
  console.log('');
  console.log('📱 이 PC에서 접속:   http://localhost:' + PORT);
  console.log('🏠 가족 접속 주소:   http://' + getLocalIP() + ':' + PORT);
  console.log('');
  console.log('가족에게 위 주소를 공유하세요. (같은 와이파이여야 합니다)');
});

function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
