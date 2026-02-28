// =============================================
//   PUER FRUITS — Sweet Bonanza Clone
//   6×5 grid, Cluster Pays (8+), Tumble, Bombs
// =============================================

var PF = {
  symbols: [
    { id:'scatter', img:'scattertop.webp',  label:'Scatter',      minCluster:4,  pay:0,    weight:1   },
    { id:'bomb',    e:'💣',                 label:'Бомба',         minCluster:99, pay:0,    weight:0   },
    { id:'puer',    img:'almazkaz.webp',    label:'Алмаз',         minCluster:8,  pay:1.5,  weight:5   },
    { id:'gaba',    img:'kolokokfrut.webp', label:'Колокол',       minCluster:8,  pay:1.2,  weight:7   },
    { id:'dahong',  img:'arbu.webp',        label:'Арбуз',         minCluster:8,  pay:1.0,  weight:9   },
    { id:'gaivan',  img:'banan.webp',       label:'Банан',         minCluster:8,  pay:0.7,  weight:12  },
    { id:'plum',    img:'vinograaa.webp',   label:'Виноград',      minCluster:8,  pay:0.4,  weight:18  },
    { id:'apple',   img:'yanlaka.webp',     label:'Яблоко',        minCluster:8,  pay:0.3,  weight:20  },
    { id:'banana',  img:'slivka.webp',      label:'Слива',         minCluster:8,  pay:0.2,  weight:22  },
  ],

  ROWS: 5,
  COLS: 6,
  FREE_SPINS_START: 10,
  FREE_SPINS_EXTRA: 5,
  SCATTER_TRIGGER: 4,
  SCATTER_GUARANTEE: 100,
  BOMB_MULT_VALUES: [2,3,4,5,6,8,10,12,15,20,25,50,100],
};

function pfRand(syms, weights) {
  var total = 0;
  for (var i = 0; i < weights.length; i++) total += weights[i];
  var r = Math.random() * total;
  for (var i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return syms[i];
  }
  return syms[syms.length - 1];
}

var pfGrid             = [];
var pfBet              = 1;
var pfAnte             = false;
var pfSpinning         = false;
var pfFreeSpins        = 0;
var pfFsWon            = 0;
var pfFsTotal          = 0;
var pfActiveBombs      = [];
var pfTotalWinThisSpin = 0;
var pfCostBuy          = 0;
var pfSpinsSinceLastScatter = 0;

function openPuerFruits() {
  pfBet = 1;
  pfFreeSpins = 0;
  pfFsWon = 0;
  pfFsTotal = 0;
  pfActiveBombs = [];
  pfSpinning = false;
  pfAnte = false;
  pfCostBuy = 0;
  pfSpinsSinceLastScatter = 0;
  pfTotalWinThisSpin = 0;
  pfInitGrid();
  pfRenderAll();
  pfUpdateBetUI();
  pfUpdateBalanceUI();
  pfSetState('idle');
  pfHideSpinTotal();
  document.getElementById('pf-freespins-banner').classList.add('hidden');
  document.getElementById('pf-result-msg').textContent = 'Нажмите SPIN!';
  showScreen('puerfruits');
}

function pfInitGrid() {
  pfGrid = [];
  var syms    = PF.symbols.filter(function(s){ return s.id !== 'bomb' && s.id !== 'scatter'; });
  var weights = syms.map(function(s){ return s.weight; });
  for (var i = 0; i < PF.ROWS * PF.COLS; i++) {
    pfGrid.push(pfRand(syms, weights));
  }
}

function pfGenerateSym(isFreeSpinMode, forceNoScatter) {
  var syms, weights;
  if (isFreeSpinMode) {
    syms    = PF.symbols.filter(function(s){ return s.id !== 'scatter'; });
    weights = syms.map(function(s){ return s.id === 'bomb' ? 8 : s.weight; });
  } else {
    syms    = PF.symbols.filter(function(s){ return s.id !== 'bomb'; });
    if (forceNoScatter) {
      syms = syms.filter(function(s){ return s.id !== 'scatter'; });
    }
    weights = syms.map(function(s){
      if (s.id === 'scatter' && pfAnte) return s.weight * 1.5;
      return s.weight;
    });
  }
  return pfRand(syms, weights);
}

