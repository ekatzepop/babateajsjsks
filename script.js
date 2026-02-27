// ─────────────────────────────────────────
// TELEGRAM (опционально, не блокирует)
// ─────────────────────────────────────────
var tg = null;
try {
  if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
  }
} catch(e) {}

function haptic(type) {
  try { if (tg) tg.HapticFeedback.impactOccurred(type); } catch(e) {}
}
function hapticNotify(type) {
  try { if (tg) tg.HapticFeedback.notificationOccurred(type); } catch(e) {}
}

// ─────────────────────────────────────────
// АУДИО ДВИЖОК (Web Audio API)
// ─────────────────────────────────────────
var _ac = null;
var _bgGain = null, _sfxGain = null;
var _bgSource = null, _bgPlaying = false;
var _audioMuted = false;

function getAC() {
  if (!_ac) {
    try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  if (_ac && _ac.state === 'suspended') { try { _ac.resume(); } catch(e) {} }
  return _ac;
}

function initAudioGains() {
  var ac = getAC(); if (!ac) return;
  if (!_bgGain) {
    _bgGain = ac.createGain(); _bgGain.gain.value = 0.18;
    _bgGain.connect(ac.destination);
  }
  if (!_sfxGain) {
    _sfxGain = ac.createGain(); _sfxGain.gain.value = _audioMuted ? 0 : 0.7;
    _sfxGain.connect(ac.destination);
  }
}

// ── Синтезированная фоновая музыка (атмосферный казино-луп) ──
function startBgMusic() {
  if (_bgPlaying || _audioMuted) return;
  var ac = getAC(); if (!ac) return;
  initAudioGains();
  _bgPlaying = true;

  // Генерируем луп через осцилляторы и шум
  var loopLen = 4; // секунды
  var bpm = 95, beat = 60/bpm;

  // Бас-пульс
  function scheduleBass(t) {
    if (!_bgPlaying) return;
    var ac2 = getAC(); if (!ac2) return;
    var notes = [55, 55, 58, 55, 52, 55, 57, 55]; // A1, B1, C2...
    notes.forEach(function(freq, i) {
      var o = ac2.createOscillator();
      var g = ac2.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + i*beat*0.5);
      g.gain.linearRampToValueAtTime(0.4, t + i*beat*0.5 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + i*beat*0.5 + 0.35);
      o.connect(g); g.connect(_bgGain);
      o.start(t + i*beat*0.5); o.stop(t + i*beat*0.5 + 0.4);
    });
    setTimeout(function() { scheduleBass(ac2.currentTime); }, (notes.length * beat * 0.5 - 0.1) * 1000);
  }

  // Высокочастотный шиммер (монеты/звёзды)
  function scheduleShimmer(t) {
    if (!_bgPlaying) return;
    var ac2 = getAC(); if (!ac2) return;
    var freqs = [880, 1320, 1760, 2200, 1320, 880, 1108, 1320];
    freqs.forEach(function(freq, i) {
      if (Math.random() > 0.6) return;
      var o = ac2.createOscillator();
      var g = ac2.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + i*beat*0.25);
      g.gain.linearRampToValueAtTime(0.12, t + i*beat*0.25 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i*beat*0.25 + 0.18);
      o.connect(g); g.connect(_bgGain);
      o.start(t + i*beat*0.25); o.stop(t + i*beat*0.25 + 0.2);
    });
    setTimeout(function() { scheduleShimmer(ac2.currentTime); }, (freqs.length * beat * 0.25 - 0.05) * 1000);
  }

  // Аккорды-пэды
  function schedulePad(t) {
    if (!_bgPlaying) return;
    var ac2 = getAC(); if (!ac2) return;
    var chords = [[220,277,330], [196,247,294], [233,294,349], [220,277,330]];
    var chord = chords[Math.floor(Math.random() * chords.length)];
    chord.forEach(function(freq) {
      var o = ac2.createOscillator();
      var g = ac2.createGain();
      o.type = 'sawtooth'; o.frequency.value = freq;
      var filt = ac2.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 600;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.3);
      g.gain.setValueAtTime(0.08, t + 1.5);
      g.gain.linearRampToValueAtTime(0, t + 2.5);
      o.connect(filt); filt.connect(g); g.connect(_bgGain);
      o.start(t); o.stop(t + 2.6);
    });
    setTimeout(function() { schedulePad(ac2.currentTime); }, 2400);
  }

  var now = ac.currentTime;
  scheduleBass(now);
  scheduleShimmer(now + 0.1);
  schedulePad(now + 0.2);
}

function stopBgMusic() {
  _bgPlaying = false;
}

// ── SFX функции ──

function sfxClick() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(600, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.08);
  g.gain.setValueAtTime(0.5, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
  o.connect(g); g.connect(_sfxGain);
  o.start(); o.stop(ac.currentTime + 0.12);
}

function sfxBet() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  // Coin drop sound
  [0, 0.07, 0.14].forEach(function(delay) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(1200, ac.currentTime + delay);
    o.frequency.exponentialRampToValueAtTime(600, ac.currentTime + delay + 0.12);
    g.gain.setValueAtTime(0.4, ac.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.15);
    o.connect(g); g.connect(_sfxGain);
    o.start(ac.currentTime + delay); o.stop(ac.currentTime + delay + 0.18);
  });
}

function sfxWin(big) {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  var melody = big ? [523,659,784,1047,1319] : [523,659,784,1047];
  melody.forEach(function(freq, i) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    var t = ac.currentTime + i * 0.1;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g); g.connect(_sfxGain);
    o.start(t); o.stop(t + 0.3);
  });
}

function sfxLose() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(300, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.5);
  g.gain.setValueAtTime(0.4, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.55);
  var filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 400;
  o.connect(filt); filt.connect(g); g.connect(_sfxGain);
  o.start(); o.stop(ac.currentTime + 0.6);
}

function sfxTick() {
  // Tick for crash multiplier rising
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = 'square'; o.frequency.value = 880 + crash_mult * 40;
  g.gain.setValueAtTime(0.08, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
  o.connect(g); g.connect(_sfxGain);
  o.start(); o.stop(ac.currentTime + 0.06);
}

function sfxExplosion() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  // Noise burst
  var bufSize = ac.sampleRate * 0.6;
  var buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  var src = ac.createBufferSource();
  src.buffer = buf;
  var filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 400;
  var g = ac.createGain();
  g.gain.setValueAtTime(0.7, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
  src.connect(filt); filt.connect(g); g.connect(_sfxGain);
  src.start(); src.stop(ac.currentTime + 0.65);
  // Low boom
  var o = ac.createOscillator(), g2 = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(120, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 0.5);
  g2.gain.setValueAtTime(0.8, ac.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
  o.connect(g2); g2.connect(_sfxGain);
  o.start(); o.stop(ac.currentTime + 0.55);
}

function sfxCashout() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  // Cash register ding
  [1047, 1319, 1568].forEach(function(freq, i) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    var t = ac.currentTime + i * 0.08;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.6, t+0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g); g.connect(_sfxGain);
    o.start(t); o.stop(t + 0.45);
  });
}

function sfxReveal() {
  // Mines cell reveal
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(440 + mines_revealed * 40, ac.currentTime);
  o.frequency.linearRampToValueAtTime(660 + mines_revealed * 50, ac.currentTime + 0.1);
  g.gain.setValueAtTime(0.35, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
  o.connect(g); g.connect(_sfxGain);
  o.start(); o.stop(ac.currentTime + 0.2);
}

function sfxMineHit() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  sfxExplosion();
}

function sfxPlinkoTick() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.value = 600 + Math.random() * 400;
  g.gain.setValueAtTime(0.15, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
  o.connect(g); g.connect(_sfxGain);
  o.start(); o.stop(ac.currentTime + 0.07);
}

function sfxPlinkoLand(mult) {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  var freq = mult >= 3 ? 1047 : mult >= 1 ? 784 : 440;
  var count = mult >= 3 ? 3 : 1;
  for (var i = 0; i < count; i++) {
    (function(idx) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = freq * (1 + idx * 0.5);
      var t = ac.currentTime + idx * 0.1;
      g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); g.connect(_sfxGain);
      o.start(t); o.stop(t + 0.35);
    })(i);
  }
}

function sfxGoal() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  // Crowd cheer approximation + whistle
  var bufSize = ac.sampleRate * 0.4;
  var buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (0.3 + 0.7 * (i / bufSize));
  var src = ac.createBufferSource(); src.buffer = buf;
  var filt = ac.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1200; filt.Q.value = 0.5;
  var g = ac.createGain(); g.gain.setValueAtTime(0.2, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
  src.connect(filt); filt.connect(g); g.connect(_sfxGain);
  src.start(); src.stop(ac.currentTime + 0.45);
  // Whistle
  [2000, 2400, 2000].forEach(function(f, i) {
    var o = ac.createOscillator(), gw = ac.createGain();
    o.type = 'sine'; o.frequency.value = f;
    var t = ac.currentTime + i * 0.12;
    gw.gain.setValueAtTime(0.3, t); gw.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(gw); gw.connect(_sfxGain);
    o.start(t); o.stop(t + 0.12);
  });
}

function sfxSave() {
  // Goalkeeper save
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(200, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.4);
  g.gain.setValueAtTime(0.5, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45);
  var filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 500;
  o.connect(filt); filt.connect(g); g.connect(_sfxGain);
  o.start(); o.stop(ac.currentTime + 0.5);
}

function sfxSpin() {
  // Slot spin sound
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  var bufSize = ac.sampleRate * 0.15;
  var buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  var src = ac.createBufferSource(); src.buffer = buf;
  var filt = ac.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 800;
  var g = ac.createGain(); g.gain.value = 0.3;
  src.connect(filt); filt.connect(g); g.connect(_sfxGain);
  src.start(); src.stop(ac.currentTime + 0.16);
}

function sfxCard() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  var bufSize = ac.sampleRate * 0.08;
  var buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  var src = ac.createBufferSource(); src.buffer = buf;
  var filt = ac.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 2000;
  var g = ac.createGain(); g.gain.value = 0.5;
  src.connect(filt); filt.connect(g); g.connect(_sfxGain);
  src.start(); src.stop(ac.currentTime + 0.09);
}

function sfxRoulette() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  // Ball rolling sound
  var duration = 2.5;
  var bufSize = ac.sampleRate * duration;
  var buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < bufSize; i++) {
    var prog = i / bufSize;
    var speed = 1 - prog * 0.7;
    data[i] = (Math.random() * 2 - 1) * 0.3 * speed;
  }
  var src = ac.createBufferSource(); src.buffer = buf;
  var filt = ac.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1500; filt.Q.value = 2;
  var g = ac.createGain(); g.gain.setValueAtTime(0.4, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  src.connect(filt); filt.connect(g); g.connect(_sfxGain);
  src.start(); src.stop(ac.currentTime + duration);
}

function sfxDice() {
  var ac = getAC(); if (!ac || _audioMuted) return;
  initAudioGains();
  // Shake + thud
  for (var i = 0; i < 4; i++) {
    (function(idx) {
      var bufSize = Math.floor(ac.sampleRate * 0.05);
      var buf = ac.createBuffer(1, bufSize, ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1);
      var src = ac.createBufferSource(); src.buffer = buf;
      var g = ac.createGain(); g.gain.value = 0.3;
      src.connect(g); g.connect(_sfxGain);
      src.start(ac.currentTime + idx * 0.1); src.stop(ac.currentTime + idx * 0.1 + 0.06);
    })(i);
  }
}

// ── Кнопка Звук ──
function toggleMute() {
  _audioMuted = !_audioMuted;
  if (_sfxGain) _sfxGain.gain.value = _audioMuted ? 0 : 0.7;
  if (_bgGain) _bgGain.gain.value = _audioMuted ? 0 : 0.18;
  if (_audioMuted) { stopBgMusic(); }
  else { startBgMusic(); }
  var btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = _audioMuted ? '🔇' : '🔊';
  try { localStorage.setItem('puerbet_muted', _audioMuted ? '1' : '0'); } catch(e) {}
}

// Восстановление настройки звука
try {
  if (localStorage.getItem('puerbet_muted') === '1') {
    _audioMuted = true;
  }
} catch(e) {}

// Запуск музыки при первом взаимодействии
document.addEventListener('click', function startAudioOnce() {
  document.removeEventListener('click', startAudioOnce);
  if (!_audioMuted) startBgMusic();
  // Update mute button text
  var btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = _audioMuted ? '🔇 Звук выкл' : '🔊 Звук вкл';
}, { once: true });

// Global click sounds for .bet-btn, .back-btn, .tab-btn, .menu-btn, .bet-preset
document.addEventListener('click', function(e) {
  var t = e.target;
  if (t.classList.contains('bet-btn') || t.classList.contains('back-btn') ||
      t.classList.contains('bet-preset') || t.classList.contains('tab-btn')) {
    sfxClick();
  }
}, true);


// ─────────────────────────────────────────
// БАЛАНС
// ─────────────────────────────────────────
var balance = 500;
try {
  var saved = localStorage.getItem('puerbet_bal');
  if (saved !== null) balance = parseFloat(saved);
} catch(e) {}

function saveBalance() {
  try { localStorage.setItem('puerbet_bal', balance.toFixed(2)); } catch(e) {}
}

function fmtBal() { return fmtMoney(balance); }

function updateBalanceUI(flash) {
  var str = fmtBal();
  var ids = ['bal-modes', 'bal-slot', 'bal-dragon', 'bal-dice', 'bal-darts', 'bal-ocean', 'bal-roulette', 'bal-mahjong', 'bal-crash', 'bal-mines', 'bal-plinko', 'bal-penalty', 'bal-profile', 'bal-wheel'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = str;
    if (flash) {
      el.classList.remove('win-flash', 'lose-flash');
      void el.offsetWidth; // reflow
      el.classList.add(flash);
      setTimeout(function() { el.classList.remove(flash); }, 700);
    }
  });
}

// ─────────────────────────────────────────
// ЧАСТИЦЫ
// ─────────────────────────────────────────
(function() {
  var pc = document.getElementById('particles');
  for (var i = 0; i < 18; i++) {
    var p = document.createElement('div');
    p.className = 'particle';
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.width = p.style.height = (Math.random() * 3 + 1) + 'px';
    p.style.animationDuration = (Math.random() * 8 + 6) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    pc.appendChild(p);
  }
})();

// ─────────────────────────────────────────
// ЗАГРУЗОЧНАЯ АНИМАЦИЯ (JS, без CSS transition блока)
// ─────────────────────────────────────────
(function() {
  var bar = document.getElementById('loading-bar');
  var pct = 0;
  var iv = setInterval(function() {
    pct += Math.random() * 12 + 4;
    if (pct >= 100) { pct = 100; clearInterval(iv); }
    bar.style.width = pct + '%';
  }, 80);

  // Гарантированный переход через 1.6 сек — независимо от шрифтов/сети
  setTimeout(function() {
    clearInterval(iv);
    bar.style.width = '100%';
    setTimeout(function() { showScreen('main'); }, 200);
  }, 1600);
})();

// ─────────────────────────────────────────
// ЭКРАНЫ
// ─────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
  document.getElementById('screen-' + name).classList.remove('hidden');
  updateBalanceUI();
}

// ─────────────────────────────────────────
// ТАБЫ
// ─────────────────────────────────────────
function switchTab(name, btn) {
  sfxClick();
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

// ─────────────────────────────────────────
// УТИЛИТЫ
// ─────────────────────────────────────────
function comingSoon(name) { showToast('🔜 ' + name + ' — скоро!'); haptic('light'); }
function exitApp() { if (tg) { tg.close(); } else { showToast('Выход...'); } }

var _toastTmr;
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTmr);
  _toastTmr = setTimeout(function() { t.classList.remove('show'); }, 2600);
}

function spawnConfetti() {
  var cols = ['#C9A84C','#F0C060','#BB8FEE','#4CAF50','#E74C3C','#ffffff','#2E86C1'];
  for (var i = 0; i < 48; i++) {
    (function() {
      var c = document.createElement('div');
      c.className = 'confetti-piece';
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.background = cols[Math.floor(Math.random() * cols.length)];
      c.style.animationDelay = (Math.random() * 0.6) + 's';
      c.style.animationDuration = (Math.random() * 1 + 1.1) + 's';
      document.body.appendChild(c);
      setTimeout(function() { c.remove(); }, 2400);
    })();
  }
}

