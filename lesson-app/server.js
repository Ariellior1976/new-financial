const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/teacher', (req, res) => res.sendFile(path.join(__dirname, 'public', 'teacher.html')));
app.get('/student', (req, res) => res.sendFile(path.join(__dirname, 'public', 'student.html')));

// In-memory sessions
const sessions = {};

function genCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function studentsSnapshot(session) {
  const students = Object.entries(session.students).map(([id, s]) => ({
    id, name: s.name, submitted: s.submitted, response: s.response
  }));
  return {
    total: students.length,
    submitted: students.filter(s => s.submitted).length,
    students
  };
}

function computeResults(session) {
  const responses = session.responses;
  if (!responses.length) return { type: 'empty', count: 0 };

  const first = responses[0].response;

  if (typeof first === 'number') {
    const nums = responses.map(r => r.response).filter(v => typeof v === 'number');
    const avg = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    const sorted = [...nums].sort((a, b) => a - b);
    return { type: 'counter', avg, max, min, count: nums.length, values: nums, sorted };
  }

  if (Array.isArray(first)) {
    const totals = {};
    responses.forEach(r => r.response.forEach(i => { totals[i] = (totals[i] || 0) + 1; }));
    return { type: 'checklist', totals, count: responses.length };
  }

  if (typeof first === 'string') {
    const texts = responses.map(r => r.response).filter(Boolean);
    return { type: 'text', texts, count: texts.length };
  }

  if (typeof first === 'boolean') {
    const done = responses.filter(r => r.response).length;
    return { type: 'done', done, total: responses.length };
  }

  return { type: 'raw', responses: responses.map(r => r.response) };
}

io.on('connection', socket => {

  // ── TEACHER ──────────────────────────────────────────────────────────────

  socket.on('teacher:create', (cb) => {
    let code;
    do { code = genCode(); } while (sessions[code]);
    sessions[code] = {
      code,
      teacherSocket: socket.id,
      lesson: 0,
      section: 0,
      phase: 'active', // 'active' | 'collecting' | 'results'
      students: {},
      responses: [],
      boardEntries: {}  // col -> [text]
    };
    socket.join(`room:${code}`);
    socket.data.teacherCode = code;
    cb({ code });
    console.log(`Session created: ${code}`);
  });

  socket.on('teacher:rejoin', ({ code }, cb) => {
    const s = sessions[code];
    if (!s) return cb({ error: 'Session not found' });
    s.teacherSocket = socket.id;
    socket.join(`room:${code}`);
    socket.data.teacherCode = code;
    cb({ ok: true, lesson: s.lesson, section: s.section, phase: s.phase, students: studentsSnapshot(s), results: s.lastResults || null });
  });

  socket.on('teacher:startCollect', () => {
    const s = sessions[socket.data.teacherCode];
    if (!s) return;
    s.phase = 'collecting';
    s.responses = [];
    Object.values(s.students).forEach(st => { st.submitted = false; st.response = null; });
    io.to(`room:${s.code}`).emit('phase:state', { phase: 'collecting' });
    socket.emit('students:update', studentsSnapshot(s));
  });

  socket.on('teacher:showResults', () => {
    const s = sessions[socket.data.teacherCode];
    if (!s) return;
    s.phase = 'results';
    const results = computeResults(s);
    s.lastResults = results;
    io.to(`room:${s.code}`).emit('results:show', results);
  });

  socket.on('teacher:advance', ({ lesson, section }) => {
    const s = sessions[socket.data.teacherCode];
    if (!s) return;
    s.lesson = lesson;
    s.section = section;
    s.phase = 'active';
    s.responses = [];
    s.lastResults = null;
    Object.values(s.students).forEach(st => { st.submitted = false; st.response = null; });
    io.to(`room:${s.code}`).emit('phase:advance', { lesson, section });
    socket.emit('students:update', studentsSnapshot(s));
  });

  socket.on('teacher:boardAdd', ({ boardKey, col, text }) => {
    const s = sessions[socket.data.teacherCode];
    if (!s) return;
    const key = `${boardKey}_${col}`;
    if (!s.boardEntries[key]) s.boardEntries[key] = [];
    s.boardEntries[key].push(text);
    io.to(`room:${s.code}`).emit('board:add', { boardKey, col, text });
  });

  socket.on('teacher:boardRemove', ({ boardKey, col, idx }) => {
    const s = sessions[socket.data.teacherCode];
    if (!s) return;
    const key = `${boardKey}_${col}`;
    if (s.boardEntries[key]) s.boardEntries[key].splice(idx, 1);
    io.to(`room:${s.code}`).emit('board:remove', { boardKey, col, idx });
  });

  // ── STUDENT ───────────────────────────────────────────────────────────────

  socket.on('student:join', ({ code, name }, cb) => {
    const s = sessions[code];
    if (!s) return cb({ error: 'קוד שגוי — בקש מהמורה' });
    s.students[socket.id] = { name: name || 'תלמיד', submitted: false, response: null };
    socket.join(`room:${code}`);
    socket.data.studentCode = code;
    io.to(s.teacherSocket).emit('students:update', studentsSnapshot(s));
    cb({
      ok: true,
      lesson: s.lesson,
      section: s.section,
      phase: s.phase,
      boards: s.boardEntries,
      results: s.lastResults
    });
  });

  socket.on('student:submit', ({ response }, cb) => {
    const code = socket.data.studentCode;
    const s = sessions[code];
    if (!s || s.phase !== 'collecting') return cb && cb({ error: 'not collecting' });
    const student = s.students[socket.id];
    if (!student) return;
    student.submitted = true;
    student.response = response;
    s.responses.push({ socketId: socket.id, name: student.name, response });
    io.to(s.teacherSocket).emit('students:update', studentsSnapshot(s));
    if (cb) cb({ ok: true });
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    const code = socket.data.studentCode;
    if (code && sessions[code]) {
      const s = sessions[code];
      delete s.students[socket.id];
      io.to(s.teacherSocket).emit('students:update', studentsSnapshot(s));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🎓 Lesson server running at http://localhost:${PORT}`);
  console.log(`   Teacher: http://localhost:${PORT}/teacher`);
  console.log(`   Student: http://localhost:${PORT}/student\n`);
});