function pfGenerateGrid(isFreeSpinMode) {
  var grid = [];

  if (!isFreeSpinMode) {
    pfSpinsSinceLastScatter++;

    if (pfSpinsSinceLastScatter >= PF.SCATTER_GUARANTEE) {
      for (var i = 0; i < PF.ROWS * PF.COLS; i++) {
        grid.push(pfGenerateSym(false, true));
      }
      var positions = [];
      while (positions.length < PF.SCATTER_TRIGGER) {
        var pos = Math.floor(Math.random() * PF.ROWS * PF.COLS);
        if (positions.indexOf(pos) === -1) positions.push(pos);
      }
      var scatterSym = PF.symbols.find(function(s){ return s.id === 'scatter'; });
      positions.forEach(function(p){ grid[p] = scatterSym; });
      pfSpinsSinceLastScatter = 0;
      return grid;
    }
  }

  for (var j = 0; j < PF.ROWS * PF.COLS; j++) {
    grid.push(pfGenerateSym(isFreeSpinMode, false));
  }
  return grid;
}

// ---- РЕНДЕР ----
function pfRenderAll() {
  var gridEl = document.getElementById('pf-grid');
  if (!gridEl) return;
  gridEl.innerHTML = '';
  for (var i = 0; i < PF.ROWS * PF.COLS; i++) {
    var cell = document.createElement('div');
    cell.className = 'pf-cell';
    cell.id = 'pf-cell-' + i;
    pfRenderCell(cell, pfGrid[i]);
    gridEl.appendChild(cell);
  }
}

function pfRenderCell(cell, sym) {
  cell.innerHTML = '';
  cell.className = 'pf-cell';
  if (!sym) { cell.classList.add('pf-empty'); return; }

  var inner = document.createElement('div');
  inner.className = 'pf-sym pf-sym-' + sym.id;

  if (sym.id === 'bomb') {
    var bomb = pfActiveBombs.find(function(b){ return b.sym === sym; });
    var mult = bomb ? bomb.mult : '?';
    inner.innerHTML = '<span class="pf-bomb-icon">💣</span><span class="pf-bomb-mult">×' + mult + '</span>';
  } else if (sym.img) {
    var img = document.createElement('img');
    img.src = sym.img;
    img.className = 'pf-sym-img';
    img.draggable = false;
    inner.appendChild(img);
  } else {
    inner.textContent = sym.e;
  }
  cell.appendChild(inner);
}

// ---- SPIN ----
function pfSpin() {
  if (pfSpinning) return;
  if (pfFreeSpins > 0) { pfDoFreeSpin(); return; }

  var cost = pfBet * (pfAnte ? 1.25 : 1);
  if (balance < cost) { showToast('Недостаточно средств!'); return; }

  pfSpinning = true;
  balance -= cost;
  saveBalance();
  pfUpdateBalanceUI();
  pfSetState('spinning');
  pfTotalWinThisSpin = 0;
  pfActiveBombs = [];
  pfHideSpinTotal();

  pfAnimateSpin(false, function() {
    pfEvalClusters(false);
  });
}

function pfDoFreeSpin() {
  if (pfFreeSpins <= 0) return;
  pfFreeSpins--;
  pfFsTotal++;
  pfUpdateFsUI();
  pfSpinning = true;
  pfSetState('spinning');
  pfTotalWinThisSpin = 0;
  pfHideSpinTotal();

  pfAnimateSpin(true, function() {
    pfEvalClusters(true);
  });
}