// ─────────────────────────────────────────
// СЛОТ-МАШИНА
// ─────────────────────────────────────────
var SLOTS = {
  lucky: {
    title: 'Lucky Sevens',
    titleClass: 'lucky',
    wrapClass: 'lucky-theme',
    btnClass: 'lucky-spin',
    btnLabel: '🍒 SPIN',
    symbols: ['7️⃣','💎','🔔','⭐','🍊','🍋','🍒'],
    weights:  [  2,   4,   8,  12,  16,  18,  20],
    paytable: [
      { type: 3, s: ['7️⃣','7️⃣','7️⃣'], mult: 50,  name: 'ДЖЕКПОТ — Тройная 7' },
      { type: 3, s: ['💎','💎','💎'],   mult: 25,  name: 'Три бриллианта' },
      { type: 3, s: ['🔔','🔔','🔔'],   mult: 15,  name: 'Три колокола' },
      { type: 3, s: ['⭐','⭐','⭐'],   mult: 10,  name: 'Три звезды' },
      { type: 3, s: ['🍊','🍊','🍊'],   mult: 6,   name: 'Три апельсина' },
      { type: 3, s: ['🍋','🍋','🍋'],   mult: 4,   name: 'Три лимона' },
      { type: 3, s: ['🍒','🍒','🍒'],   mult: 3,   name: 'Три вишни' },
      { type: 2, s: ['🍒','🍒'],        mult: 1.5, name: 'Две вишни' },
      { type: 1, s: ['🍒'],             mult: 0.5, name: 'Вишня' },
    ]
  },
  pyramid: {
    title: 'Golden Pyramid',
    titleClass: 'pyramid',
    wrapClass: 'pyramid-theme',
    btnClass: 'pyramid-spin',
    btnLabel: '🏺 SPIN',
    symbols: ['👁️','🔱','💰','🌙','⭐','🐍','🏺'],
    weights:  [  2,   4,   8,  12,  14,  16,  14],
    paytable: [
      { type: 3, s: ['👁️','👁️','👁️'], mult: 50,  name: 'ДЖЕКПОТ — Oko Ра' },
      { type: 3, s: ['🔱','🔱','🔱'],   mult: 25,  name: 'Три трезубца' },
      { type: 3, s: ['💰','💰','💰'],   mult: 15,  name: 'Три золота' },
      { type: 3, s: ['🌙','🌙','🌙'],   mult: 8,   name: 'Три луны' },
      { type: 3, s: ['⭐','⭐','⭐'],   mult: 6,   name: 'Три звезды' },
      { type: 3, s: ['🐍','🐍','🐍'],   mult: 4,   name: 'Три змеи' },
      { type: 3, s: ['🏺','🏺','🏺'],   mult: 3,   name: 'Три урны' },
      { type: 2, s: ['🏺','🏺'],        mult: 1.5, name: 'Две урны' },
      { type: 1, s: ['👁️'],            mult: 2,   name: 'Oko Ра' },
    ]
  }
};

var currentSlot = 'lucky';
var currentBet  = 5;
var isSpinning  = false;
var BET_STEPS   = [1, 2, 5, 10, 25, 50, 100];

function openSlot(type) {
  currentSlot = type;
  var cfg = SLOTS[type];

  document.getElementById('slot-title').textContent = cfg.title;
  document.getElementById('slot-title').className = 'slot-game-title ' + cfg.titleClass;
  document.getElementById('reels-wrap').className = 'reels-wrap ' + cfg.wrapClass;

  var sb = document.getElementById('spin-btn');
  sb.className = 'spin-btn ' + cfg.btnClass;
  sb.textContent = cfg.btnLabel;
  sb.disabled = false;

  for (var i = 0; i < 3; i++) {
    var r = document.getElementById('r' + i);
    r.textContent = cfg.symbols[i % cfg.symbols.length];
    r.classList.remove('spinning', 'win-reel');
  }
  document.getElementById('win-line').classList.remove('show');
  document.getElementById('win-overlay').classList.remove('show');
  document.getElementById('result-msg').textContent = 'Нажмите SPIN чтобы начать!';
  document.getElementById('result-msg').className = 'result-msg';

  buildPaytable(cfg);
  updateBalanceUI();
  showScreen('slot');
}

function buildPaytable(cfg) {
  var html = '<div class="paytable-title">◆ ТАБЛИЦА ВЫПЛАТ ◆</div>';
  cfg.paytable.forEach(function(row) {
    var syms;
    if (row.type === 3) syms = row.s.join(' ');
    else if (row.type === 2) syms = row.s.join(' ') + ' ❓';
    else syms = row.s[0] + ' ❓ ❓';
    html += '<div class="paytable-row">'
      + '<span class="paytable-syms">' + syms + '</span>'
      + '<span class="paytable-name">' + row.name + '</span>'
      + '<span class="paytable-mult">×' + row.mult + '</span>'
      + '</div>';
  });
  document.getElementById('paytable').innerHTML = html;
}

function weightedRand(syms, weights) {
  var total = 0;
  for (var i = 0; i < weights.length; i++) total += weights[i];
  var r = Math.random() * total;
  for (var i = 0; i < syms.length; i++) {
    r -= weights[i];
    if (r <= 0) return syms[i];
  }
  return syms[syms.length - 1];
}

function changeBet(dir) {
  sfxClick();
  var idx = BET_STEPS.indexOf(currentBet);
  setBet(BET_STEPS[Math.max(0, Math.min(BET_STEPS.length - 1, idx + dir))]);
}

function setBet(val) {
  currentBet = val;
  document.getElementById('bet-val').textContent = '$' + val;
  document.querySelectorAll('.bet-preset').forEach(function(b) {
    b.classList.toggle('active', parseInt(b.textContent.replace('$','')) === val);
  });
}

function doSpin() {
  if (isSpinning) return;
  if (balance < currentBet) {
    showToast('❌ Недостаточно средств!');
    hapticNotify('error');
    return;
  }

  isSpinning = true;
  sfxSpin(); sfxBet();
  balance -= currentBet;
  saveBalance();
  updateBalanceUI('lose-flash');

  document.getElementById('spin-btn').disabled = true;
  document.getElementById('win-line').classList.remove('show');
  document.getElementById('win-overlay').classList.remove('show');
  document.getElementById('result-msg').textContent = '🎰 Крутим барабаны...';
  document.getElementById('result-msg').className = 'result-msg';

  var cfg = SLOTS[currentSlot];
  var reelEls = [0,1,2].map(function(i){ return document.getElementById('r'+i); });
  reelEls.forEach(function(r){ r.classList.remove('win-reel'); r.classList.add('spinning'); });

  var results = [
    weightedRand(cfg.symbols, cfg.weights),
    weightedRand(cfg.symbols, cfg.weights),
    weightedRand(cfg.symbols, cfg.weights)
  ];

  // Останавливаем барабаны поочерёдно
  [500, 820, 1140].forEach(function(delay, i) {
    var iv = setInterval(function() {
      reelEls[i].textContent = cfg.symbols[Math.floor(Math.random() * cfg.symbols.length)];
    }, 75);
    setTimeout(function() {
      clearInterval(iv);
      reelEls[i].classList.remove('spinning');
      reelEls[i].textContent = results[i];
      haptic('light');
      if (i === 2) {
        setTimeout(function(){ evalResult(results, cfg); }, 280);
      }
    }, delay);
  });
}

function evalResult(res, cfg) {
  var winAmt = 0, winName = '', isJackpot = false;

  for (var i = 0; i < cfg.paytable.length; i++) {
    var row = cfg.paytable[i];
    var match = false;
    if (row.type === 3) {
      match = (res[0] === row.s[0] && res[1] === row.s[1] && res[2] === row.s[2]);
    } else if (row.type === 2) {
      match = (res[0] === row.s[0] && res[1] === row.s[1]);
    } else {
      match = (res[0] === row.s[0]);
    }
    if (match) {
      winAmt   = currentBet * row.mult;
      winName  = row.name;
      if (row.mult >= 25) isJackpot = true;
      break;
    }
  }

  var rm = document.getElementById('result-msg');

  if (winAmt > 0) {
    balance += winAmt;
    saveBalance();
    updateBalanceUI('win-flash');

    [0,1,2].forEach(function(i){ document.getElementById('r'+i).classList.add('win-reel'); });
    document.getElementById('win-line').classList.add('show');

    if (isJackpot) {
      sfxWin(true);
      showWinOverlay('🏆', 'ДЖЕКПОТ!', '+' + fmtWin(winAmt));
      rm.textContent = '🏆 ' + winName + '! +' + fmtWin(winAmt);
      rm.className = 'result-msg jackpot';
      spawnConfetti();
      hapticNotify('success');
    } else if (winAmt >= currentBet * 8) {
      sfxWin(true);
      showWinOverlay('🎉', 'БОЛЬШОЙ ВЫИГРЫШ!', '+' + fmtWin(winAmt));
      rm.textContent = '🎉 ' + winName + '! +' + fmtWin(winAmt);
      rm.className = 'result-msg win';
      spawnConfetti();
      hapticNotify('success');
    } else {
      sfxWin(false);
      rm.textContent = '✅ ' + winName + '! +' + fmtWin(winAmt);
      rm.className = 'result-msg win';
      hapticNotify('success');
    }
  } else {
    sfxLose();
    rm.textContent = '❌ Не повезло... Попробуй ещё!';
    rm.className = 'result-msg lose';
    haptic('medium');
  }

  isSpinning = false;
  document.getElementById('spin-btn').disabled = false;

  if (balance <= 0) {
    balance = 0; saveBalance(); updateBalanceUI();
    setTimeout(function(){ showToast('💸 Баланс исчерпан!'); }, 400);
  }
}

function fmtWin(n) { return '$' + n.toFixed(2); }

function showWinOverlay(emoji, title, amt) {
  document.getElementById('wo-emoji').textContent = emoji;
  document.getElementById('wo-title').textContent = title;
  document.getElementById('wo-amt').textContent   = amt;
  document.getElementById('win-overlay').classList.add('show');
  setTimeout(function(){ document.getElementById('win-overlay').classList.remove('show'); }, 3000);
}

// ═══════════════════════════════════════════
// 🐉  DRAGON HEAVEN ENGINE
// ═══════════════════════════════════════════

// Symbols: low value gems, high value items, scatter (dragon)
var DH_SYMS = {
  // low
  RUBY:    { emoji: '🔴', val: 'low',  color: '#E74C3C' },
  EMERALD: { emoji: '💚', val: 'low',  color: '#27AE60' },
  SAPPHIRE:{ emoji: '💙', val: 'low',  color: '#2980B9' },
  AMBER:   { emoji: '🟡', val: 'low',  color: '#F39C12' },
  AMETHYST:{ emoji: '💜', val: 'low',  color: '#8E44AD' },
  // high
  COIN:    { emoji: '🪙', val: 'high', color: '#F1C40F' },
  VASE:    { emoji: '🏮', val: 'high', color: '#E74C3C' },
  FAN:     { emoji: '🪭', val: 'high', color: '#E91E63' },
  SWORD:   { emoji: '⚔️', val: 'high', color: '#95A5A6' },
  // scatter
  DRAGON:  { emoji: '🐉', val: 'scatter', color: '#FF4500' }
};

var DH_SYM_KEYS = ['RUBY','EMERALD','SAPPHIRE','AMBER','AMETHYST','COIN','VASE','FAN','SWORD','DRAGON'];
// Weights for normal spin
var DH_WEIGHTS   = [14, 13, 13, 12, 12,  9,  8,  7,  6,  2];
// Weights during freespins (more scatters for extra)
var DH_WEIGHTS_FS= [12, 11, 11, 10, 10,  9,  8,  7,  6,  5];

// Pay table: min count → multiplier of bet  (Pay Anywhere: count anywhere on 6×5)
var DH_PAYTABLE = {
  RUBY:     { 8:1,  10:2,  12:4,  15:8,  20:15,  25:30  },
  EMERALD:  { 8:1,  10:2,  12:4,  15:8,  20:15,  25:30  },
  SAPPHIRE: { 8:1,  10:2,  12:4,  15:8,  20:15,  25:30  },
  AMBER:    { 8:1.5,10:3,  12:5,  15:10, 20:20,  25:40  },
  AMETHYST: { 8:1.5,10:3,  12:5,  15:10, 20:20,  25:40  },
  COIN:     { 8:3,  10:6,  12:12, 15:20, 20:40,  25:80  },
  VASE:     { 8:4,  10:8,  12:15, 15:25, 20:50,  25:100 },
  FAN:      { 8:5,  10:10, 12:20, 15:35, 20:75,  25:150 },
  SWORD:    { 8:7,  10:15, 12:30, 15:50, 20:100, 25:250 },
  DRAGON:   { 4:5,  5:20,  6:50,  7:200, 8:500          }  // scatter pays own
};

var DH_ROWS = 5;
var DH_COLS = 6;
var DH_TOTAL = DH_ROWS * DH_COLS; // 30

// Multiplier orbs Dragon can throw
var DH_MULT_VALUES = [2, 2, 2, 3, 3, 5, 5, 8, 10, 15, 20, 25, 50, 100, 500];
var DH_MULT_WEIGHTS= [20,18,16,14,12, 10, 8,  7,  5,  4,  3,  2,  1,   1,   1];

// State
var dh_bet     = 5;
var dh_ante    = false;
var dh_spin    = false;
var dh_grid    = [];   // array of 30 sym keys
var dh_freeLeft= 0;    // freespins remaining
var dh_freeTot = 0;    // total freespins in session
var dh_cumMult = 1;    // accumulated multiplier (freespin mode)
var dh_spinMult= 1;    // current spin multiplier (resets each spin in normal, accumulates in free)
var DH_BET_STEPS = [1, 2, 5, 10, 25, 50];

function openDragon() {
  dh_bet = 5; dh_ante = false; dh_spin = false;
  dh_freeLeft = 0; dh_cumMult = 1; dh_spinMult = 1;
  dhRenderGrid(dhGenerateGrid(false));
  dhUpdateStats();
  dhUpdateBetUI();
  document.getElementById('dh-msg').textContent = 'Нажмите SPIN для начала!';
  document.getElementById('dh-msg').className = 'dh-msg';
  document.getElementById('dh-spin-btn').className = 'dh-spin-btn';
  document.getElementById('dh-spin-btn').disabled = false;
  document.getElementById('dh-dragon-overlay').classList.remove('show');
  document.getElementById('dh-bigwin').classList.remove('show');
  document.getElementById('dh-ante-btn').classList.remove('on');
  updateBalanceUI();
  showScreen('dragon');
}

function dhBack() {
  dh_freeLeft = 0;
  hideBanner();
  showScreen('modes');
}

function dhGenerateGrid(freeMode) {
  var w = freeMode ? DH_WEIGHTS_FS : DH_WEIGHTS;
  var g = [];
  for (var i = 0; i < DH_TOTAL; i++) {
    g.push(dhWeightedRand(DH_SYM_KEYS, w));
  }
  return g;
}

function dhWeightedRand(keys, weights) {
  var total = 0;
  for (var i = 0; i < weights.length; i++) total += weights[i];
  var r = Math.random() * total;
  for (var i = 0; i < keys.length; i++) {
    r -= weights[i];
    if (r <= 0) return keys[i];
  }
  return keys[keys.length - 1];
}

function dhRenderGrid(grid) {
  dh_grid = grid;
  var el = document.getElementById('dh-grid');
  el.innerHTML = '';
  for (var i = 0; i < DH_TOTAL; i++) {
    var cell = document.createElement('div');
    cell.className = 'dh-cell' + (grid[i] === 'DRAGON' ? ' scatter' : '');
    cell.id = 'dhc-' + i;
    cell.textContent = DH_SYMS[grid[i]].emoji;
    el.appendChild(cell);
  }
}

function dhUpdateStats() {
  var betEff = dh_ante ? (dh_bet * 1.25) : dh_bet;
  document.getElementById('dh-bet-display').textContent = '$' + betEff.toFixed(dh_ante ? 2 : 0);
  var multStr = dh_freeLeft > 0 ? '×' + dh_cumMult : '×' + dh_spinMult;
  document.getElementById('dh-mult-display').textContent = multStr;
  document.getElementById('dh-free-display').textContent = dh_freeLeft > 0 ? dh_freeLeft : '—';
}

function dhChangeBet(dir) {
  var idx = DH_BET_STEPS.indexOf(dh_bet);
  dhSetBet(DH_BET_STEPS[Math.max(0, Math.min(DH_BET_STEPS.length-1, idx+dir))]);
}
function dhSetBet(val) {
  dh_bet = val;
  document.getElementById('dh-bet-val').textContent = '$' + val;
  document.querySelectorAll('.dh-bet-presets .bet-preset').forEach(function(b){
    b.classList.toggle('active', parseInt(b.textContent.replace('$','')) === val);
  });
  dhUpdateStats();
}
function dhToggleAnte() {
  dh_ante = !dh_ante;
  document.getElementById('dh-ante-btn').classList.toggle('on', dh_ante);
  dhUpdateStats();
}

function showBanner(txt) {
  var b = document.getElementById('dh-freespin-banner');
  if (!b) return;
  b.textContent = txt;
  b.classList.add('show');
}
function hideBanner() {
  var b = document.getElementById('dh-freespin-banner');
  if (b) b.classList.remove('show');
}

// ── Main spin entry ──
function dhSpin() {
  if (dh_spin) return;

  var isFree = dh_freeLeft > 0;
  if (!isFree) {
    var cost = dh_ante ? dh_bet * 1.25 : dh_bet;
    if (balance < cost) { showToast('❌ Недостаточно средств!'); return; }
    balance -= cost;
    saveBalance();
    updateBalanceUI('lose-flash');
  } else {
    dh_freeLeft--;
    dhUpdateStats();
    showBanner('🌀 ФРИСПИНЫ: осталось ' + dh_freeLeft);
    if (dh_freeLeft === 0) { setTimeout(hideBanner, 1800); }
  }

  dh_spin = true;
  dh_spinMult = 1;
  document.getElementById('dh-spin-btn').disabled = true;
  document.getElementById('dh-msg').textContent = '🐉 Дракон пробуждается...';
  document.getElementById('dh-msg').className = 'dh-msg';
  document.getElementById('dh-bigwin').classList.remove('show');

  // Generate new grid with animation
  var newGrid = dhGenerateGrid(isFree);
  dhAnimateSpin(newGrid, function() {
    dhEvaluate(newGrid, isFree, 0);
  });
}

