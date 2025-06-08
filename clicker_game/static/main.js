/* ===== 資料結構 ===== */
const rewards = [
  { id: 3,  chance: 12.5 }, { id: 4,  chance: 12.5 },
  { id: 5,  chance: 12.5 }, { id: 6,  chance: 12.5 },
  { id: 7,  chance: 7.5  }, { id: 8,  chance: 7.5  },
  { id: 9,  chance: 7.5  }, { id: 10, chance: 7.5  },
  { id: 11, chance: 3.5  }, { id: 12, chance: 3.5  }, { id: 13, chance: 3.5  },
  { id: 14, chance: 2.25 }, { id: 15, chance: 2.25 }, { id: 16, chance: 2.25 },
  { id: 17, chance: 1.375}, { id: 18, chance: 1.375}
];

/* ===== DOM 變數 ===== */
const imageEl     = document.getElementById('click-image');
const pokedexGrid = document.getElementById('pokedex-grid');
const resetBtn    = document.getElementById('reset-button');
const particleBox = document.getElementById('particles-container');

let collected = {};

async function loadCollection() {
  const res = await fetch('/get_collection');
  collected = await res.json();
  updatePokedex(); // 初始化圖鑑
}

/* ===== 稀有度分類 ===== */
function getRarity(chance) {
  if (chance >= 10) return { name: '普通',     cls: 'rarity-common' };
  if (chance >= 7.5) return { name: '稀有',     cls: 'rarity-uncommon' };
  if (chance >= 3) return { name: '機稀有',   cls: 'rarity-rare' };
  if (chance >= 2) return { name: '超級稀有', cls: 'rarity-epic' };
  return { name: '傳說稀有', cls: 'rarity-legendary' };
}

/* ===== 抽卡機制 ===== */
function getRandomReward() {
  const roll = Math.random() * 100;
  let sum = 0;
  for (const r of rewards) {
    sum += r.chance;
    if (roll < sum) return r.id;
  }
  return null;
}

/* ===== 更新圖鑑 ===== */
function updatePokedex() {
  pokedexGrid.innerHTML = '';
  const groups = { '普通': [], '稀有': [], '機稀有': [], '超級稀有': [], '傳說稀有': [] };
  const totals = { '普通': 0, '稀有': 0, '機稀有': 0, '超級稀有': 0, '傳說稀有': 0 };

  for (const r of rewards) {
    const cnt = collected[r.id] || 0;
    const rar = getRarity(r.chance);

    const card = document.createElement('div');
    card.className = `entry ${rar.cls}`;

    const img = document.createElement('img');
    img.src = cnt > 0 ? `/static/images/${r.id}img.png` : `/static/images/question.png`;

    const label = document.createElement('div');
    label.textContent = cnt > 0 ? `x${cnt}` : `${r.chance}%`;

    card.append(img, label);
    groups[rar.name].push(card);
    totals[rar.name] += r.chance;
  }

  for (const name of ['傳說稀有', '超級稀有', '機稀有', '稀有', '普通']) {
    const title = document.createElement('h3');
    title.textContent = `${name}（${totals[name].toFixed(2)}%）`;

    const section = document.createElement('div');
    section.className = 'pokedex-section';
    groups[name].forEach(card => section.appendChild(card));

    pokedexGrid.append(title, section);
  }
}

/* ===== 粒子特效 ===== */
function showParticles(x, y, isExplosion = false) {
  const count = isExplosion ? 40 : 15;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const dist = isExplosion ? 200 : 120;

    p.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--y', `${Math.sin(angle) * dist}px`);

    particleBox.appendChild(p);
    setTimeout(() => particleBox.removeChild(p), 1000);
  }
}

/* ===== 卡片飛行動畫 ===== */
function animateToPokedex(id) {
  const origin = imageEl.getBoundingClientRect();
  const fly = document.createElement('img');
  fly.src = `/static/images/${id}img.png`;
  fly.className = 'fly-card';

  fly.style.left = `${origin.left + origin.width / 2 - 30}px`;
  fly.style.top = `${origin.top + origin.height / 2 - 30}px`;

  document.body.appendChild(fly);

  setTimeout(() => {
    const targetEntry = [...document.querySelectorAll('.entry img')]
      .find(el => el.src.includes(`${id}img.png`));
    if (targetEntry) {
      const target = targetEntry.getBoundingClientRect();
      const dx = target.left + target.width / 2 - (origin.left + origin.width / 2);
      const dy = target.top + target.height / 2 - (origin.top + origin.height / 2);
      fly.style.setProperty('--dx', `${dx}px`);
      fly.style.setProperty('--dy', `${dy}px`);
    }
    setTimeout(() => fly.remove(), 900);
  }, 100);
}

/* ===== 點擊抽卡（無限次） ===== */
imageEl.addEventListener('click', () => {
  imageEl.src = '/static/images/2img.png';
  setTimeout(() => imageEl.src = '/static/images/1img.png', 150);

  const id = getRandomReward();
  if (!id) return;

  collected[id] = (collected[id] || 0) + 1;
fetch('/update_collection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(collected)
});
  updatePokedex();

  const chance = rewards.find(r => r.id === id).chance;
  const rect = imageEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  if (chance < 2) showParticles(cx, cy, true);
  else if (chance < 3) showParticles(cx, cy, false);

  animateToPokedex(id);
});


resetBtn.addEventListener('click', () => {
  localStorage.removeItem('collection');
  Object.keys(collected).forEach(k => delete collected[k]);
  updatePokedex();

  // 新增這段：清除後端資料庫的圖鑑
  fetch('/update_collection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
});


/* ===== 初始渲染 ===== */
updatePokedex();

// 初始化：從後端讀取圖鑑資料
loadCollection();