function pfAnimateSpin(isFree, callback) {
  // Шаг 1: скрываем все ячейки (улетают вверх)
  for (var i = 0; i < PF.ROWS * PF.COLS; i++) {
    var cell = document.getElementById('pf-cell-' + i);
    if (cell) {
      cell.classList.remove('pf-fall', 'pf-drop');
      cell.style.animationDelay = '';
      cell.style.transition = 'opacity 0.15s, transform 0.15s';
      cell.style.opacity = '0';
      cell.style.transform = 'translateY(-20px) scale(0.8)';
    }
  }

  // Шаг 2: генерируем новую сетку пока ячейки скрыты
  setTimeout(function() {
    pfGrid = pfGenerateGrid(isFree);

    pfActiveBombs = [];
    pfGrid.forEach(function(sym, idx) {
      if (sym && sym.id === 'bomb') {
        var mult = PF.BOMB_MULT_VALUES[Math.floor(Math.random() * PF.BOMB_MULT_VALUES.length)];
        pfActiveBombs.push({ idx: idx, sym: sym, mult: mult });
      }
    });

    // Шаг 3+4: обновляем контент пока скрыты, и сразу вешаем анимацию
    // НЕ используем pfRenderAll() — он пересоздаёт DOM и сбрасывает стили
    for (var k = 0; k < PF.ROWS * PF.COLS; k++) {
      (function(idx) {
        var c = document.getElementById('pf-cell-' + idx);
        if (!c) return;
        // Обновляем содержимое ячейки (она сейчас скрыта — opacity:0)
        pfRenderCell(c, pfGrid[idx]);
        // Убираем inline скрытие и запускаем анимацию падения
        c.style.transition = '';
        c.style.opacity = '';
        c.style.transform = '';
        var col = idx % PF.COLS;
        var delay = col * 0.04;
        c.style.animationDelay = delay + 's';
        c.classList.add('pf-drop');
      })(k);
    }

    setTimeout(function() {
      for (var j = 0; j < PF.ROWS * PF.COLS; j++) {
        var c = document.getElementById('pf-cell-' + j);
        if (c) { c.classList.remove('pf-drop'); c.style.animationDelay = ''; }
      }
      setTimeout(callback, 100);
    }, 550);

  }, 180);
}

// ---- КЛАСТЕРЫ ----
function pfFindClusters() {
  var clusters = [];
  var symIds = {};
  pfGrid.forEach(function(s) {
    if (s && s.id !== 'scatter' && s.id !== 'bomb') symIds[s.id] = true;
  });

  Object.keys(symIds).forEach(function(sid) {
    var positions = [];
    pfGrid.forEach(function(s, i) { if (s && s.id === sid) positions.push(i); });
    if (positions.length >= 8) {
      clusters.push({ sid: sid, positions: positions, sym: PF.symbols.find(function(s){ return s.id === sid; }) });
    }
  });

  return clusters;
}

function pfCountScatters() {
  return pfGrid.filter(function(s){ return s && s.id === 'scatter'; }).length;
}