function dhAnimateSpin(newGrid, cb) {
  // Shuffle current cells, then reveal new
  var el = document.getElementById('dh-grid');
  var cells = el.querySelectorAll('.dh-cell');

  // Quick shuffle animation per column
  var col_delay = [0, 60, 120, 180, 240, 300];
  var done = 0;
  for (var col = 0; col < DH_COLS; col++) {
    (function(c) {
      var iv = setInterval(function() {
        for (var row = 0; row < DH_ROWS; row++) {
          var idx = row * DH_COLS + c;
          cells[idx].textContent = DH_SYMS[dhWeightedRand(DH_SYM_KEYS, DH_WEIGHTS)].emoji;
        }
      }, 80);
      setTimeout(function() {
        clearInterval(iv);
        for (var row = 0; row < DH_ROWS; row++) {
          var idx = row * DH_COLS + c;
          var key = newGrid[idx];
          cells[idx].textContent = DH_SYMS[key].emoji;
          cells[idx].className = 'dh-cell' + (key === 'DRAGON' ? ' scatter' : '') + ' falling';
          cells[idx].id = 'dhc-' + idx;
        }
        haptic('light');
        done++;
        if (done === DH_COLS) { setTimeout(cb, 250); }
      }, col_delay[c] + 500);
    })(col);
  }
  dh_grid = newGrid;
}

// ── Evaluate grid after spin or tumble ──
function dhEvaluate(grid, isFree, tumbleCount) {
  // 1. Count each symbol
  var counts = {};
  DH_SYM_KEYS.forEach(function(k){ counts[k] = 0; });
  for (var i = 0; i < DH_TOTAL; i++) {
    if (grid[i]) counts[grid[i]]++;
  }

  // 2. Check dragon multiplier orbs (random event, 15% chance per spin)
  var orbChance = isFree ? 0.30 : 0.15;
  if (dh_ante) orbChance += 0.05;
  var orbMults = [];
  var orbCount = 0;
  if (Math.random() < orbChance) {
    orbCount = Math.floor(Math.random() * 3) + 1;
    for (var o = 0; o < orbCount; o++) {
      orbMults.push(dhWeightedRand(DH_MULT_VALUES.map(String), DH_MULT_WEIGHTS));
    }
  }

  // 3. Check scatter for freespins
  var scatterCount = counts['DRAGON'] || 0;
  var triggerFree = !isFree && scatterCount >= 4;
  var extraFree = isFree && scatterCount >= 3;

  // 4. Calculate wins
  var totalWinMult = 0;
  var winCells = {};
  DH_SYM_KEYS.forEach(function(sym) {
    if (sym === 'DRAGON') {
      // scatter pays on own count
      var sc = counts[sym];
      var ptSc = DH_PAYTABLE[sym];
      var thresholds = Object.keys(ptSc).map(Number).sort(function(a,b){return b-a;});
      for (var t = 0; t < thresholds.length; t++) {
        if (sc >= thresholds[t]) {
          totalWinMult += ptSc[thresholds[t]];
          break;
        }
      }
    } else {
      var cnt = counts[sym];
      var pt = DH_PAYTABLE[sym];
      var thresh = Object.keys(pt).map(Number).sort(function(a,b){return b-a;});
      for (var t = 0; t < thresh.length; t++) {
        if (cnt >= thresh[t]) {
          totalWinMult += pt[thresh[t]];
          // Mark winning cells
          for (var ci = 0; ci < DH_TOTAL; ci++) {
            if (grid[ci] === sym) winCells[ci] = true;
          }
          break;
        }
      }
    }
  });

  // Apply orb multipliers
  var orbSum = 0;
  orbMults.forEach(function(m){ orbSum += parseInt(m); });
  var spinMult = orbSum > 0 ? Math.max(1, orbSum) : 1;
  dh_spinMult = spinMult;

  if (isFree) {
    if (orbSum > 0) dh_cumMult += orbSum;
  }

  var effectiveMult = isFree ? dh_cumMult : spinMult;
  var betEff = dh_ante ? dh_bet * 1.25 : dh_bet;
  var winAmt = totalWinMult * betEff * effectiveMult;

  // Show orb animation if there were orbs
  if (orbMults.length > 0) {
    dhShowDragonOrbs(orbMults, isFree, function() {
      dhShowWinResult(grid, winCells, winAmt, totalWinMult, effectiveMult, isFree, triggerFree, extraFree, scatterCount, tumbleCount);
    });
  } else {
    dhShowWinResult(grid, winCells, winAmt, totalWinMult, effectiveMult, isFree, triggerFree, extraFree, scatterCount, tumbleCount);
  }
}

function dhShowDragonOrbs(mults, isFree, cb) {
  var overlay = document.getElementById('dh-dragon-overlay');
  var msg = document.getElementById('dh-dragon-msg');
  var anim = document.getElementById('dh-dragon-anim');

  anim.textContent = '🐉';
  msg.textContent = isFree
    ? '🌀 НАКОПЛЕННЫЙ ×' + dh_cumMult
    : '⚡ МНОЖИТЕЛЬ ×' + mults.reduce(function(a,b){return a+parseInt(b);},0);

  overlay.classList.add('show');
  hapticNotify('success');

  // Show orb emojis floating
  mults.forEach(function(m, i) {
    setTimeout(function() {
      var orb = document.createElement('div');
      orb.style.cssText = 'position:absolute;z-index:25;font-size:22px;font-weight:900;color:#FFD700;' +
        'left:' + (20 + Math.random()*60) + '%;top:' + (20 + Math.random()*50) + '%;' +
        'animation:confetti-fall 1.2s ease forwards;pointer-events:none;';
      orb.textContent = '×' + m + '🔮';
      document.getElementById('dh-grid-wrap').appendChild(orb);
      setTimeout(function(){ orb.remove(); }, 1400);
    }, i * 200);
  });

  setTimeout(function() {
    overlay.classList.remove('show');
    dhUpdateStats();
    cb();
  }, 1400 + mults.length * 200);
}

function dhShowWinResult(grid, winCells, winAmt, totalWinMult, effectiveMult, isFree, triggerFree, extraFree, scatterCount, tumbleCount) {
  var rm = document.getElementById('dh-msg');
  var hasWin = Object.keys(winCells).length > 0;

  // Highlight winning cells
  if (hasWin) {
    Object.keys(winCells).forEach(function(ci) {
      var cell = document.getElementById('dhc-' + ci);
      if (cell) cell.classList.add('win-cell');
    });
  }

  // Trigger freespins
  if (triggerFree) {
    dh_freeLeft = 15;
    dh_cumMult = 1;
    showBanner('🐉 ФРИСПИНЫ АКТИВИРОВАНЫ! 15 вращений!');
    rm.textContent = '🐉 15 ФРИСПИНОВ! Дракон пробудился!';
    rm.className = 'dh-msg freespin';
    document.getElementById('dh-spin-btn').className = 'dh-spin-btn freespin-mode';
    hapticNotify('success');
    spawnConfetti();
  } else if (extraFree && isFree) {
    var extra = scatterCount >= 5 ? 5 : 3;
    dh_freeLeft += extra;
    rm.textContent = '✨ +' + extra + ' дополнительных фриспинов!';
    rm.className = 'dh-msg freespin';
    hapticNotify('success');
  }

  if (winAmt > 0) {
    balance += winAmt;
    saveBalance();
    updateBalanceUI('win-flash');
    dhUpdateStats();

    if (winAmt >= dh_bet * 100) {
      // Dragon jackpot
      dhShowBigWin('🐉', '龙 ДЖЕКПОТ 龙', '+$' + winAmt.toFixed(2));
      rm.textContent = '🐉 ДЖЕКПОТ ДРАКОНА! +$' + winAmt.toFixed(2);
      rm.className = 'dh-msg win';
      spawnConfetti();
      hapticNotify('success');
    } else if (winAmt >= dh_bet * 20) {
      dhShowBigWin('✨', 'БОЛЬШОЙ ВЫИГРЫШ!', '+$' + winAmt.toFixed(2));
      rm.textContent = '✨ Большой выигрыш! +$' + winAmt.toFixed(2);
      rm.className = 'dh-msg win';
      spawnConfetti();
      hapticNotify('success');
    } else {
      if (!triggerFree) {
        rm.textContent = tumbleCount > 0
          ? '🔄 КАСКАД #' + tumbleCount + '! +$' + winAmt.toFixed(2)
          : '✅ Выигрыш! +$' + winAmt.toFixed(2);
        rm.className = tumbleCount > 0 ? 'dh-msg tumble' : 'dh-msg win';
      }
      hapticNotify('success');
    }

    // TUMBLE: remove winning cells and cascade
    setTimeout(function() {
      dhTumble(grid, winCells, isFree, tumbleCount + 1);
    }, 900);

  } else {
    if (!triggerFree) {
      rm.textContent = tumbleCount > 0
        ? '💫 Каскад завершён! Всего: +$' + winAmt.toFixed(2)
        : '❌ Без выигрыша. Попробуй ещё!';
      rm.className = 'dh-msg lose';
      haptic('medium');
    }
    // End spin
    dhEndSpin(isFree);
  }
}

function dhTumble(grid, winCells, isFree, tumbleCount) {
  var winIdxs = Object.keys(winCells).map(Number);
  if (winIdxs.length === 0) { dhEndSpin(isFree); return; }

  // Animate removal
  winIdxs.forEach(function(ci) {
    var cell = document.getElementById('dhc-' + ci);
    if (cell) { cell.classList.remove('win-cell'); cell.classList.add('removing'); }
  });

  setTimeout(function() {
    // Remove winning symbols from grid
    var newGrid = grid.slice();
    winIdxs.forEach(function(ci) { newGrid[ci] = null; });

    // Gravity: for each column, drop non-null symbols down, fill top with new
    for (var col = 0; col < DH_COLS; col++) {
      var colSyms = [];
      for (var row = DH_ROWS - 1; row >= 0; row--) {
        var idx = row * DH_COLS + col;
        if (newGrid[idx] !== null) colSyms.push(newGrid[idx]);
      }
      // Fill remaining with new symbols
      while (colSyms.length < DH_ROWS) {
        colSyms.push(dhWeightedRand(DH_SYM_KEYS, isFree ? DH_WEIGHTS_FS : DH_WEIGHTS));
      }
      // Write back bottom-to-top
      for (var row = DH_ROWS - 1; row >= 0; row--) {
        newGrid[row * DH_COLS + col] = colSyms[DH_ROWS - 1 - row];
      }
    }

    // Re-render
    dhRenderGridUpdate(newGrid);
    dh_grid = newGrid;

    // Evaluate tumbled grid
    setTimeout(function() {
      dhEvaluate(newGrid, isFree, tumbleCount);
    }, 400);
  }, 400);
}

function dhRenderGridUpdate(grid) {
  for (var i = 0; i < DH_TOTAL; i++) {
    var cell = document.getElementById('dhc-' + i);
    if (!cell) continue;
    var key = grid[i] || 'RUBY';
    cell.className = 'dh-cell' + (key === 'DRAGON' ? ' scatter' : '') + ' falling';
    cell.textContent = DH_SYMS[key].emoji;
  }
}

function dhEndSpin(isFree) {
  dh_spin = false;
  document.getElementById('dh-spin-btn').disabled = false;

  if (isFree && dh_freeLeft <= 0) {
    dh_freeLeft = 0;
    dh_cumMult = 1;
    document.getElementById('dh-spin-btn').className = 'dh-spin-btn';
    document.getElementById('dh-free-display').textContent = '—';
    hideBanner();
    showToast('🐉 Фриспины завершены!');
  }

  if (dh_freeLeft > 0) {
    // Auto-spin next freespin after short delay
    setTimeout(dhSpin, 800);
  }

  dhUpdateStats();
  if (balance <= 0) {
    balance = 0; saveBalance(); updateBalanceUI();
    setTimeout(function(){ showToast('💸 Баланс исчерпан!'); }, 400);
  }
}

function dhShowBigWin(emoji, title, amt) {
  document.getElementById('dh-bigwin-emoji').textContent = emoji;
  document.getElementById('dh-bigwin-title').textContent = title;
  document.getElementById('dh-bigwin-amt').textContent = amt;
  document.getElementById('dh-bigwin').classList.add('show');
  setTimeout(function(){ document.getElementById('dh-bigwin').classList.remove('show'); }, 3200);
}

function dhUpdateBetUI() {
  document.getElementById('dh-bet-val').textContent = '$' + dh_bet;
  document.querySelectorAll('.dh-bet-presets .bet-preset').forEach(function(b){
    b.classList.toggle('active', parseInt(b.textContent.replace('$','')) === dh_bet);
  });
}

// ═══════════════════════════════════════
// 🎲  DICE GAME
// ═══════════════════════════════════════
var DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
var dice_bet     = 5;
var dice_rolling = false;
var dice_numBet  = null;    // null or 1-6
var dice_eoBet   = null;    // null | 'even' | 'odd'
var dice_hlBet   = null;    // null | 'high' | 'low' | 'equal'
var DICE_BET_STEPS = [1,2,5,10,25,50,100];

function openDice() {
  dice_bet = 5; dice_rolling = false;
  dice_numBet = null; dice_eoBet = null; dice_hlBet = null;
  diceClearAllUI();
  document.getElementById('dice-result-msg').textContent = 'Сделайте ставку и бросайте!';
  document.getElementById('dice-result-msg').className = 'dice-result-msg';
  document.getElementById('dice-face').textContent = '⚀';
  document.getElementById('dice-face').className = 'dice-face';
  document.getElementById('dice-bet-val').textContent = '$5';
  diceUpdateActiveBets();
  updateBalanceUI();
  showScreen('dice');
}

function diceClearAllUI() {
  document.querySelectorAll('.dice-num-btn').forEach(function(b){ b.classList.remove('active'); });
  ['dice-even','dice-odd','dice-high','dice-equal','dice-low'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.classList.remove('active');
  });
}

function diceToggleNum(n) {
  if (dice_rolling) return;
  if (dice_numBet === n) {
    dice_numBet = null;
    document.querySelectorAll('.dice-num-btn').forEach(function(b){ b.classList.remove('active'); });
  } else {
    dice_numBet = n;
    document.querySelectorAll('.dice-num-btn').forEach(function(b,i){
      b.classList.toggle('active', i === n-1);
    });
  }
  diceUpdateActiveBets();
}

function diceToggleEO(val) {
  if (dice_rolling) return;
  if (dice_eoBet === val) { dice_eoBet = null; }
  else { dice_eoBet = val; }
  document.getElementById('dice-even').classList.toggle('active', dice_eoBet==='even');
  document.getElementById('dice-odd').classList.toggle('active', dice_eoBet==='odd');
  diceUpdateActiveBets();
}

function diceToggleHL(val) {
  if (dice_rolling) return;
  if (dice_hlBet === val) { dice_hlBet = null; }
  else { dice_hlBet = val; }
  ['high','equal','low'].forEach(function(k){
    document.getElementById('dice-'+k).classList.toggle('active', dice_hlBet===k);
  });
  diceUpdateActiveBets();
}

function diceUpdateActiveBets() {
  var parts = [];
  if (dice_numBet) parts.push('Число ' + dice_numBet + ' (×5)');
  if (dice_eoBet) parts.push(dice_eoBet === 'even' ? 'Чётное (×1.9)' : 'Нечётное (×1.9)');
  if (dice_hlBet) {
    var lbl = dice_hlBet === 'high' ? 'Да >3 (×1.9)' : dice_hlBet === 'low' ? 'Нет <3 (×1.9)' : 'Равно 3 (×5)';
    parts.push(lbl);
  }
  var el = document.getElementById('dice-active-bets');
  el.textContent = parts.length ? '✓ ' + parts.join(' · ') : 'Выберите хотя бы 1 ставку';
}

function diceChangeBet(dir) {
  var idx = DICE_BET_STEPS.indexOf(dice_bet);
  dice_bet = DICE_BET_STEPS[Math.max(0, Math.min(DICE_BET_STEPS.length-1, idx+dir))];
  document.getElementById('dice-bet-val').textContent = '$' + dice_bet;
}

function diceRoll() {
  if (dice_rolling) return;
  if (!dice_numBet && !dice_eoBet && !dice_hlBet) {
    showToast('⚠️ Сделайте хотя бы 1 ставку!'); return;
  }
  var betCount = (dice_numBet ? 1:0) + (dice_eoBet ? 1:0) + (dice_hlBet ? 1:0);
  var totalCost = dice_bet * betCount;
  if (balance < totalCost) { showToast('❌ Недостаточно средств!'); return; }

  balance -= totalCost;
  saveBalance();
  updateBalanceUI('lose-flash');
  sfxDice(); sfxBet();
  dice_rolling = true;
  document.getElementById('dice-roll-btn').disabled = true;
  document.getElementById('dice-result-msg').textContent = '🎲 Кубик летит...';
  document.getElementById('dice-result-msg').className = 'dice-result-msg';

  var face = document.getElementById('dice-face');
  face.className = 'dice-face rolling';

  // Animate random faces
  var result = Math.floor(Math.random()*6) + 1;
  var iv = setInterval(function(){
    face.textContent = DICE_FACES[Math.floor(Math.random()*6)];
  }, 80);

  setTimeout(function(){
    clearInterval(iv);
    face.textContent = DICE_FACES[result-1];
    face.className = 'dice-face';
    haptic('medium');
    setTimeout(function(){ diceEval(result, betCount); }, 200);
  }, 900);
}