function pfEvalClusters(isFree) {
  var clusters = pfFindClusters();
  var scatterCount = pfCountScatters();

  if (!isFree && scatterCount >= PF.SCATTER_TRIGGER) {
    pfSpinsSinceLastScatter = 0;
    pfHighlightScatters();
    var scatterWin = pfBet * pfScatterPay(scatterCount);
    if (scatterWin > 0) {
      balance += scatterWin;
      saveBalance();
      pfUpdateBalanceUI();
      pfTotalWinThisSpin += scatterWin;
      pfShowSpinTotal();
    }
    setTimeout(function() {
      pfTriggerFreeSpins(scatterCount);
    }, 1000);
    return;
  }

  if (isFree && scatterCount >= 3) {
    pfFreeSpins += PF.FREE_SPINS_EXTRA;
    pfUpdateFsUI();
    showToast('🍬 +' + PF.FREE_SPINS_EXTRA + ' дополнительных фриспинов!');
  }

  if (clusters.length === 0) {
    if (pfTotalWinThisSpin > 0) pfShowSpinTotal();
    if (!isFree) {
      pfSetState('idle');
      pfSpinning = false;
      if (pfTotalWinThisSpin === 0) {
        pfSetMsg('Нет выигрыша. Попробуй ещё!', 'lose');
        pfHideSpinTotal();
      }
    } else {
      pfSetState(pfFreeSpins > 0 ? 'freespin' : 'idle');
      pfSpinning = false;
      if (pfFreeSpins > 0) {
        setTimeout(function(){ pfDoFreeSpin(); }, 600);
      } else {
        pfEndFreeSpins();
      }
    }
    return;
  }

  var winAmt = 0;
  clusters.forEach(function(cl) {
    var pay = pfBet * cl.sym.pay * cl.positions.length;
    winAmt += pay;
    cl.positions.forEach(function(idx) {
      var cell = document.getElementById('pf-cell-' + idx);
      if (cell) cell.classList.add('pf-win-cell');
    });
  });

  var totalBombMult = 0;
  pfActiveBombs.forEach(function(b) {
    totalBombMult += b.mult;
    var cell = document.getElementById('pf-cell-' + b.idx);
    if (cell) cell.classList.add('pf-bomb-active');
  });
  if (isFree && totalBombMult > 0) {
    winAmt *= totalBombMult;
    pfShowBombMult(totalBombMult);
  }

  pfTotalWinThisSpin += winAmt;
  if (isFree) pfFsWon += winAmt;
  balance += winAmt;
  saveBalance();
  pfUpdateBalanceUI();
  pfShowSpinTotal();

  var msg = isFree
    ? 'Фриспин! +' + pfFmt(winAmt) + (totalBombMult > 0 ? ' (x' + totalBombMult + ')' : '')
    : '+' + pfFmt(winAmt);
  pfSetMsg(msg, 'win');

  if (winAmt >= pfBet * 20) { spawnConfetti(); sfxWin(true); }
  else sfxWin(false);

  setTimeout(function() {
    pfTumble(clusters, isFree);
  }, 900);
}

// ---- TUMBLE: только новые символы анимируются ----
function pfTumble(clusters, isFree) {
  document.querySelectorAll('.pf-win-cell, .pf-bomb-active').forEach(function(c){
    c.classList.remove('pf-win-cell','pf-bomb-active');
  });

  var toRemove = {};
  clusters.forEach(function(cl){ cl.positions.forEach(function(i){ toRemove[i] = true; }); });
  pfActiveBombs.forEach(function(b){ toRemove[b.idx] = true; });

  // Анимация удаления
  Object.keys(toRemove).forEach(function(idx) {
    var cell = document.getElementById('pf-cell-' + parseInt(idx));
    if (cell) cell.classList.add('pf-remove');
  });

  setTimeout(function() {
    Object.keys(toRemove).forEach(function(idx){ pfGrid[parseInt(idx)] = null; });

    // Гравитация по колонкам
    var newPositions = {};

    for (var col = 0; col < PF.COLS; col++) {
      // Собираем существующие символы снизу вверх (нижний ряд = row ROWS-1)
      var existing = [];
      for (var row = PF.ROWS - 1; row >= 0; row--) {
        var idx = row * PF.COLS + col;
        if (pfGrid[idx] !== null) existing.push({ sym: pfGrid[idx], wasNull: false });
      }

      var missingCount = PF.ROWS - existing.length;
      for (var n = 0; n < missingCount; n++) {
        existing.push({ sym: pfGenerateSym(isFree, false), wasNull: true });
      }

      // existing[0] = нижний, existing[ROWS-1] = верхний
      for (var r = PF.ROWS - 1; r >= 0; r--) {
        var cellIdx = r * PF.COLS + col;
        var slot    = existing[PF.ROWS - 1 - r];
        pfGrid[cellIdx] = slot.sym;
        if (slot.wasNull) newPositions[cellIdx] = true;
      }
    }

    // Пересобираем бомбы
    pfActiveBombs = [];
    pfGrid.forEach(function(sym, idx) {
      if (sym && sym.id === 'bomb') {
        var mult = PF.BOMB_MULT_VALUES[Math.floor(Math.random() * PF.BOMB_MULT_VALUES.length)];
        pfActiveBombs.push({ idx: idx, sym: sym, mult: mult });
      }
    });

    // Рендер: только новые позиции перерисовываем и анимируем
    // Старые символы НЕ трогаем — они уже на месте
    for (var i = 0; i < PF.ROWS * PF.COLS; i++) {
      var cell = document.getElementById('pf-cell-' + i);
      if (!cell) continue;

      if (newPositions[i]) {
        // Новый символ — перерисовываем и анимируем падение
        cell.classList.remove('pf-remove', 'pf-fall', 'pf-drop');
        pfRenderCell(cell, pfGrid[i]);
        // Чем выше строка (меньший rowNum) — тем дольше падает: больше задержка
        var rowNum = Math.floor(i / PF.COLS);
        var delay = (PF.ROWS - 1 - rowNum) * 0.05; // верхний ряд (0) = максимальная задержка
        cell.style.animationDelay = delay + 's';
        cell.classList.add('pf-fall');
      } else {
        // Старый символ — только убираем класс pf-remove, ничего не перерисовываем
        cell.classList.remove('pf-remove', 'pf-fall', 'pf-drop');
        cell.style.animationDelay = '';
      }
    }

    setTimeout(function(){
      document.querySelectorAll('.pf-fall').forEach(function(c){
        c.classList.remove('pf-fall');
        c.style.animationDelay = '';
      });
      setTimeout(function() { pfEvalClusters(isFree); }, 200);
    }, 520);

  }, 420);
}

// ---- SCATTER & FREE SPINS ----
function pfScatterPay(count) {
  var pays = { 4: 3, 5: 10, 6: 50, 7: 100, 8: 300 };
  return pays[Math.min(count, 8)] || 0;
}

function pfHighlightScatters() {
  pfGrid.forEach(function(s, i) {
    if (s && s.id === 'scatter') {
      var cell = document.getElementById('pf-cell-' + i);
      if (cell) cell.classList.add('pf-scatter-glow');
    }
  });
}

function pfTriggerFreeSpins(scatterCount) {
  document.querySelectorAll('.pf-scatter-glow').forEach(function(c){ c.classList.remove('pf-scatter-glow'); });
  pfFreeSpins = PF.FREE_SPINS_START;
  pfFsWon = 0;
  pfFsTotal = 0;
  pfSpinning = false;
  pfActiveBombs = [];
  pfUpdateFsUI();
  document.getElementById('pf-freespins-banner').classList.remove('hidden');
  pfSetMsg('🍬 ' + PF.FREE_SPINS_START + ' ФРИСПИНОВ! Scatter x' + scatterCount, 'jackpot');
  showToast('🍬 Активированы ' + PF.FREE_SPINS_START + ' фриспинов!');
  spawnConfetti();
  setTimeout(function(){ pfDoFreeSpin(); }, 1500);
}

function pfEndFreeSpins() {
  pfFreeSpins = 0;
  document.getElementById('pf-freespins-banner').classList.add('hidden');
  pfSpinning = false;
  pfSetState('idle');
  pfShowFsResult();
}

function pfShowFsResult() {
  var modal = document.getElementById('pf-result-modal');
  if (!modal) return;
  document.getElementById('pf-result-won').textContent  = pfFmt(pfFsWon);
  document.getElementById('pf-result-spins').textContent = pfFsTotal + ' спинов';
  modal.classList.remove('hidden');
  spawnConfetti();
}

function pfCloseFsResult() {
  document.getElementById('pf-result-modal').classList.add('hidden');
}

// ---- BUY FREESPINS ----
function pfOpenBuy() {
  var cost = pfBet * 100;
  if (balance < cost) { showToast('Недостаточно средств! Нужно ' + pfFmt(cost)); return; }
  document.getElementById('pf-buy-cost').textContent = pfFmt(cost);
  document.getElementById('pf-buy-modal').classList.remove('hidden');
}