function diceEval(result, betCount) {
  var wins = [], losses = [];

  // Cat 1: exact number
  if (dice_numBet) {
    if (dice_numBet === result) wins.push('Число ' + result + ' +$' + (dice_bet*5).toFixed(2));
    else losses.push('Число ' + dice_numBet);
  }
  // Cat 2: even/odd
  if (dice_eoBet) {
    var isEven = result % 2 === 0;
    if ((dice_eoBet==='even' && isEven) || (dice_eoBet==='odd' && !isEven)) {
      wins.push((dice_eoBet==='even'?'Чётное':'Нечётное') + ' +$' + (dice_bet*1.9).toFixed(2));
    } else losses.push(dice_eoBet==='even'?'Чётное':'Нечётное');
  }
  // Cat 3: high/low/equal
  if (dice_hlBet) {
    var hlWin = (dice_hlBet==='high' && result > 3) || (dice_hlBet==='low' && result < 3) || (dice_hlBet==='equal' && result === 3);
    var mult = dice_hlBet==='equal' ? 5 : 1.9;
    if (hlWin) wins.push((dice_hlBet==='equal'?'Равно 3':dice_hlBet==='high'?'Да >3':'Нет <3') + ' +$' + (dice_bet*mult).toFixed(2));
    else losses.push(dice_hlBet==='equal'?'Равно 3':dice_hlBet==='high'?'Да >3':'Нет <3');
  }

  var winAmt = 0;
  if (dice_numBet === result) winAmt += dice_bet * 5;
  if (dice_eoBet) {
    var isEven2 = result%2===0;
    if ((dice_eoBet==='even'&&isEven2)||(dice_eoBet==='odd'&&!isEven2)) winAmt += dice_bet*1.9;
  }
  if (dice_hlBet) {
    var hlW2 = (dice_hlBet==='high'&&result>3)||(dice_hlBet==='low'&&result<3)||(dice_hlBet==='equal'&&result===3);
    if (hlW2) winAmt += dice_bet*(dice_hlBet==='equal'?5:1.9);
  }

  var face = document.getElementById('dice-face');
  var rm   = document.getElementById('dice-result-msg');

  if (winAmt > 0) {
    balance += winAmt;
    saveBalance();
    updateBalanceUI('win-flash');
    sfxWin(winAmt >= dice_bet * 4);
    face.className = 'dice-face win';
    rm.textContent = '🏆 Выпало ' + result + ' — ' + wins.join(', ');
    rm.className = 'dice-result-msg win';
    if (winAmt >= dice_bet * 4) spawnConfetti();
    hapticNotify('success');
  } else {
    sfxLose();
    face.className = 'dice-face lose';
    rm.textContent = '❌ Выпало ' + result + ' — Нет совпадений';
    rm.className = 'dice-result-msg lose';
    haptic('medium');
  }

  dice_rolling = false;
  document.getElementById('dice-roll-btn').disabled = false;
  if (balance <= 0) { balance=0; saveBalance(); updateBalanceUI(); setTimeout(function(){showToast('💸 Баланс исчерпан!');},400); }
}

// ═══════════════════════════════════════
// 🎯  DARTS GAME
// ═══════════════════════════════════════

// Dart board: sectors 1-20 arranged like real dartboard
var DARTS_ORDER = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
// Red sectors on real board (outer ring alternates, we mark these as red)
var DARTS_RED_SECTORS = [20,18,13,10,2,3,7,8,14,12];
var darts_bet          = 5;
var darts_throwing     = false;
var darts_secBet       = null;   // null or 1-20
var darts_colorBet     = null;   // null | 'black' | 'red'
var darts_bullBet      = null;   // null | 'bull' | 'nobull'
var DARTS_BET_STEPS    = [1,2,5,10,25,50,100];
var dartsCtx           = null;

function openDarts() {
  darts_bet = 5; darts_throwing = false;
  darts_secBet = null; darts_colorBet = null; darts_bullBet = null;

  // Build num grid
  var grid = document.getElementById('darts-num-grid');
  grid.innerHTML = '';
  for (var i = 1; i <= 20; i++) {
    var isRed = DARTS_RED_SECTORS.indexOf(i) >= 0;
    var cell = document.createElement('div');
    cell.className = 'darts-num-cell ' + (isRed ? 'red-sector' : 'black-sector');
    cell.textContent = i;
    cell.dataset.num = i;
    cell.onclick = (function(n){ return function(){ dartsToggleSec(n); }; })(i);
    grid.appendChild(cell);
  }

  // Reset color / bull buttons
  document.getElementById('darts-black').classList.remove('active');
  document.getElementById('darts-red').classList.remove('active');
  document.getElementById('darts-bull').classList.remove('active');
  document.getElementById('darts-nobull').classList.remove('active');

  document.getElementById('darts-result-msg').textContent = 'Сделайте ставку и бросайте!';
  document.getElementById('darts-result-msg').className = 'darts-result-msg';
  document.getElementById('darts-dart').style.display = 'none';
  document.getElementById('darts-bet-val').textContent = '$5';
  dartsUpdateActiveBets();
  updateBalanceUI();
  dartsDrawBoard();
  showScreen('darts');
}

function dartsToggleSec(n) {
  if (darts_throwing) return;
  if (darts_secBet === n) { darts_secBet = null; }
  else { darts_secBet = n; }
  document.querySelectorAll('.darts-num-cell').forEach(function(c){
    c.classList.toggle('active', parseInt(c.dataset.num) === darts_secBet);
  });
  dartsUpdateActiveBets();
}
function dartsToggleColor(c) {
  if (darts_throwing) return;
  darts_colorBet = (darts_colorBet === c) ? null : c;
  document.getElementById('darts-black').classList.toggle('active', darts_colorBet==='black');
  document.getElementById('darts-red').classList.toggle('active',   darts_colorBet==='red');
  dartsUpdateActiveBets();
}
function dartsToggleBull() {
  if (darts_throwing) return;
  darts_bullBet = (darts_bullBet === 'bull') ? null : 'bull';
  document.getElementById('darts-bull').classList.toggle('active', darts_bullBet==='bull');
  document.getElementById('darts-nobull').classList.remove('active');
  dartsUpdateActiveBets();
}
function dartsToggleNoBull() {
  if (darts_throwing) return;
  darts_bullBet = (darts_bullBet === 'nobull') ? null : 'nobull';
  document.getElementById('darts-nobull').classList.toggle('active', darts_bullBet==='nobull');
  document.getElementById('darts-bull').classList.remove('active');
  dartsUpdateActiveBets();
}
function dartsUpdateActiveBets() {
  var parts = [];
  if (darts_secBet) parts.push('Секция '+darts_secBet+' (×18)');
  if (darts_colorBet) parts.push((darts_colorBet==='red'?'Красный':'Чёрный')+' (×1.9)');
  if (darts_bullBet) parts.push(darts_bullBet==='bull'?'Яблочко (×35)':'Не Bull (×1.2)');
  document.getElementById('darts-active-bets').textContent = parts.length ? '✓ ' + parts.join(' · ') : 'Выберите хотя бы 1 ставку';
}
function dartsChangeBet(dir) {
  var idx = DARTS_BET_STEPS.indexOf(darts_bet);
  darts_bet = DARTS_BET_STEPS[Math.max(0, Math.min(DARTS_BET_STEPS.length-1, idx+dir))];
  document.getElementById('darts-bet-val').textContent = '$' + darts_bet;
}

function dartsDrawBoard() {
  var canvas = document.getElementById('darts-canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  dartsCtx = ctx;
  var W = 240, H = 240, cx = W/2, cy = H/2;
  var slices = DARTS_ORDER.length;
  var angle = (Math.PI * 2) / slices;
  var rBull = 12, rBullOuter = 22;
  var rInner = 48, rThin = 60, rOuter = 102, rThick = 114;

  ctx.clearRect(0,0,W,H);

  // Background black
  ctx.beginPath(); ctx.arc(cx,cy,rThick,0,Math.PI*2); ctx.fillStyle='#111'; ctx.fill();

  for (var i = 0; i < slices; i++) {
    var num  = DARTS_ORDER[i];
    var isRed = DARTS_RED_SECTORS.indexOf(num) >= 0;
    var startA = -Math.PI/2 + i*angle;
    var endA   = startA + angle;
    var colMain   = isRed ? '#C0392B' : '#1a1a1a';
    var colThin   = isRed ? '#27AE60' : '#E74C3C';

    // Main big sector
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy, rOuter, startA, endA);
    ctx.closePath();
    ctx.fillStyle = colMain; ctx.fill();
    ctx.strokeStyle='#333'; ctx.lineWidth=0.5; ctx.stroke();

    // Thin outer ring (triple)
    ctx.beginPath();
    ctx.arc(cx,cy, rOuter, startA, endA);
    ctx.arc(cx,cy, rThick, endA, startA, true);
    ctx.closePath();
    ctx.fillStyle = colThin; ctx.fill();
    ctx.strokeStyle='#222'; ctx.lineWidth=0.5; ctx.stroke();

    // Thin inner ring (double)
    ctx.beginPath();
    ctx.arc(cx,cy, rInner, startA, endA);
    ctx.arc(cx,cy, rThin, endA, startA, true);
    ctx.closePath();
    ctx.fillStyle = colThin; ctx.fill();
    ctx.strokeStyle='#222'; ctx.lineWidth=0.5; ctx.stroke();

    // Number
    var midA = startA + angle/2;
    var nr = rThick + 10;
    ctx.fillStyle = '#F0C060';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(num, cx + Math.cos(midA)*nr, cy + Math.sin(midA)*nr);
  }

  // Bull outer (green)
  ctx.beginPath(); ctx.arc(cx,cy,rBullOuter,0,Math.PI*2);
  ctx.fillStyle='#27AE60'; ctx.fill(); ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=1; ctx.stroke();
  // Bull inner (red)
  ctx.beginPath(); ctx.arc(cx,cy,rBull,0,Math.PI*2);
  ctx.fillStyle='#C0392B'; ctx.fill();

  // Border ring
  ctx.beginPath(); ctx.arc(cx,cy,rThick,0,Math.PI*2);
  ctx.strokeStyle='rgba(201,168,76,0.5)'; ctx.lineWidth=2; ctx.stroke();
}

function dartsThrow() {
  if (darts_throwing) return;
  if (!darts_secBet && !darts_colorBet && !darts_bullBet) {
    showToast('⚠️ Сделайте хотя бы 1 ставку!'); return;
  }
  var betCount = (darts_secBet?1:0) + (darts_colorBet?1:0) + (darts_bullBet?1:0);
  var totalCost = darts_bet * betCount;
  if (balance < totalCost) { showToast('❌ Недостаточно средств!'); return; }

  balance -= totalCost;
  saveBalance();
  updateBalanceUI('lose-flash');
  darts_throwing = true;
  document.getElementById('darts-throw-btn').disabled = true;
  document.getElementById('darts-result-msg').textContent = '🎯 Дротик летит...';
  document.getElementById('darts-result-msg').className = 'darts-result-msg';

  // Generate result
  var isBull   = Math.random() < 0.04;   // 4% bull
  var resultSec= isBull ? null : DARTS_ORDER[Math.floor(Math.random()*20)];
  var resultRed= resultSec ? DARTS_RED_SECTORS.indexOf(resultSec) >= 0 : null;

  // Compute hit position on canvas
  var canvas = document.getElementById('darts-canvas');
  var W = 240, cx = W/2, cy = W/2;
  var hitX, hitY;

  if (isBull) {
    var angle = Math.random()*Math.PI*2;
    var r = Math.random() * 12;
    hitX = cx + Math.cos(angle)*r;
    hitY = cy + Math.sin(angle)*r;
  } else {
    var secIdx = DARTS_ORDER.indexOf(resultSec);
    var sliceAngle = Math.PI*2/20;
    var midA = -Math.PI/2 + secIdx*sliceAngle + sliceAngle/2;
    var r = 55 + Math.random()*45;
    hitX = cx + Math.cos(midA)*r;
    hitY = cy + Math.sin(midA)*r;
  }

  // Animate dart
  var dartEl = document.getElementById('darts-dart');
  dartEl.style.left  = hitX + 'px';
  dartEl.style.top   = hitY + 'px';
  dartEl.style.display = 'block';
  dartEl.className = 'darts-dart throwing';
  haptic('medium');

  // Draw hit marker
  setTimeout(function(){
    dartsDrawBoard();
    if (dartsCtx) {
      dartsCtx.beginPath(); dartsCtx.arc(hitX, hitY, 5, 0, Math.PI*2);
      dartsCtx.fillStyle = 'rgba(255,220,0,0.9)'; dartsCtx.fill();
      dartsCtx.strokeStyle = '#fff'; dartsCtx.lineWidth = 1.5; dartsCtx.stroke();
    }
    dartsEval(resultSec, resultRed, isBull, betCount);
  }, 550);
}

function dartsEval(sec, isRed, isBull, betCount) {
  var winAmt = 0;
  var winParts = [];

  // Cat 1: section
  if (darts_secBet) {
    if (sec === darts_secBet) {
      winAmt += darts_bet * 18;
      winParts.push('Секция ' + sec + ' ✓ +$' + (darts_bet*18).toFixed(2));
    }
  }
  // Cat 2: color
  if (darts_colorBet) {
    if (!isBull) {
      var colorMatch = (darts_colorBet==='red' && isRed) || (darts_colorBet==='black' && !isRed);
      if (colorMatch) {
        winAmt += darts_bet * 1.9;
        winParts.push((darts_colorBet==='red'?'Красный':'Чёрный') + ' ✓ +$' + (darts_bet*1.9).toFixed(2));
      }
    }
  }
  // Cat 3: bull
  if (darts_bullBet) {
    if (darts_bullBet === 'bull' && isBull) {
      winAmt += darts_bet * 35;
      winParts.push('🎯 ЯБЛОЧКО! +$' + (darts_bet*35).toFixed(2));
    } else if (darts_bullBet === 'nobull' && !isBull) {
      winAmt += darts_bet * 1.2;
      winParts.push('Не Bull ✓ +$' + (darts_bet*1.2).toFixed(2));
    }
  }

  var rm = document.getElementById('darts-result-msg');
  var secText = isBull ? '🎯 ЯБЛОЧКО' : 'Секция ' + sec + (isRed ? ' 🔴' : ' ⬛');

  if (winAmt > 0) {
    balance += winAmt;
    saveBalance();
    updateBalanceUI('win-flash');
    rm.textContent = secText + ' — ' + winParts.join(', ');
    rm.className = 'darts-result-msg win';
    if (isBull || winAmt >= darts_bet * 15) spawnConfetti();
    hapticNotify('success');
  } else {
    rm.textContent = secText + ' — Ни одна ставка не сыграла';
    rm.className = 'darts-result-msg lose';
    haptic('medium');
  }

  darts_throwing = false;
  document.getElementById('darts-throw-btn').disabled = false;
  if (balance <= 0) { balance=0; saveBalance(); updateBalanceUI(); setTimeout(function(){showToast('💸 Баланс исчерпан!');},400); }
}

/* ══════════════════════════════════════════
   🌊  OCEAN FORTUNE  (3×3 slot)
══════════════════════════════════════════ */
var OC_SYMS = {
  SHARK:    { e:'🦈', w:2  },
  PEARL:    { e:'💎', w:4  },
  OCTOPUS:  { e:'🐙', w:8  },
  SQUID:    { e:'🦑', w:10 },
  CRAB:     { e:'🦀', w:12 },
  FISH:     { e:'🐠', w:16 },
  SHELL:    { e:'🐚', w:18 },
  STAR:     { e:'⭐', w:18 },
  WAVE:     { e:'🌊', w:12 }
};
var OC_KEYS = Object.keys(OC_SYMS);
var OC_WEIGHTS = OC_KEYS.map(function(k){ return OC_SYMS[k].w; });

// Pay table: 3-of-a-kind multipliers
var OC_PAY3 = { SHARK:50, PEARL:25, OCTOPUS:12, SQUID:8, CRAB:5, FISH:3, SHELL:2, STAR:2 };
// Win lines: 8 lines for 3×3 grid (indices)
var OC_LINES = [
  [0,1,2], [3,4,5], [6,7,8],       // rows
  [0,3,6], [1,4,7], [2,5,8],       // cols
  [0,4,8], [2,4,6]                  // diagonals
];

var oc_bet      = 5;
var oc_spinning = false;
var OC_BET_STEPS = [1,2,5,10,25,50];

function openOcean() {
  oc_bet = 5; oc_spinning = false;
  var grid = [];
  for(var i=0;i<9;i++) grid.push(ocRandSym());
  ocRenderStatic(grid);
  document.getElementById('oc-result').textContent = 'Нажмите SPIN чтобы начать!';
  document.getElementById('oc-result').className = 'oc-result';
  document.getElementById('oc-spin-btn').disabled = false;
  document.getElementById('oc-bigwin').classList.remove('show');
  document.getElementById('oc-bet-val').textContent = '$5';
  updateBalanceUI();
  showScreen('ocean');
}

function ocRandSym() {
  var total=0; OC_WEIGHTS.forEach(function(w){total+=w;});
  var r=Math.random()*total;
  for(var i=0;i<OC_KEYS.length;i++){ r-=OC_WEIGHTS[i]; if(r<=0) return OC_KEYS[i]; }
  return OC_KEYS[OC_KEYS.length-1];
}

function ocRenderStatic(grid) {
  for(var i=0;i<9;i++){
    var c=document.getElementById('oc'+i);
    if(c){ c.textContent = OC_SYMS[grid[i]].e; c.className='oc-cell'; }
  }
  ocClearLines();
}

function ocClearLines() {
  var cv=document.getElementById('oc-lines');
  if(!cv) return;
  var ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height);
}

function ocChangeBet(dir) {
  var idx=OC_BET_STEPS.indexOf(oc_bet);
  ocSetBet(OC_BET_STEPS[Math.max(0,Math.min(OC_BET_STEPS.length-1,idx+dir))]);
}
function ocSetBet(v) {
  oc_bet=v;
  document.getElementById('oc-bet-val').textContent='$'+v;
  document.querySelectorAll('.oc-bet-presets .bet-preset').forEach(function(b){
    b.classList.toggle('active', parseInt(b.textContent.replace('$',''))===v);
  });
}

function ocSpin() {
  if(oc_spinning) return;
  if(balance<oc_bet){ showToast('❌ Недостаточно средств!'); return; }
  balance-=oc_bet; saveBalance(); updateBalanceUI('lose-flash');
  oc_spinning=true;
  document.getElementById('oc-spin-btn').disabled=true;
  document.getElementById('oc-result').textContent='🌊 Волны закручиваются...';
  document.getElementById('oc-result').className='oc-result';
  document.getElementById('oc-bigwin').classList.remove('show');
  ocClearLines();

  var cells=[];
  for(var i=0;i<9;i++) cells.push(document.getElementById('oc'+i));
  cells.forEach(function(c){c.classList.remove('win-cell'); c.classList.add('spinning');});

  var result=[];
  for(var i=0;i<9;i++) result.push(ocRandSym());

  // Stop cols 1→2→3 with delay
  var colDone=0;
  [[0,3,6],[1,4,7],[2,5,8]].forEach(function(col,ci){
    var iv=setInterval(function(){
      col.forEach(function(idx){ cells[idx].textContent=OC_SYMS[ocRandSym()].e; });
    },75);
    setTimeout(function(){
      clearInterval(iv);
      col.forEach(function(idx){
        cells[idx].classList.remove('spinning');
        cells[idx].textContent=OC_SYMS[result[idx]].e;
      });
      haptic('light');
      colDone++;
      if(colDone===3) setTimeout(function(){ocEval(result);},250);
    },500+ci*280);
  });
}

function ocEval(grid) {
  var winAmt=0, winLines=[], winCells={};

  OC_LINES.forEach(function(line){
    var s=grid[line[0]];
    if(grid[line[1]]===s && grid[line[2]]===s && OC_PAY3[s]){
      winAmt+=oc_bet*OC_PAY3[s];
      winLines.push(line);
      line.forEach(function(i){winCells[i]=true;});
    }
    // 2-of-a-kind on row 0 for FISH (special)
    if(s==='FISH' && grid[line[1]]==='FISH' && grid[line[2]]!=='FISH' && line[0]<3){
      winAmt+=oc_bet*1.5;
    }
  });

  var rm=document.getElementById('oc-result');

  if(winAmt>0){
    balance+=winAmt; saveBalance(); updateBalanceUI('win-flash');
    Object.keys(winCells).forEach(function(i){ document.getElementById('oc'+i).classList.add('win-cell'); });
    ocDrawLines(winLines);

    if(winAmt>=oc_bet*20){
      document.getElementById('oc-bw-emoji').textContent = winAmt>=oc_bet*40?'🦈':'🌊';
      document.getElementById('oc-bw-title').textContent = winAmt>=oc_bet*40?'ДЖЕКПОТ!':'ВОЛНА УДАЧИ!';
      document.getElementById('oc-bw-amt').textContent = '+$'+winAmt.toFixed(2);
      document.getElementById('oc-bigwin').classList.add('show');
      spawnConfetti();
      setTimeout(function(){document.getElementById('oc-bigwin').classList.remove('show');},3000);
    }
    rm.textContent='✅ Выигрыш! +$'+winAmt.toFixed(2);
    rm.className='oc-result win';
    hapticNotify('success');
  } else {
    rm.textContent='❌ Волна прошла мимо... Попробуй снова!';
    rm.className='oc-result lose';
    haptic('medium');
  }
  oc_spinning=false;
  document.getElementById('oc-spin-btn').disabled=false;
  if(balance<=0){balance=0;saveBalance();updateBalanceUI();setTimeout(function(){showToast('💸 Баланс исчерпан!');},400);}
}

function ocDrawLines(lines) {
  var cv=document.getElementById('oc-lines'); if(!cv) return;
  var ctx=cv.getContext('2d');
  ctx.clearRect(0,0,cv.width,cv.height);
  var gridEl=document.getElementById('oc-grid');
  if(!gridEl) return;
  var gw=gridEl.offsetWidth, gh=gridEl.offsetHeight;
  cv.width=gw; cv.height=gh;
  var cw=gw/3, ch=gh/3;
  var colors=['rgba(0,220,255,0.8)','rgba(255,200,0,0.8)','rgba(100,255,100,0.8)',
              'rgba(255,100,200,0.8)','rgba(255,150,0,0.8)'];
  lines.forEach(function(line,li){
    var r0=Math.floor(line[0]/3), c0=line[0]%3;
    var r2=Math.floor(line[2]/3), c2=line[2]%3;
    ctx.beginPath();
    ctx.moveTo(c0*cw+cw/2, r0*ch+ch/2);
    ctx.lineTo(c2*cw+cw/2, r2*ch+ch/2);
    ctx.strokeStyle=colors[li%colors.length];
    ctx.lineWidth=3; ctx.lineCap='round';
    ctx.shadowColor=colors[li%colors.length]; ctx.shadowBlur=8;
    ctx.stroke();
  });
}

/* ══════════════════════════════════════════
   🎡  EUROPEAN ROULETTE
══════════════════════════════════════════ */
// European roulette: 37 numbers (0-36)
var RL_RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
// Layout order for drawing wheel
var RL_WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

var rl_bet       = 5;
var rl_spinning  = false;
var rl_numBets   = {};  // {number: true}
var rl_outBets   = {};  // {type: true}
var rl_wheelAngle= 0;
var RL_BET_STEPS = [1,2,5,10,25,50];

var RL_OUT_PAY = { red:1, black:1, even:1, odd:1, low:1, high:1, d1:2, d2:2, d3:2, c1:2, c2:2, c3:2 };

function openMahjong() {
  mj_round=0; mj_bet=5; mj_phase="idle";
  mj_hand=[]; mj_discard=[]; mj_deck=[];
  document.getElementById("mj-hand").innerHTML="";
  document.getElementById("mj-discard").innerHTML="";
  document.getElementById("mj-msg").textContent="Нажмите НОВАЯ ИГРА чтобы начать!";
  document.getElementById("mj-msg").className="mj-msg";
  document.getElementById("mj-hand-name").textContent="—";
  document.getElementById("mj-round").textContent="0";
  document.getElementById("mj-bet-show").textContent="$5";
  document.getElementById("mj-bet-val").textContent="$5";
  document.getElementById("mj-draw-btn").disabled=true;
  document.getElementById("mj-discard-btn").disabled=true;
  document.getElementById("mj-declare-btn").disabled=true;
  document.getElementById("mj-declare-btn").classList.remove("ready");
  updateBalanceUI();
  showScreen("mahjong");
}

function openRoulette() {
  rl_bet=5; rl_spinning=false; rl_numBets={}; rl_outBets={};
  rlBuildNumGrid();
  rlClearOutUI();
  document.getElementById('rl-result-msg').textContent = 'Выберите ставки и крутите колесо!';
  document.getElementById('rl-result-msg').className = 'rl-result-msg';
  document.getElementById('rl-result-num').style.opacity = '0';
  document.getElementById('rl-result-num').textContent = '';
  document.getElementById('rl-ball').style.display = 'none';
  document.getElementById('rl-bet-val').textContent = '$5';
  document.getElementById('rl-spin-btn').disabled = false;
  rlUpdateBetInfo();
  rlDrawWheel(0);
  updateBalanceUI();
  showScreen('roulette');
}

function rlBuildNumGrid() {
  var g=document.getElementById('rl-num-grid');
  g.innerHTML='';
  // Zero cell
  var z=document.createElement('div');
  z.className='rl-num-cell'; z.dataset.n='0'; z.textContent='0';
  z.style.background='#1a6b1a'; z.style.color='#fff'; z.style.gridColumn='span 1';
  z.onclick=function(){rlToggleNum(0);};
  g.appendChild(z);
  // Numbers 1-36 in 6-column layout
  for(var n=1;n<=36;n++){
    var c=document.createElement('div');
    var isRed=RL_RED.indexOf(n)>=0;
    c.className='rl-num-cell '+(isRed?'rl-red':'rl-black');
    c.dataset.n=n; c.textContent=n;
    c.onclick=(function(nn){return function(){rlToggleNum(nn);};})(n);
    g.appendChild(c);
  }
}

function rlToggleNum(n) {
  if(rl_spinning) return;
  if(rl_numBets[n]) { delete rl_numBets[n]; }
  else { rl_numBets[n]=true; }
  var el=document.querySelector('.rl-num-cell[data-n="'+n+'"]');
  if(el){
    el.classList.toggle('rl-active', !!rl_numBets[n]);
    var chip=el.querySelector('.rl-chip');
    if(rl_numBets[n]){
      if(!chip){ chip=document.createElement('div'); chip.className='rl-chip'; chip.textContent='$'; el.appendChild(chip); }
    } else { if(chip) chip.remove(); }
  }
  rlUpdateBetInfo();
}

function rlToggleOut(type) {
  if(rl_spinning) return;
  if(rl_outBets[type]) { delete rl_outBets[type]; }
  else { rl_outBets[type]=true; }
  document.getElementById('rlo-'+type).classList.toggle('active', !!rl_outBets[type]);
  rlUpdateBetInfo();
}

function rlClearBets() {
  rl_numBets={}; rl_outBets={};
  document.querySelectorAll('.rl-num-cell').forEach(function(c){
    c.classList.remove('rl-active');
    var chip=c.querySelector('.rl-chip'); if(chip) chip.remove();
  });
  rlClearOutUI();
  rlUpdateBetInfo();
}

function rlClearOutUI() {
  document.querySelectorAll('.rl-out-btn').forEach(function(b){b.classList.remove('active');});
}

function rlUpdateBetInfo() {
  var numCount=Object.keys(rl_numBets).length;
  var outCount=Object.keys(rl_outBets).length;
  var total=(numCount+outCount)*rl_bet;
  var info=document.getElementById('rl-bet-info');
  if(numCount+outCount===0){
    info.textContent='Ставок нет. Выберите хотя бы одну.';
  } else {
    info.textContent='Ставок: '+(numCount+outCount)+' · Итого: $'+total.toFixed(2);
  }
}

function rlChangeBet(dir){
  var idx=RL_BET_STEPS.indexOf(rl_bet);
  rlSetBet(RL_BET_STEPS[Math.max(0,Math.min(RL_BET_STEPS.length-1,idx+dir))]);
}
function rlSetBet(v){
  rl_bet=v;
  document.getElementById('rl-bet-val').textContent='$'+v;
  document.querySelectorAll('.rl-controls .bet-preset').forEach(function(b){
    b.classList.toggle('active', parseInt(b.textContent.replace('$',''))===v);
  });
  rlUpdateBetInfo();
}

function rlDrawWheel(highlightNum) {
  var cv=document.getElementById('rl-canvas'); if(!cv) return;
  var ctx=cv.getContext('2d');
  var W=200, cx=100, cy=100, r=96, ri=30;
  ctx.clearRect(0,0,W,W);
  var n=RL_WHEEL_ORDER.length;
  var sliceA=Math.PI*2/n;

  RL_WHEEL_ORDER.forEach(function(num,i){
    var sa=rl_wheelAngle + i*sliceA - Math.PI/2;
    var ea=sa+sliceA;
    var isRed=RL_RED.indexOf(num)>=0;
    var isZero=num===0;
    var isHigh=num===highlightNum && highlightNum!==null;

    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,sa,ea); ctx.closePath();
    ctx.fillStyle = isHigh ? '#FFD700' : isZero ? '#1a7a1a' : isRed ? '#9B2226' : '#1a1a1a';
    ctx.fill();
    ctx.strokeStyle='rgba(201,168,76,0.3)'; ctx.lineWidth=0.5; ctx.stroke();

    // Number
    var midA=sa+sliceA/2;
    ctx.save();
    ctx.translate(cx+Math.cos(midA)*(r*0.72), cy+Math.sin(midA)*(r*0.72));
    ctx.rotate(midA+Math.PI/2);
    ctx.fillStyle=isHigh?'#000':'#eee'; ctx.font='bold 8px Arial';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(num,0,0);
    ctx.restore();
  });

  // Center hub
  ctx.beginPath(); ctx.arc(cx,cy,ri,0,Math.PI*2);
  ctx.fillStyle='#0d0d0d'; ctx.fill();
  ctx.strokeStyle='rgba(201,168,76,0.5)'; ctx.lineWidth=2; ctx.stroke();

  // Pointer triangle at top
  ctx.beginPath();
  ctx.moveTo(cx,cy-r+2); ctx.lineTo(cx-8,cy-r-10); ctx.lineTo(cx+8,cy-r-10);
  ctx.closePath(); ctx.fillStyle='#FFD700'; ctx.fill();
}

function rlSpin() {
  if(rl_spinning) return;
  var numCount=Object.keys(rl_numBets).length;
  var outCount=Object.keys(rl_outBets).length;
  if(numCount+outCount===0){ showToast('⚠️ Сделайте хотя бы 1 ставку!'); return; }
  var cost=(numCount+outCount)*rl_bet;
  if(balance<cost){ showToast('❌ Недостаточно средств!'); return; }

  balance-=cost; saveBalance(); updateBalanceUI('lose-flash');
  sfxRoulette(); sfxBet();
  rl_spinning=true;
  document.getElementById('rl-spin-btn').disabled=true;
  document.getElementById('rl-result-num').style.opacity='0';
  document.getElementById('rl-result-num').textContent='';
  document.getElementById('rl-result-msg').textContent='🎡 Колесо крутится...';
  document.getElementById('rl-result-msg').className='rl-result-msg';

  var result=Math.floor(Math.random()*37); // 0-36
  var targetIdx=RL_WHEEL_ORDER.indexOf(result);

  // Animate wheel spin
  var totalSpins=4+Math.random()*3;
  var targetAngle=-(targetIdx/RL_WHEEL_ORDER.length)*Math.PI*2 - (Math.PI*2*totalSpins);
  var startAngle=rl_wheelAngle;
  var startTime=null;
  var duration=4000;

  function animate(ts) {
    if(!startTime) startTime=ts;
    var progress=Math.min(1,(ts-startTime)/duration);
    // Ease out cubic
    var ease=1-Math.pow(1-progress,3);
    rl_wheelAngle=startAngle+targetAngle*ease;
    rlDrawWheel(null);
    if(progress<1){ requestAnimationFrame(animate); }
    else {
      rl_wheelAngle=startAngle+targetAngle;
      rlDrawWheel(result);
      haptic('medium');
      setTimeout(function(){rlEval(result);},400);
    }
  }
  requestAnimationFrame(animate);
}

function rlEval(result) {
  var isRed=RL_RED.indexOf(result)>=0;
  var isBlack=result!==0 && !isRed;
  var isEven=result!==0 && result%2===0;
  var isOdd=result!==0 && result%2!==0;

  var winAmt=0;

  // Straight-up bets
  if(rl_numBets[result]){
    winAmt+=rl_bet*35; // win + return stake = 35:1 payout + return
  }

  // Outside bets
  var outChecks={
    red:   isRed,
    black: isBlack,
    even:  isEven,
    odd:   isOdd,
    low:   result>=1&&result<=18,
    high:  result>=19&&result<=36,
    d1:    result>=1&&result<=12,
    d2:    result>=13&&result<=24,
    d3:    result>=25&&result<=36,
    c1:    result%3===1,
    c2:    result%3===2,
    c3:    result%3===0&&result!==0
  };
  Object.keys(rl_outBets).forEach(function(type){
    if(outChecks[type]){
      winAmt+=rl_bet*(RL_OUT_PAY[type]+1); // payout + return
    }
  });

  // Show result number on wheel
  var rlResEl=document.getElementById('rl-result-num');
  rlResEl.textContent=result;
  rlResEl.style.color=result===0?'#4CAF50':isRed?'#E74C3C':'#eee';
  rlResEl.style.opacity='1';

  var rm=document.getElementById('rl-result-msg');
  if(winAmt>0){
    balance+=winAmt; saveBalance(); updateBalanceUI('win-flash');
    sfxWin(winAmt>=rl_bet*10);
    rm.textContent='🏆 Выпало '+result+(isRed?' 🔴':result===0?' 🟢':' ⬛')+' — Выигрыш $'+winAmt.toFixed(2);
    rm.className='rl-result-msg win';
    if(winAmt>=rl_bet*10) spawnConfetti();
    hapticNotify('success');
  } else {
    sfxLose();
    rm.textContent='❌ Выпало '+result+(isRed?' 🔴':result===0?' 🟢':' ⬛')+' — Ставки не сыграли';
    rm.className='rl-result-msg lose';
    haptic('medium');
  }
  rl_spinning=false;
  document.getElementById('rl-spin-btn').disabled=false;
  if(balance<=0){balance=0;saveBalance();updateBalanceUI();setTimeout(function(){showToast('💸 Баланс исчерпан!');},400);}
}

/* ══════════════════════════════════════════
   🀄  MAHJONG  (simplified casino Mahjong)
   Rules: Hong Kong Mahjong style
   - 136 tiles (4 suits × 9 × 4) + honour tiles
   - Player draws/discards to form winning hand
   - Win conditions: 4 sets (melds) + 1 pair
   - Melds: pung (3 of a kind) or chow (sequence of 3)
══════════════════════════════════════════ */
var MJ_SUITS = [
  { name:'Бамбук', prefix:'B', emojis:['🎋','🎍','🪵','🍃','🌿','🎄','🌾','🎐','🎑'] },
  { name:'Символы', prefix:'C', emojis:['①','②','③','④','⑤','⑥','⑦','⑧','⑨'] },
  { name:'Круги', prefix:'D', emojis:['🔵','🟢','🟡','🟠','🔴','🟣','🟤','⚪','⚫'] }
];
// Honour tiles
var MJ_HONOURS = [
  {id:'W',e:'🀀',n:'Восток'},{id:'X',e:'🀁',n:'Юг'},{id:'Y',e:'🀂',n:'Запад'},{id:'Z',e:'🀃',n:'Север'},
  {id:'H',e:'🉐',n:'Хон'},{id:'F',e:'🈶',n:'Фа'},{id:'G',e:'🈵',n:'Бай'}
];