function pfCloseBuy() {
  document.getElementById('pf-buy-modal').classList.add('hidden');
}

function pfConfirmBuy() {
  pfCloseBuy();
  var cost = pfBet * 100;
  if (balance < cost) return;
  pfCostBuy = cost;
  balance -= cost;
  saveBalance();
  pfUpdateBalanceUI();
  pfFreeSpins = PF.FREE_SPINS_START;
  pfFsWon = 0;
  pfFsTotal = 0;
  pfActiveBombs = [];
  pfUpdateFsUI();
  document.getElementById('pf-freespins-banner').classList.remove('hidden');
  showToast('🍬 Куплено ' + PF.FREE_SPINS_START + ' фриспинов за ' + pfFmt(cost) + '!');
  spawnConfetti();
  setTimeout(function(){ pfDoFreeSpin(); }, 800);
}

// ---- БОМБА АНИМАЦИЯ ----
function pfShowBombMult(total) {
  var el = document.getElementById('pf-bomb-overlay');
  if (!el) return;
  el.textContent = '💣 x' + total;
  el.classList.remove('hidden');
  el.classList.add('pf-bomb-flash');
  setTimeout(function(){
    el.classList.add('hidden');
    el.classList.remove('pf-bomb-flash');
  }, 1400);
}

// ---- СЧЁТЧИК СУММАРНОГО ВЫИГРЫША ----
function pfShowSpinTotal() {
  var el = document.getElementById('pf-spin-total');
  if (!el) return;
  if (pfTotalWinThisSpin > 0) {
    el.textContent = 'Итого за спин: ' + pfFmt(pfTotalWinThisSpin);
    el.classList.remove('hidden');
  }
}

function pfHideSpinTotal() {
  var el = document.getElementById('pf-spin-total');
  if (el) el.classList.add('hidden');
}

// ---- UI HELPERS ----
function pfUpdateBetUI() {
  document.getElementById('pf-bet-val').textContent = '$' + pfBet;
  document.getElementById('pf-ante-btn').className = 'pf-ante-btn' + (pfAnte ? ' active' : '');
  document.querySelectorAll('.pf-bet-preset').forEach(function(b){
    b.classList.toggle('active', parseInt(b.dataset.val) === pfBet);
  });
}

function pfChangeBet(dir) {
  var steps = [1,2,5,10,25,50];
  var idx = steps.indexOf(pfBet);
  pfBet = steps[Math.max(0, Math.min(steps.length-1, idx+dir))];
  pfUpdateBetUI();
}

function pfSetBet(val) {
  pfBet = val;
  pfUpdateBetUI();
}

function pfToggleAnte() {
  pfAnte = !pfAnte;
  pfUpdateBetUI();
  showToast(pfAnte ? 'Ante Bet активен (+25%)' : 'Ante Bet отключён');
}

function pfUpdateFsUI() {
  var el = document.getElementById('pf-fs-count');
  if (el) el.textContent = pfFreeSpins;
}

function pfUpdateBalanceUI() {
  var el = document.getElementById('pf-balance');
  if (el) el.textContent = fmtBal();
}

function pfSetState(state) {
  var btn = document.getElementById('pf-spin-btn');
  if (!btn) return;
  if (state === 'spinning') {
    btn.disabled = true;
    btn.textContent = 'Крутим...';
  } else if (pfFreeSpins > 0) {
    btn.disabled = true;
    btn.textContent = 'Фриспин...';
  } else {
    btn.disabled = false;
    btn.textContent = '🍵 SPIN';
  }
}

function pfSetMsg(msg, type) {
  var el = document.getElementById('pf-result-msg');
  if (!el) return;
  el.textContent = msg;
  el.className = 'pf-result-msg pf-msg-' + (type || 'neutral');
}

function pfFmt(n) { return '$' + (n || 0).toFixed(2); }