var mj_deck     = [];
var mj_hand     = [];   // 13 tiles normally, 14 after draw
var mj_discard  = [];
var mj_selected = null; // index in hand
var mj_phase    = 'idle'; // idle | playing | draw | done
var mj_bet      = 5;
var mj_round    = 0;
var mj_draws    = 0;
var MJ_BET_STEPS = [1,2,5,10,25,50];

function mjBuildDeck() {
  var deck=[];
  MJ_SUITS.forEach(function(suit,si){
    for(var val=1;val<=9;val++){
      for(var copy=0;copy<4;copy++){
        deck.push({suit:si, val:val, id:suit.prefix+val, emoji:suit.emojis[val-1], suitName:suit.name});
      }
    }
  });
  MJ_HONOURS.forEach(function(h){
    for(var copy=0;copy<4;copy++){
      deck.push({suit:3, val:0, id:h.id, emoji:h.e, suitName:h.n, honour:true, name:h.n});
    }
  });
  // Shuffle
  for(var i=deck.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var tmp=deck[i]; deck[i]=deck[j]; deck[j]=tmp;
  }
  return deck;
}

function mjNewGame() {
  if(balance<mj_bet){ showToast('❌ Недостаточно средств!'); return; }
  balance-=mj_bet; saveBalance(); updateBalanceUI('lose-flash');
  mj_round++;
  mj_draws=0;
  mj_deck=mjBuildDeck();
  mj_hand=[];
  mj_discard=[];
  mj_selected=null;
  mj_phase='playing';

  // Deal 13 tiles
  for(var i=0;i<13;i++) mj_hand.push(mj_deck.pop());
  mj_hand.sort(mjSortTile);

  mjRenderHand();
  mjRenderDiscard();
  mjUpdateActions();
  document.getElementById('mj-round').textContent=mj_round;
  document.getElementById('mj-bet-show').textContent='$'+mj_bet;
  document.getElementById('mj-hand-name').textContent='—';
  document.getElementById('mj-msg').textContent='Тяните тайл из колоды чтобы начать!';
  document.getElementById('mj-msg').className='mj-msg info';
  document.getElementById('mj-draw-btn').disabled=false;
  document.getElementById('mj-discard-btn').disabled=true;
  document.getElementById('mj-declare-btn').disabled=true;
  document.getElementById('mj-declare-btn').classList.remove('ready');
  updateBalanceUI();
}

function mjSortTile(a,b) {
  if(a.suit!==b.suit) return a.suit-b.suit;
  return a.val-b.val;
}

function mjRenderHand() {
  var el=document.getElementById('mj-hand');
  el.innerHTML='';
  mj_hand.forEach(function(tile,i){
    var div=document.createElement('div');
    div.className='mj-tile'+(mj_selected===i?' selected':'');
    div.innerHTML=tile.emoji+'<div class="mj-tile-suit">'+tile.suitName.charAt(0)+'</div>';
    div.onclick=(function(idx){return function(){mjSelectTile(idx);};})(i);
    el.appendChild(div);
  });
}

function mjRenderDiscard() {
  var el=document.getElementById('mj-discard');
  el.innerHTML='';
  mj_discard.forEach(function(tile){
    var div=document.createElement('div');
    div.className='mj-disc-tile';
    div.textContent=tile.emoji;
    el.appendChild(div);
  });
}

function mjSelectTile(idx) {
  if(mj_phase!=='draw') return; // Can only select after drawing
  if(mj_selected===idx) mj_selected=null;
  else mj_selected=idx;
  mjRenderHand();
  document.getElementById('mj-discard-btn').disabled=(mj_selected===null);
  document.getElementById('mj-discard-btn').classList.toggle('ready', mj_selected!==null);
  // Check if declaring is possible
  var canDeclare=mjCheckWin(mj_hand);
  document.getElementById('mj-declare-btn').disabled=!canDeclare;
  document.getElementById('mj-declare-btn').classList.toggle('ready', canDeclare);
  if(canDeclare){
    var handInfo=mjAnalyzeHand(mj_hand);
    document.getElementById('mj-hand-name').textContent=handInfo.name;
    document.getElementById('mj-msg').textContent='🏆 У вас выигрышная рука! Объявите Маджонг!';
    document.getElementById('mj-msg').className='mj-msg win';
  }
}

function mjDraw() {
  if(mj_phase!=='playing') return;
  if(mj_deck.length===0){ mjForceDraw(); return; }
  var tile=mj_deck.pop();
  mj_hand.push(tile);
  mj_draws++;
  mj_phase='draw';
  mj_selected=null;

  mjRenderHand();
  document.getElementById('mj-draw-btn').disabled=true;
  document.getElementById('mj-discard-btn').disabled=false;
  document.getElementById('mj-discard-btn').classList.add('ready');
  haptic('light');

  // Auto-check for win after draw
  var canWin=mjCheckWin(mj_hand);
  document.getElementById('mj-declare-btn').disabled=!canWin;
  document.getElementById('mj-declare-btn').classList.toggle('ready',canWin);

  if(canWin){
    var info=mjAnalyzeHand(mj_hand);
    document.getElementById('mj-hand-name').textContent=info.name;
    document.getElementById('mj-msg').textContent='🎉 Вытянули выигрышный тайл! Объявите Маджонг!';
    document.getElementById('mj-msg').className='mj-msg win';
  } else {
    document.getElementById('mj-msg').textContent='Вытянули: '+tile.emoji+' ('+tile.suitName+'). Выберите тайл для сброса.';
    document.getElementById('mj-msg').className='mj-msg info';
  }
}

function mjDiscardSelected() {
  if(mj_phase!=='draw' || mj_selected===null) return;
  var tile=mj_hand.splice(mj_selected,1)[0];
  mj_discard.push(tile);
  mj_selected=null;
  mj_phase='playing';
  mj_hand.sort(mjSortTile);

  mjRenderHand();
  mjRenderDiscard();
  mjUpdateActions();
  document.getElementById('mj-discard-btn').disabled=true;
  document.getElementById('mj-discard-btn').classList.remove('ready');
  document.getElementById('mj-declare-btn').disabled=true;
  document.getElementById('mj-declare-btn').classList.remove('ready');
  haptic('light');

  // Check if deck running low
  if(mj_deck.length<5){
    document.getElementById('mj-msg').textContent='⚠️ В колоде осталось мало тайлов!';
    document.getElementById('mj-msg').className='mj-msg info';
  } else {
    document.getElementById('mj-msg').textContent='Сброшен: '+tile.emoji+'. Тяните следующий тайл.';
    document.getElementById('mj-msg').className='mj-msg';
  }

  if(mj_deck.length===0) mjForceDraw();
}

function mjForceDraw() {
  // Game over - no more tiles
  mj_phase='done';
  document.getElementById('mj-msg').textContent='🔚 Колода закончилась. Ничья!';
  document.getElementById('mj-msg').className='mj-msg';
  document.getElementById('mj-draw-btn').disabled=true;
  document.getElementById('mj-discard-btn').disabled=true;
}

function mjUpdateActions() {
  document.getElementById('mj-draw-btn').disabled=(mj_phase!=='playing'||mj_deck.length===0);
}

function mjDeclare() {
  if(!mjCheckWin(mj_hand)){ showToast('⚠️ Рука не выигрышная!'); return; }
  mj_phase='done';

  var info=mjAnalyzeHand(mj_hand);
  var payout=mj_bet*info.mult;
  balance+=payout; saveBalance(); updateBalanceUI('win-flash');

  // Highlight winning tiles
  mjHighlightWin(info.groups);

  document.getElementById('mj-hand-name').textContent=info.name+' ×'+info.mult;
  document.getElementById('mj-msg').textContent='🏆 МАДЖОНГ! '+info.name+' — Выигрыш $'+payout.toFixed(2)+'!';
  document.getElementById('mj-msg').className='mj-msg win';
  document.getElementById('mj-draw-btn').disabled=true;
  document.getElementById('mj-discard-btn').disabled=true;
  document.getElementById('mj-declare-btn').disabled=true;
  document.getElementById('mj-declare-btn').classList.remove('ready');

  if(payout>=mj_bet*8) spawnConfetti();
  hapticNotify('success');
  if(balance<=0){balance=0;saveBalance();updateBalanceUI();setTimeout(function(){showToast('💸 Баланс исчерпан!');},400);}
}

// ── Win detection ──
// A valid mahjong hand (14 tiles): 4 melds + 1 pair
function mjCheckWin(hand) {
  if(hand.length!==14) return false;
  return mjTryMelds(hand.slice().sort(mjSortTile));
}

function mjTryMelds(tiles) {
  if(tiles.length===0) return false;
  if(tiles.length===2) return tiles[0].id===tiles[1].id;
  if(tiles.length%3===2) {
    // Try each pair as the pair
    for(var p=0;p<tiles.length-1;p++){
      if(tiles[p].id===tiles[p+1].id){
        var rest=tiles.slice(); rest.splice(p,2);
        if(mjCanFormMelds(rest)) return true;
      }
    }
    return false;
  }
  return mjCanFormMelds(tiles);
}

function mjCanFormMelds(tiles) {
  if(tiles.length===0) return true;
  var t=tiles[0];
  var rest;
  // Try pung (3 of a kind)
  var pungIdx=[0];
  for(var i=1;i<tiles.length;i++){ if(tiles[i].id===t.id && pungIdx.length<3) pungIdx.push(i); }
  if(pungIdx.length===3){
    rest=tiles.filter(function(_,i){ return pungIdx.indexOf(i)<0; });
    if(mjCanFormMelds(rest)) return true;
  }
  // Try chow (sequence of 3, same suit, consecutive values, not honour)
  if(!t.honour && t.suit<3){
    var s2=[]; var s3=[];
    for(var i=1;i<tiles.length;i++){
      if(tiles[i].suit===t.suit){
        if(tiles[i].val===t.val+1 && s2.length===0) s2.push(i);
        else if(tiles[i].val===t.val+2 && s3.length===0) s3.push(i);
      }
    }
    if(s2.length>0 && s3.length>0){
      rest=tiles.filter(function(_,i){ return i!==0 && i!==s2[0] && i!==s3[0]; });
      if(mjCanFormMelds(rest)) return true;
    }
  }
  return false;
}

function mjAnalyzeHand(hand) {
  var sorted=hand.slice().sort(mjSortTile);
  // Check for special hands
  // All Pung (all 3-of-a-kinds)
  var counts={};
  sorted.forEach(function(t){ counts[t.id]=(counts[t.id]||0)+1; });
  var vals=Object.values(counts);
  var isAllPung=vals.every(function(v){return v===3||v===2;}) && vals.filter(function(v){return v===2;}).length===1;

  // All one suit
  var suits=new Set(sorted.filter(function(t){return !t.honour;}).map(function(t){return t.suit;}));
  var hasHonour=sorted.some(function(t){return t.honour;});
  var isCleaned=suits.size===1 && !hasHonour;
  var isSemiClean=suits.size===1;

  var name='Обычная рука'; var mult=2;
  if(isAllPung && isCleaned){ name='Чистые Все Пунги'; mult=12; }
  else if(isCleaned){ name='Чистая рука'; mult=8; }
  else if(isAllPung){ name='Все Пунги'; mult=6; }
  else if(isSemiClean){ name='Полу-чистая'; mult=4; }

  return {name:name, mult:mult, groups:[]};
}

function mjHighlightWin(groups) {
  var tiles=document.querySelectorAll('.mj-tile');
  tiles.forEach(function(t){ t.classList.add('win-tile'); });
}

function mjChangeBet(dir){
  var idx=MJ_BET_STEPS.indexOf(mj_bet);
  mjSetBet(MJ_BET_STEPS[Math.max(0,Math.min(MJ_BET_STEPS.length-1,idx+dir))]);
}
function mjSetBet(v){
  mj_bet=v;
  document.getElementById('mj-bet-val').textContent='$'+v;
  document.getElementById('mj-bet-show').textContent='$'+v;
  document.querySelectorAll('.mj-controls .bet-preset').forEach(function(b){
    b.classList.toggle('active', parseInt(b.textContent.replace('$',''))===v);
  });
}

// ──────────────────────────────────────────────────
// CRASH
// ──────────────────────────────────────────────────
var crash_bet=5, crash_bets=[1,2,5,10,25,50,100];
var crash_state='idle', crash_mult=1.0, crash_target=1.0;
var crash_interval=null;

function openCrash(){
  showScreen('crash');
  updateBalanceUI();
  crashReset();
  haptic('light');
}

function crashReset(){
  crash_state='idle'; crash_mult=1.0;
  clearInterval(crash_interval);
  var btn=document.getElementById('crash-action-btn');
  btn.textContent='🚀 СТАВИТЬ'; btn.className='crash-action-btn';
  document.getElementById('crash-mult-display').textContent='1.00×';
  document.getElementById('crash-mult-display').className='crash-multiplier-display';
  document.getElementById('crash-status-msg').textContent='Сделайте ставку и нажмите «Ставить»';
  crashDrawIdle();
}

function crashChangeBet(dir){
  if(crash_state!=='idle') return;
  var idx=crash_bets.indexOf(crash_bet);
  idx=Math.max(0,Math.min(crash_bets.length-1,idx+dir));
  crash_bet=crash_bets[idx];
  document.getElementById('crash-bet-val').textContent='$'+crash_bet;
  haptic('light');
}

function crashAction(){
  var btn=document.getElementById('crash-action-btn');
  if(btn.classList.contains('disabled')) return; // заблокировано
  if(crash_state==='idle'){
    if(balance<crash_bet){showToast('Недостаточно средств!');return;}
    balance-=crash_bet; saveBalance(); updateBalanceUI('lose-flash');
    sfxBet();
    crash_state='running'; crash_mult=1.0;
    // Crash point: exponential, slower growth for more reaction time
    crash_target=Math.max(1.01, 1+(-Math.log(Math.random()))*2.5);
    if(crash_target>100) crash_target=100;
    btn.textContent='💰 ЗАБРАТЬ'; btn.className='crash-action-btn cashout-mode';
    document.getElementById('crash-status-msg').textContent='Ракета летит! Нажми «Забрать»!';
    var startTime=Date.now(), points=[], _lastTickMult=1;
    crash_interval=setInterval(function(){
      var el=(Date.now()-startTime)/1000;
      crash_mult=Math.pow(Math.E, el*0.35);
      document.getElementById('crash-mult-display').textContent=crash_mult.toFixed(2)+'×';
      points.push({x:el,y:crash_mult});
      crashDraw(points);
      if(Math.floor(crash_mult*4) > Math.floor(_lastTickMult*4)){ sfxTick(); _lastTickMult=crash_mult; }
      if(crash_mult>=crash_target){
        clearInterval(crash_interval); crash_interval=null;
        crash_state='crashed';
        document.getElementById('crash-mult-display').className='crash-multiplier-display crashed';
        document.getElementById('crash-status-msg').textContent='💥 ВЗРЫВ на '+crash_mult.toFixed(2)+'×! Ставка сгорела.';
        btn.textContent='💥 ВЗРЫВ НА '+crash_mult.toFixed(2)+'×'; btn.className='crash-action-btn disabled';
        crashDrawCrash(points);
        sfxExplosion(); hapticNotify('error');
        setTimeout(function(){
          btn.textContent='🔄 СНОВА'; btn.className='crash-action-btn';
          crash_state='idle';
          crashDrawIdle();
        },2500);
      }
    },100);
    haptic('medium');
  } else if(crash_state==='running'){
    clearInterval(crash_interval); crash_interval=null;
    crash_state='cashed';
    var win=crash_bet*crash_mult;
    balance+=win; saveBalance(); updateBalanceUI('win-flash');
    sfxCashout();
    document.getElementById('crash-status-msg').textContent='💰 Выигрыш: $'+win.toFixed(2)+' (×'+crash_mult.toFixed(2)+')';
    showToast('💰 +$'+win.toFixed(2));
    btn.textContent='✅ ВЫИГРАЛИ ×'+crash_mult.toFixed(2); btn.className='crash-action-btn disabled';
    hapticNotify('success');
    setTimeout(function(){
      btn.textContent='🔄 СНОВА'; btn.className='crash-action-btn';
      crash_state='idle';
      crashDrawIdle();
    },2000);
  }
}

function crashGetCoords(points, W, H){
  var padL=40, padB=30, padR=14, padT=14;
  var maxX=Math.max(points[points.length-1].x, 5);
  var maxY=Math.max(points[points.length-1].y, 2)*1.15;
  return {
    toCanvasX:function(x){ return padL+(x/maxX)*(W-padL-padR); },
    toCanvasY:function(y){ return H-padB-(y/maxY)*(H-padT-padB); },
    maxX:maxX, maxY:maxY, padL:padL, padB:padB
  };
}

function crashDrawBase(ctx, W, H){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0A0A0F'; ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle='rgba(201,168,76,0.07)'; ctx.lineWidth=1;
  for(var gx=0;gx<W;gx+=40){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
  for(var gy=0;gy<H;gy+=40){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}
  // Axes
  ctx.strokeStyle='rgba(201,168,76,0.3)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(40,10); ctx.lineTo(40,H-30); ctx.lineTo(W-10,H-30); ctx.stroke();
}

function crashDraw(points){
  var canvas=document.getElementById('crash-canvas');
  if(!canvas) return;
  var W=canvas.width, H=canvas.height;
  var ctx=canvas.getContext('2d');
  crashDrawBase(ctx,W,H);
  if(!points.length) return;
  var c=crashGetCoords(points,W,H);
  // Y axis labels
  ctx.fillStyle='rgba(201,168,76,0.5)'; ctx.font='10px sans-serif'; ctx.textAlign='right';
  for(var yv=1;yv<=Math.floor(c.maxY);yv++){
    var cy=c.toCanvasY(yv);
    if(cy>10 && cy<H-25){ctx.fillText(yv+'×',38,cy+3);}
  }
  // Curve
  ctx.beginPath();
  points.forEach(function(p,i){
    var px=c.toCanvasX(p.x), py=c.toCanvasY(p.y);
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  });
  ctx.strokeStyle='#F0C060'; ctx.lineWidth=2.5;
  ctx.shadowColor='#F0C060'; ctx.shadowBlur=8;
  ctx.stroke(); ctx.shadowBlur=0;
  // Rocket at curve tip
  var last=points[points.length-1];
  var rx=c.toCanvasX(last.x), ry=c.toCanvasY(last.y);
  var prev=points.length>1?points[points.length-2]:null;
  var angle=prev? -Math.atan2(c.toCanvasY(prev.y)-ry, rx-c.toCanvasX(prev.x)) : Math.PI/4;
  ctx.save();
  ctx.translate(rx,ry);
  ctx.rotate(-angle);
  ctx.font='18px serif'; ctx.textAlign='center';
  ctx.fillText('🚀',0,-4);
  ctx.restore();
}

function crashDrawCrash(points){
  var canvas=document.getElementById('crash-canvas');
  if(!canvas) return;
  var W=canvas.width, H=canvas.height;
  var ctx=canvas.getContext('2d');
  crashDrawBase(ctx,W,H);
  if(!points.length) return;
  var c=crashGetCoords(points,W,H);
  // Red curve
  ctx.beginPath();
  points.forEach(function(p,i){
    var px=c.toCanvasX(p.x), py=c.toCanvasY(p.y);
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  });
  ctx.strokeStyle='#E74C3C'; ctx.lineWidth=2.5;
  ctx.shadowColor='#E74C3C'; ctx.shadowBlur=10;
  ctx.stroke(); ctx.shadowBlur=0;
  // Explosion at tip
  var last=points[points.length-1];
  var rx=c.toCanvasX(last.x), ry=c.toCanvasY(last.y);
  ctx.font='28px serif'; ctx.textAlign='center';
  ctx.fillText('💥',rx,ry+8);
}

function crashDrawIdle(){
  var canvas=document.getElementById('crash-canvas');
  if(!canvas) return;
  var W=canvas.width, H=canvas.height;
  var ctx=canvas.getContext('2d');
  crashDrawBase(ctx,W,H);
  // Rocket sitting at bottom-left origin
  ctx.font='22px serif'; ctx.textAlign='center';
  ctx.fillText('🚀',44,H-34);
  ctx.fillStyle='rgba(201,168,76,0.35)'; ctx.font='11px sans-serif';
  ctx.fillText('Готов к взлёту',W/2,H/2);
}

// ──────────────────────────────────────────────────
// MINES
// ──────────────────────────────────────────────────
var mines_bet=5, mines_bet_steps=[1,2,5,10,25,50,100];
var mines_count=5, mines_active=false;
var mines_board=[], mines_revealed=0, mines_mult=1.0;

function openMines(){
  showScreen('mines');
  updateBalanceUI();
  minesSetupUI();
  haptic('light');
}

function minesSetupUI(){
  mines_active=false; mines_revealed=0; mines_mult=1.0;
  document.getElementById('mines-mult-display').textContent='1.00×';
  document.getElementById('mines-start-btn').classList.remove('hidden');
  document.getElementById('mines-cashout-btn').classList.add('hidden');
  document.getElementById('mines-win-display').classList.add('hidden');
  minesBuildGrid();
}

function minesBuildGrid(){
  var grid=document.getElementById('mines-grid');
  grid.innerHTML='';
  for(var i=0;i<25;i++){
    var cell=document.createElement('div');
    cell.className='mines-cell';
    cell.textContent='❓';
    (function(idx){
      cell.onclick=function(){ minesClick(idx); };
    })(i);
    grid.appendChild(cell);
  }
}

function minesChangeBet(dir){
  if(mines_active) return;
  var idx=mines_bet_steps.indexOf(mines_bet);
  idx=Math.max(0,Math.min(mines_bet_steps.length-1,idx+dir));
  mines_bet=mines_bet_steps[idx];
  document.getElementById('mines-bet-val').textContent='$'+mines_bet;
  haptic('light');
}

function minesChangeMines(dir){
  if(mines_active) return;
  mines_count=Math.max(1,Math.min(24,mines_count+dir));
  document.getElementById('mines-mine-count').textContent=mines_count;
  document.getElementById('mines-count-display').textContent=mines_count;
  haptic('light');
}

function minesStart(){
  if(balance<mines_bet){showToast('Недостаточно средств!');return;}
  sfxBet(); saveBalance(); updateBalanceUI('lose-flash');
  mines_board=[];
  for(var i=0;i<25;i++) mines_board.push('safe');
  var placed=0;
  while(placed<mines_count){
    var pos=Math.floor(Math.random()*25);
    if(mines_board[pos]==='safe'){mines_board[pos]='mine';placed++;}
  }
  mines_active=true; mines_revealed=0; mines_mult=1.0;
  document.getElementById('mines-start-btn').classList.add('hidden');
  document.getElementById('mines-cashout-btn').classList.remove('hidden');
  minesBuildGrid();
  haptic('medium');
}

function minesCalcMult(){
  var safe=25-mines_count, mult=1.0;
  for(var i=0;i<mines_revealed;i++){
    mult*=(25-mines_count-i)/(25-i);
  }
  return Math.max(1.0,(1/mult)*0.97);
}

function minesClick(idx){
  if(!mines_active) return;
  var cells=document.querySelectorAll('.mines-cell');
  var cell=cells[idx];
  if(cell.classList.contains('revealed')) return;
  cell.classList.add('revealed');
  if(mines_board[idx]==='mine'){
    cell.textContent='💣'; cell.classList.add('mine');
    sfxMineHit();
    mines_active=false;
    for(var i=0;i<25;i++){
      if(mines_board[i]==='mine'){cells[i].textContent='💣';cells[i].classList.add('mine','revealed');}
    }
    document.getElementById('mines-start-btn').classList.remove('hidden');
    document.getElementById('mines-cashout-btn').classList.add('hidden');
    document.getElementById('mines-mult-display').textContent='💥 ВЗРЫВ!';
    showToast('💣 Ставка сгорела!'); hapticNotify('error');
  } else {
    cell.textContent='💎'; cell.classList.add('safe');
    sfxReveal();
    mines_mult=minesCalcMult();
    document.getElementById('mines-mult-display').textContent=mines_mult.toFixed(2)+'×';
    var win=mines_bet*mines_mult;
    document.getElementById('mines-win-display').textContent='Выигрыш: $'+win.toFixed(2);
    document.getElementById('mines-win-display').classList.remove('hidden');
    haptic('light');
    if(mines_revealed>=25-mines_count) minesCashout();
  }
}

function minesCashout(){
  if(!mines_active||mines_revealed===0) return;
  var win=mines_bet*mines_mult;
  balance+=win; saveBalance(); updateBalanceUI('win-flash');
  sfxCashout();
  showToast('💰 +$'+win.toFixed(2));
  mines_active=false;
  document.getElementById('mines-start-btn').classList.remove('hidden');
  document.getElementById('mines-cashout-btn').classList.add('hidden');
  hapticNotify('success');
}

function minesExit(){ mines_active=false; showScreen('main'); }

// ──────────────────────────────────────────────────
// PLINKO
// ──────────────────────────────────────────────────
var plinko_bet=5, plinko_bet_steps=[1,2,5,10,25,50,100];
var plinko_balls=1, plinko_max_balls=5;
var PLINKO_ROWS=10;
// 11 buckets for 10 rows (pascal triangle pattern)
var PLINKO_MULTS=[8.5, 3.0, 1.4, 0.7, 0.4, 0.2, 0.4, 0.7, 1.4, 3.0, 8.5];
var PLINKO_COLORS=['#C0392B','#E74C3C','#E67E22','#F39C12','#F1C40F','#27AE60','#F1C40F','#F39C12','#E67E22','#E74C3C','#C0392B'];
var plinko_running=false, plinko_active_balls=0;

// Canvas dimensions
var PW=340, PH=300;
var P_PAD_TOP=36, P_PAD_SIDE=18, P_PAD_BOT=4;
// Peg grid: rows 0..PLINKO_ROWS-1, row r has (r+2) pegs
// Peg positions computed dynamically

function pegX(row, col){
  // row has (row+2) pegs, centered
  var totalPegs=row+2;
  var usableW=PW-P_PAD_SIDE*2;
  var spacing=usableW/(totalPegs-1);
  return P_PAD_SIDE+col*spacing;
}
function pegY(row){
  var usableH=PH-P_PAD_TOP-P_PAD_BOT-20;
  return P_PAD_TOP+row*(usableH/(PLINKO_ROWS-1));
}
function bucketX(idx){
  // idx 0..PLINKO_MULTS.length-1
  var n=PLINKO_MULTS.length;
  var usableW=PW-P_PAD_SIDE*2;
  return P_PAD_SIDE+idx*(usableW/(n-1));
}

function openPlinko(){
  showScreen('plinko');
  updateBalanceUI();
  plinkoDrawMults();
  plinkoRenderBoard([]);
  haptic('light');
}

function plinkoChangeBet(dir){
  var idx=plinko_bet_steps.indexOf(plinko_bet);
  idx=Math.max(0,Math.min(plinko_bet_steps.length-1,idx+dir));
  plinko_bet=plinko_bet_steps[idx];
  document.getElementById('plinko-bet-val').textContent='$'+plinko_bet;
  plinkoUpdateTotal();
  haptic('light');
}

function plinkoChangeBalls(dir){
  plinko_balls=Math.max(1,Math.min(plinko_max_balls,plinko_balls+dir));
  document.getElementById('plinko-balls-val').textContent=plinko_balls;
  plinkoUpdateTotal();
  haptic('light');
}

function plinkoUpdateTotal(){
  var total=plinko_bet*plinko_balls;
  document.getElementById('plinko-total-bet').textContent='$'+total;
}

function plinkoDrawMults(){
  var container=document.getElementById('plinko-multipliers');
  container.innerHTML='';
  PLINKO_MULTS.forEach(function(m,i){
    var b=document.createElement('div');
    b.className='plinko-mult-bucket';
    b.id='plinko-bucket-'+i;
    b.style.background=PLINKO_COLORS[i];
    b.textContent=m+'×';
    container.appendChild(b);
  });
}

// balls array: [{x,y,col,row,done}]
function plinkoRenderBoard(balls){
  var canvas=document.getElementById('plinko-canvas');
  if(!canvas) return;
  var ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,PW,PH);
  ctx.fillStyle='#0A0A0F'; ctx.fillRect(0,0,PW,PH);

  // Dropper at top center
  var dropX=PW/2, dropY=P_PAD_TOP-10;
  ctx.strokeStyle='rgba(201,168,76,0.5)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(dropX-8,dropY-8); ctx.lineTo(dropX,dropY); ctx.lineTo(dropX+8,dropY-8); ctx.stroke();
  ctx.strokeStyle='rgba(201,168,76,0.3)';
  ctx.beginPath(); ctx.moveTo(dropX,dropY); ctx.lineTo(dropX,dropY-18); ctx.stroke();
  ctx.fillStyle='rgba(201,168,76,0.8)';
  ctx.beginPath(); ctx.arc(dropX,dropY-18,5,0,Math.PI*2); ctx.fill();

  // Pegs
  for(var r=0;r<PLINKO_ROWS;r++){
    var totalPegs=r+2;
    for(var c=0;c<totalPegs;c++){
      var px=pegX(r,c), py=pegY(r);
      var grad=ctx.createRadialGradient(px-1,py-1,1,px,py,5);
      grad.addColorStop(0,'#F0C060'); grad.addColorStop(1,'#7A5C10');
      ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2);
      ctx.fillStyle=grad; ctx.fill();
    }
  }

  // Balls
  balls.forEach(function(ball){
    if(ball.y===undefined) return;
    var bg=ctx.createRadialGradient(ball.x-2,ball.y-2,1,ball.x,ball.y,8);
    bg.addColorStop(0,'#74B9FF'); bg.addColorStop(1,'#0652DD');
    ctx.beginPath(); ctx.arc(ball.x,ball.y,8,0,Math.PI*2);
    ctx.fillStyle=bg;
    ctx.shadowColor='#3498DB'; ctx.shadowBlur=12;
    ctx.fill(); ctx.shadowBlur=0;
  });
}

function plinkoLaunch(){
  if(plinko_running) return;
  var total=plinko_bet*plinko_balls;
  if(balance<total){showToast('Недостаточно средств!');return;}
  balance-=total; saveBalance(); updateBalanceUI('lose-flash');
  plinko_running=true;
  plinko_active_balls=plinko_balls;

  var allBalls=[];
  // Launch balls one by one with small delay
  for(var b=0;b<plinko_balls;b++){
    (function(bi){
      setTimeout(function(){ plinkoBallDrop(allBalls); }, bi*300);
    })(b);
  }

  // Polling render loop
  var renderLoop=setInterval(function(){
    plinkoRenderBoard(allBalls);
    if(plinko_active_balls<=0){
      clearInterval(renderLoop);
      plinko_running=false;
    }
  },30);
}

function plinkoBallDrop(allBalls){
  // Compute random path
  var col=0; // starts at center-ish: for row r, center col = r/2
  var path=[];
  for(var r=0;r<PLINKO_ROWS;r++){
    var goRight=(Math.random()<0.5)?1:0;
    path.push({row:r, col:col});
    col+=goRight;
  }
  var bucketIdx=col; // 0..PLINKO_ROWS = 0..10

  var ball={x:PW/2, y:P_PAD_TOP-18, stepIdx:0, done:false};
  allBalls.push(ball);

  var si=0, subSteps=12, subIdx=0;

  function tick(){
    if(si>=path.length){
      // Land in bucket
      ball.done=true;
      plinko_active_balls--;
      var mult=PLINKO_MULTS[bucketIdx];
      var win=plinko_bet*mult;
      balance+=win; saveBalance(); updateBalanceUI(win>=plinko_bet?'win-flash':'lose-flash');
      sfxPlinkoLand(mult);
      var bkt=document.getElementById('plinko-bucket-'+bucketIdx);
      if(bkt){bkt.classList.add('hit');setTimeout(function(){bkt.classList.remove('hit');},500);}
      if(win>=plinko_bet) showToast('🎉 '+mult+'× +$'+win.toFixed(2));
      else showToast('😞 '+mult+'× $'+win.toFixed(2));
      hapticNotify(win>=plinko_bet?'success':'error');
      // Remove ball from visual after short delay
      setTimeout(function(){
        var idx=allBalls.indexOf(ball);
        if(idx>=0) allBalls.splice(idx,1);
      },400);
      return;
    }
    var p=path[si];
    var x1=ball.x, y1=ball.y;
    var nextRow=p.row+1;
    var nextCol=(si+1<path.length)?path[si+1].col:bucketIdx;
    var x2, y2;
    if(nextRow<PLINKO_ROWS){ x2=pegX(nextRow,nextCol); y2=pegY(nextRow); }
    else { x2=bucketX(bucketIdx); y2=PH-P_PAD_BOT-4; }
    // Arc: slight wobble as ball hits peg
    var midX=(x1+x2)/2+(Math.random()-0.5)*6;
    var midY=(y1+y2)/2-6;

    var sub=0;
    function subTick(){
      if(sub>subSteps){ si++; tick(); return; }
      var t=sub/subSteps;
      // Bezier interpolation
      ball.x=(1-t)*(1-t)*x1+2*(1-t)*t*midX+t*t*x2;
      ball.y=(1-t)*(1-t)*y1+2*(1-t)*t*midY+t*t*y2;
      if(sub===subSteps) sfxPlinkoTick(); // peg hit sound at each row
      sub++;
      setTimeout(subTick,28);
    }
    subTick();
  }
  // Start at dropper position, then move to first peg
  ball.x=PW/2; ball.y=P_PAD_TOP-18;
  var firstPegX=pegX(0, path[0].col), firstPegY=pegY(0);
  var dropSub=0, dropSteps=8;
  function dropTick(){
    if(dropSub>dropSteps){si=0;tick();return;}
    var t=dropSub/dropSteps;
    ball.x=PW/2+(firstPegX-PW/2)*t;
    ball.y=(P_PAD_TOP-18)+(firstPegY-(P_PAD_TOP-18))*t;
    dropSub++;
    setTimeout(dropTick,25);
  }
  dropTick();
}

// ──────────────────────────────────────────────────
// PENALTY
// ──────────────────────────────────────────────────
var penalty_bet=5, penalty_bet_steps=[1,2,5,10,25,50,100];
var penalty_active=false, penalty_streak=0, penalty_mult=1.0, penalty_shooting=false;
var PENALTY_MULTS=[1.0,1.35,1.8,2.4,3.3,4.6,6.5,9.2,13,20];

function openPenalty(){
  showScreen('penalty');
  updateBalanceUI();
  penaltyReset();
  haptic('light');
}

function penaltyReset(){
  penalty_active=false; penalty_streak=0; penalty_mult=1.0; penalty_shooting=false;
  document.getElementById('penalty-streak').textContent='0';
  document.getElementById('penalty-mult').textContent='1.00×';
  document.getElementById('penalty-win').textContent='$0';
  document.getElementById('penalty-msg').textContent='Сделайте ставку и начните серию';
  document.getElementById('penalty-start-btn').classList.remove('hidden');
  document.getElementById('penalty-cashout-btn').classList.add('hidden');
  penaltySetAimEnabled(false);
  penaltyResetKeeper();
}

function penaltySetAimEnabled(on){
  var btns=document.querySelectorAll('.penalty-aim-btn');
  btns.forEach(function(b){b.disabled=!on;});
}

function penaltyResetKeeper(){
  var keeper=document.getElementById('penalty-keeper');
  keeper.style.left='50%'; keeper.style.transform='translateX(-50%)';
  var ball=document.getElementById('penalty-ball-anim');
  ball.style.transition='none';
  ball.style.left='50%'; ball.style.bottom='28px';
  ball.style.transform='translateX(-50%) scale(0)';
}

function penaltyChangeBet(dir){
  if(penalty_active) return;
  var idx=penalty_bet_steps.indexOf(penalty_bet);
  idx=Math.max(0,Math.min(penalty_bet_steps.length-1,idx+dir));
  penalty_bet=penalty_bet_steps[idx];
  document.getElementById('penalty-bet-val').textContent='$'+penalty_bet;
  haptic('light');
}

function penaltyStart(){
  if(balance<penalty_bet){showToast('Недостаточно средств!');return;}
  balance-=penalty_bet; saveBalance(); updateBalanceUI('lose-flash');
  sfxBet();
  penalty_active=true; penalty_streak=0; penalty_mult=1.0; penalty_shooting=false;
  document.getElementById('penalty-start-btn').classList.add('hidden');
  document.getElementById('penalty-msg').textContent='Выберите направление удара!';
  penaltySetAimEnabled(true);
  haptic('medium');
}

function penaltyShoot(direction){
  if(!penalty_active||penalty_shooting) return;
  penalty_shooting=true;
  penaltySetAimEnabled(false);
  var keeperZone=Math.floor(Math.random()*5);
  var keeperPos=['10%','28%','50%','72%','88%'];
  var ballTargetX=['18%','33%','50%','67%','82%'];
  var ballTargetY=['12px','6px','4px','6px','12px'];
  var keeper=document.getElementById('penalty-keeper');
  var ball=document.getElementById('penalty-ball-anim');
  ball.style.transition='all 0.45s cubic-bezier(0.25,0.46,0.45,0.94)';
  ball.style.left=ballTargetX[direction];
  ball.style.bottom=ballTargetY[direction];
  ball.style.transform='translateX(-50%) scale(2)';
  keeper.style.left=keeperPos[keeperZone];
  keeper.style.transform='translateX(-50%)';
  var scored=(direction!==keeperZone);
  setTimeout(function(){
    if(scored){
      sfxGoal();
      penalty_streak++;
      penalty_mult=PENALTY_MULTS[Math.min(penalty_streak,PENALTY_MULTS.length-1)];
      document.getElementById('penalty-streak').textContent=penalty_streak;
      document.getElementById('penalty-mult').textContent=penalty_mult.toFixed(2)+'×';
      document.getElementById('penalty-win').textContent='$'+(penalty_bet*penalty_mult).toFixed(2);
      document.getElementById('penalty-msg').textContent='⚽ ГОЛ! Продолжай или забирай!';
      document.getElementById('penalty-cashout-btn').classList.remove('hidden');
      hapticNotify('success');
      setTimeout(function(){
        penaltyResetKeeper();
        penalty_shooting=false;
        penaltySetAimEnabled(true);
      },700);
    } else {
      sfxSave();
      document.getElementById('penalty-msg').textContent='🧤 Вратарь поймал! Серия окончена.';
      hapticNotify('error');
      penalty_active=false;
      document.getElementById('penalty-cashout-btn').classList.add('hidden');
      setTimeout(function(){
        penaltyReset();
      },2000);
    }
  },550);
  haptic('medium');
}

function penaltyCashout(){
  if(!penalty_active||penalty_streak===0||penalty_shooting) return;
  var win=penalty_bet*penalty_mult;
  balance+=win; saveBalance(); updateBalanceUI('win-flash');
  sfxCashout();
  showToast('💰 +$'+win.toFixed(2)+' (×'+penalty_mult.toFixed(2)+')');
  hapticNotify('success');
  penalty_active=false;
  setTimeout(penaltyReset,400);
}

function penaltyExit(){ penalty_active=false; penalty_shooting=false; showScreen('main'); }

// ═══════════════════════════════════════════════════════════════
//  ВАЛЮТЫ
// ═══════════════════════════════════════════════════════════════

var CURRENCIES = {
  USD: { symbol: '$',  name: 'Доллар',  rate: 1       },
  EUR: { symbol: '€',  name: 'Евро',    rate: 0.92    },
  RUB: { symbol: '₽',  name: 'Рубль',   rate: 92      },
  GBP: { symbol: '£',  name: 'Фунт',    rate: 0.79    },
  JPY: { symbol: '¥',  name: 'Иена',    rate: 149     },
  BTC: { symbol: '₿',  name: 'Биткоин', rate: 0.000023 }
};

var currentCurrency = 'USD';
try {
  var _savedCur = localStorage.getItem('puerbet_currency');
  if (_savedCur && CURRENCIES[_savedCur]) currentCurrency = _savedCur;
} catch(e) {}

function fmtMoney(usdAmount) {
  var cur = CURRENCIES[currentCurrency] || CURRENCIES.USD;
  var v = usdAmount * cur.rate;
  if (currentCurrency === 'BTC') return cur.symbol + v.toFixed(6);
  if (currentCurrency === 'JPY') return cur.symbol + Math.round(v).toLocaleString();
  return cur.symbol + v.toFixed(2);
}

function selectCurrency(code) {
  if (!CURRENCIES[code]) return;
  currentCurrency = code;
  try { localStorage.setItem('puerbet_currency', code); } catch(e) {}
  updateBalanceUI();
  renderProfileScreen();
  sfxClick();
  showToast('Валюта: ' + CURRENCIES[code].name + ' ' + CURRENCIES[code].symbol);
}


// ═══════════════════════════════════════════════════════════════
//  ПРОФИЛЬ ИГРОКА
// ═══════════════════════════════════════════════════════════════

var AVATARS = ['🎰','🃏','🎲','🎯','💎','🚀','💰','🏆','⚡','🌟',
               '🦁','🐉','👑','🎭','🎪','🍀','🔮','🦊','🐺','🤖'];

var profile = {
  name:         'Игрок',
  avatar:       '🎰',
  gamesPlayed:  0,
  totalWagered: 0,
  totalWon:     0,
  biggestWin:   0
};

(function loadProfile() {
  try {
    var s = localStorage.getItem('puerbet_profile');
    if (s) Object.assign(profile, JSON.parse(s));
  } catch(e) {}
})();

function saveProfile() {
  try { localStorage.setItem('puerbet_profile', JSON.stringify(profile)); } catch(e) {}
}

function trackWager(amount) {
  profile.gamesPlayed++;
  profile.totalWagered += amount;
  saveProfile();
}

function trackWin(amount) {
  profile.totalWon += amount;
  if (amount > profile.biggestWin) profile.biggestWin = amount;
  saveProfile();
}

function getVIP() {
  var w = profile.totalWagered;
  if (w < 500)   return { name: 'Bronze',  cls: 'vip-bronze',  emoji: '🥉', prev: 0,    next: 500   };
  if (w < 2000)  return { name: 'Silver',  cls: 'vip-silver',  emoji: '🥈', prev: 500,  next: 2000  };
  if (w < 10000) return { name: 'Gold',    cls: 'vip-gold',    emoji: '🥇', prev: 2000, next: 10000 };
  return             { name: 'Diamond', cls: 'vip-diamond', emoji: '💎', prev: 10000, next: null  };
}

function openProfile() {
  showScreen('profile');
  renderProfileScreen();
  updateBalanceUI();
  haptic('light');
}

function renderProfileScreen() {
  var vip = getVIP();

  // Avatar & name
  document.getElementById('p-avatar').textContent = profile.avatar;
  document.getElementById('p-name').value = profile.name;

  // VIP badge
  var badge = document.getElementById('p-badge');
  badge.textContent = vip.emoji + ' ' + vip.name;
  badge.className = 'vip-badge ' + vip.cls;

  // XP bar
  var pct = vip.next
    ? Math.min(100, ((profile.totalWagered - vip.prev) / (vip.next - vip.prev)) * 100)
    : 100;
  document.getElementById('p-xp-fill').style.width = pct + '%';
  document.getElementById('p-xp-from').textContent = vip.name;
  document.getElementById('p-xp-to').textContent   = vip.next
    ? fmtMoney(vip.next) : 'MAX';

  // Stats
  document.getElementById('p-stat-games').textContent   = profile.gamesPlayed;
  document.getElementById('p-stat-wagered').textContent = fmtMoney(profile.totalWagered);
  document.getElementById('p-stat-won').textContent     = fmtMoney(profile.totalWon);
  document.getElementById('p-stat-best').textContent    = fmtMoney(profile.biggestWin);

  // Currency buttons
  document.querySelectorAll('.cur-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.cur === currentCurrency);
  });
}

function profileSaveName() {
  var v = document.getElementById('p-name').value.trim();
  profile.name = v || 'Игрок';
  saveProfile();
  updateMainAvatar();
}

function updateMainAvatar() {
  var el = document.getElementById('main-avatar');
  if (el) el.textContent = profile.avatar;
}

// Avatar picker
function openAvatarPicker() {
  var overlay = document.getElementById('av-overlay');
  var grid    = document.getElementById('av-grid');
  grid.innerHTML = '';
  AVATARS.forEach(function(av) {
    var d = document.createElement('div');
    d.className = 'av-item' + (av === profile.avatar ? ' sel' : '');
    d.textContent = av;
    d.onclick = function() {
      profile.avatar = av;
      saveProfile();
      document.getElementById('p-avatar').textContent = av;
      updateMainAvatar();
      overlay.classList.add('hidden');
      sfxClick();
    };
    grid.appendChild(d);
  });
  overlay.classList.remove('hidden');
}


// ═══════════════════════════════════════════════════════════════
//  ЕЖЕДНЕВНОЕ КОЛЕСО ФОРТУНЫ
// ═══════════════════════════════════════════════════════════════

var WHEEL_PRIZES = [
  { label: '$1',   value: 1,   color: '#16A085' },
  { label: '$5',   value: 5,   color: '#27AE60' },
  { label: '$50',  value: 50,  color: '#8E44AD' },
  { label: '$2',   value: 2,   color: '#2980B9' },
  { label: '$10',  value: 10,  color: '#E67E22' },
  { label: '$500', value: 500, color: '#C0392B' },
  { label: '$3',   value: 3,   color: '#1ABC9C' },
  { label: '$25',  value: 25,  color: '#2C3E50' },
  { label: '$5',   value: 5,   color: '#D35400' },
  { label: '$100', value: 100, color: '#7D3C98' },
  { label: '$2',   value: 2,   color: '#117A65' },
  { label: '$15',  value: 15,  color: '#1F618D' }
];
// Weights: big prizes rare
var WHEEL_W = [22, 18, 3, 20, 12, 0.3, 18, 6, 18, 1.5, 20, 10];

var wheelAngle   = 0;
var wheelSpinning = false;
var wheelLastSpin = 0;
var wheelHistory  = [];
var WHEEL_CD = 24 * 3600 * 1000; // 24h

(function loadWheelData() {
  try {
    var d = JSON.parse(localStorage.getItem('puerbet_wheel') || '{}');
    wheelLastSpin = d.last    || 0;
    wheelHistory  = d.history || [];
    wheelAngle    = d.angle   || 0;
  } catch(e) {}
})();

function saveWheelData() {
  try {
    localStorage.setItem('puerbet_wheel', JSON.stringify({
      last: wheelLastSpin, history: wheelHistory.slice(-12), angle: wheelAngle
    }));
  } catch(e) {}
}

function openDailyWheel() {
  showScreen('wheel');
  updateBalanceUI();
  drawWheel(wheelAngle);
  refreshWheelUI();
  haptic('light');
}

function refreshWheelUI() {
  var now = Date.now();
  var canSpin = !wheelSpinning && (now - wheelLastSpin) >= WHEEL_CD;
  var btn = document.getElementById('wheel-spin-btn');
  btn.disabled = !canSpin;

  if (!canSpin && !wheelSpinning) {
    var rem = WHEEL_CD - (now - wheelLastSpin);
    var h = Math.floor(rem / 3600000);
    var m = Math.floor((rem % 3600000) / 60000);
    document.getElementById('wheel-countdown').textContent =
      '⏳ Следующий спин через ' + h + ' ч ' + m + ' мин';
  } else if (canSpin) {
    document.getElementById('wheel-countdown').textContent = '🎁 Бесплатный спин доступен!';
  }

  var chips = document.getElementById('wheel-chips');
  chips.innerHTML = wheelHistory.slice().reverse().map(function(p) {
    return '<span class="wheel-chip">' + p + '</span>';
  }).join('');
}

function wheelPickIdx() {
  var total = WHEEL_W.reduce(function(a,b){return a+b;}, 0);
  var r = Math.random() * total;
  for (var i = 0; i < WHEEL_W.length; i++) {
    r -= WHEEL_W[i];
    if (r <= 0) return i;
  }
  return WHEEL_W.length - 1;
}

function spinWheel() {
  if (wheelSpinning) return;
  var now = Date.now();
  if ((now - wheelLastSpin) < WHEEL_CD) { showToast('Уже крутили сегодня!'); return; }

  wheelSpinning = true;
  document.getElementById('wheel-spin-btn').disabled = true;
  document.getElementById('wheel-result').textContent = '';

  var prizeIdx = wheelPickIdx();
  var prize = WHEEL_PRIZES[prizeIdx];
  var sliceAngle = (Math.PI * 2) / WHEEL_PRIZES.length;

  // Target: prize slice lands under pointer (top = -PI/2)
  var targetBase = -Math.PI/2 - (prizeIdx + 0.5) * sliceAngle;
  var spins = 6 + Math.random() * 4;
  var targetAngle = targetBase + spins * Math.PI * 2;

  var startAngle = wheelAngle;
  var startTime  = null;
  var dur        = 5000;

  sfxRoulette();

  function anim(ts) {
    if (!startTime) startTime = ts;
    var prog = Math.min(1, (ts - startTime) / dur);
    var ease = 1 - Math.pow(1 - prog, 5);  // ease-out quint
    wheelAngle = startAngle + (targetAngle - startAngle) * ease;
    drawWheel(wheelAngle);
    if (prog < 1) { requestAnimationFrame(anim); return; }

    // Done
    wheelAngle    = ((wheelAngle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
    wheelSpinning = false;
    wheelLastSpin = Date.now();
    wheelHistory.push(fmtMoney(prize.value));
    saveWheelData();

    balance += prize.value;
    saveBalance();
    updateBalanceUI('win-flash');
    trackWin(prize.value);

    document.getElementById('wheel-result').textContent = '🎉 Вы выиграли ' + fmtMoney(prize.value) + '!';
    showToast('🎡 +' + fmtMoney(prize.value) + ' от колеса!');
    spawnConfetti();
    sfxWin(prize.value >= 100);
    hapticNotify('success');
    refreshWheelUI();
  }
  requestAnimationFrame(anim);
}

function drawWheel(angle) {
  var canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var cx = W/2, cy = H/2, R = Math.min(cx,cy) - 6;
  var n = WHEEL_PRIZES.length;
  var sliceAngle = (Math.PI*2) / n;

  ctx.clearRect(0, 0, W, H);

  // Drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur  = 20;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
  ctx.fillStyle = '#111'; ctx.fill();
  ctx.restore();

  // Slices
  for (var i = 0; i < n; i++) {
    var a1 = angle + i * sliceAngle;
    var a2 = a1 + sliceAngle;
    var p  = WHEEL_PRIZES[i];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, a1, a2);
    ctx.closePath();
    ctx.fillStyle   = p.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a1 + sliceAngle / 2);
    ctx.textAlign   = 'right';
    ctx.fillStyle   = '#fff';
    ctx.font        = 'bold ' + Math.round(W/20) + 'px Rajdhani, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur  = 4;
    ctx.fillText(p.label, R - 10, 5);
    ctx.restore();
  }

  // Gold dividers
  for (var j = 0; j < n; j++) {
    var da = angle + j * sliceAngle;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(da)*R, cy + Math.sin(da)*R);
    ctx.strokeStyle = 'rgba(201,168,76,0.4)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // Center hub
  var grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, R*0.09);
  grad.addColorStop(0, '#F0C060');
  grad.addColorStop(1, '#8A6820');
  ctx.beginPath(); ctx.arc(cx, cy, R*0.09, 0, Math.PI*2);
  ctx.fillStyle   = grad; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

  // Outer ring
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(201,168,76,0.7)'; ctx.lineWidth = 3; ctx.stroke();
}


// ═══════════════════════════════════════════════════════════════
//  STARTUP INIT
// ═══════════════════════════════════════════════════════════════

// Update avatar on main screen when profile loads
document.addEventListener('DOMContentLoaded', function() {
  updateMainAvatar();
  updateBalanceUI();
});
