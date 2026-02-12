// TODOアプリの主要DOM要素
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const clearCompletedButton = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");
const pointsValue = document.getElementById("points-value");
const openShopButton = document.getElementById("open-shop");

// ポイントショップ用DOM
const shopModal = document.getElementById("shop-modal");
const closeShopButton = document.getElementById("close-shop");
const shopLevelValue = document.getElementById("shop-level-value");
const shopNextCostValue = document.getElementById("shop-next-cost-value");
const shopUpgradeButton = document.getElementById("shop-upgrade");

// デバッグポイント追加用DOM
const debugModal = document.getElementById("debug-modal");
const closeDebugButton = document.getElementById("close-debug");
const debugPointsInput = document.getElementById("debug-points");
const debugAddButton = document.getElementById("debug-add-points");

// localStorageで使うキー
const STORAGE_KEY = "simple-todo-items";
const POINTS_STORAGE_KEY = "simple-todo-points";
const FIREWORK_POWER_STORAGE_KEY = "simple-todo-firework-power";

// 表示中のフィルター状態（all / active / completed）
let currentFilter = "all";

// 花火の基本設定
const FIREWORK_TICK_MS = 500;
const FIREWORK_BURSTS_PER_TICK = 3;
const FIREWORK_TICKS = 5;

// 初期表示: 保存済みTODO・ポイント・花火強化レベルを読み込み、描画
let todos = loadTodos();
let points = loadPoints();
let fireworkPowerLevel = loadFireworkPowerLevel();
render();

// TODO追加
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    return;
  }

  // debugcommand でポイント加算デバッグ画面を開く
  if (text.toLowerCase() === "debugcommand") {
    input.value = "";
    openDebugModal();
    return;
  }

  todos.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
  });

  input.value = "";
  persistAndRender();
});

// 完了済みTODOの一括削除
clearCompletedButton.addEventListener("click", () => {
  // 削除前に「全件完了状態か」を覚えておき、削除完了時の演出条件に使う
  const hadTodos = todos.length > 0;
  const wereAllCompleted = hadTodos && todos.every((todo) => todo.completed);

  const completedCount = todos.filter((todo) => todo.completed).length;
  todos = todos.filter((todo) => !todo.completed);

  // ポイント獲得タイミングを「完了を削除した時」に変更
  if (completedCount > 0) {
    points += completedCount;
  }

  persistAndRender();

  // 「全件完了→完了を削除できた」タイミングで花火を打ち上げる
  if (wereAllCompleted && completedCount > 0) {
    launchFireworksSequence();
  }
});

// ポイントショップを開く
openShopButton.addEventListener("click", () => {
  openShopModal();
});

closeShopButton.addEventListener("click", () => {
  closeShopModal();
});

shopUpgradeButton.addEventListener("click", () => {
  const cost = getNextUpgradeCost();
  if (points < cost) {
    return;
  }

  points -= cost;
  fireworkPowerLevel += 1;
  persistAndRender();
  syncShopView();
});

// デバッグポイント加算画面
closeDebugButton.addEventListener("click", () => {
  closeDebugModal();
});

debugAddButton.addEventListener("click", () => {
  const amount = Number.parseInt(debugPointsInput.value, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  points += amount;
  persistAndRender();
  closeDebugModal();
});

// モーダル背景クリックで閉じる
shopModal.addEventListener("click", (event) => {
  if (event.target === shopModal) {
    closeShopModal();
  }
});

debugModal.addEventListener("click", (event) => {
  if (event.target === debugModal) {
    closeDebugModal();
  }
});

// フィルターボタンのクリックで、表示対象を切り替える
for (const button of filterButtons) {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    updateFilterButtonState();
    render();
  });
}

// 現在のtodos配列をDOMへ反映
function render() {
  // 毎回全件描画し直すため、まず一覧を空にする
  list.textContent = "";

  // 現在フィルターに一致するTODOだけ表示する
  const visibleTodos = todos.filter((todo) => {
    if (currentFilter === "active") {
      return !todo.completed;
    }

    if (currentFilter === "completed") {
      return todo.completed;
    }

    return true;
  });

  for (const todo of visibleTodos) {
    const item = document.createElement("li");
    item.className = "todo-item";
    if (todo.completed) {
      item.classList.add("completed");
    }

    const label = document.createElement("label");

    // 完了チェックの切り替え
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => {
      todo.completed = checkbox.checked;
      persistAndRender();
    });

    const span = document.createElement("span");
    span.textContent = todo.text;

    // 個別削除ボタン
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "削除";
    deleteButton.addEventListener("click", () => {
      todos = todos.filter((candidate) => candidate.id !== todo.id);
      persistAndRender();
    });

    label.append(checkbox, span);
    item.append(label, deleteButton);
    list.append(item);
  }

  pointsValue.textContent = String(points);
  syncShopView();
}

// フィルターボタンの見た目（activeクラス）を同期する
function updateFilterButtonState() {
  for (const button of filterButtons) {
    const isSelected = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isSelected);
  }
}

// ショップ表示を現在のポイント/強化レベルに同期
function syncShopView() {
  const nextCost = getNextUpgradeCost();
  shopLevelValue.textContent = String(fireworkPowerLevel);
  shopNextCostValue.textContent = String(nextCost);
  shopUpgradeButton.disabled = points < nextCost;
}

// 次の強化コストを算出
function getNextUpgradeCost() {
  return 3 + fireworkPowerLevel * 2;
}

// ポイントショップを開く
function openShopModal() {
  syncShopView();
  shopModal.hidden = false;
}

function closeShopModal() {
  shopModal.hidden = true;
}

// デバッグ画面を開く
function openDebugModal() {
  debugPointsInput.value = "10";
  debugModal.hidden = false;
}

function closeDebugModal() {
  debugModal.hidden = true;
}

// 0.5秒おきに3発ずつ花火を打ち上げる
function launchFireworksSequence() {
  const layer = createFireworksLayer();

  for (let tick = 0; tick < FIREWORK_TICKS; tick += 1) {
    const delay = tick * FIREWORK_TICK_MS;
    setTimeout(() => {
      for (let burst = 0; burst < FIREWORK_BURSTS_PER_TICK; burst += 1) {
        launchFireworkBurst(layer);
      }
    }, delay);
  }

  // 最後の花火のアニメーションが終わる頃に片付ける
  setTimeout(() => {
    layer.remove();
  }, FIREWORK_TICKS * FIREWORK_TICK_MS + 3200 + fireworkPowerLevel * 150);
}

// 花火レイヤーを作る
function createFireworksLayer() {
  const layer = document.createElement("div");
  layer.className = "fireworks-layer";
  document.body.append(layer);
  return layer;
}

// 1発分の花火パーティクルを生成する
function launchFireworkBurst(layer) {
  const colorPalette = ["#f472b6", "#22d3ee", "#facc15", "#34d399", "#a78bfa", "#fb7185", "#fb923c"];
  const originX = 8 + Math.random() * 84;
  const originY = 10 + Math.random() * 54;

  // 花火強化レベルが上がるほど粒子が増え、飛距離も伸びる
  const particleCount = 38 + fireworkPowerLevel * 12;
  const distanceBoost = fireworkPowerLevel * 20;

  for (let particleIndex = 0; particleIndex < particleCount; particleIndex += 1) {
    const particle = document.createElement("span");
    particle.className = "firework-particle";

    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * (220 + distanceBoost);
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const duration = 1050 + Math.random() * (850 + fireworkPowerLevel * 90);
    const size = 4 + Math.random() * (7 + fireworkPowerLevel * 0.8);

    particle.style.left = `${originX}%`;
    particle.style.top = `${originY}%`;
    particle.style.setProperty("--dx", `${dx}px`);
    particle.style.setProperty("--dy", `${dy}px`);
    particle.style.setProperty("--duration", `${duration}ms`);
    particle.style.setProperty("--size", `${size}px`);
    particle.style.background = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    // 一部の粒子を大きめにして目立つ花火にする
    if (Math.random() > 0.72) {
      particle.classList.add("firework-particle--large");
    }

    layer.append(particle);
  }
}

// 保存して再描画する共通処理
function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  localStorage.setItem(POINTS_STORAGE_KEY, String(points));
  localStorage.setItem(FIREWORK_POWER_STORAGE_KEY, String(fireworkPowerLevel));
  render();
}

// localStorageからTODOを読み込む
function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  // 破損データや想定外形式でも落ちないように防御的に処理
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (todo) =>
          typeof todo === "object" &&
          todo !== null &&
          typeof todo.id === "string" &&
          typeof todo.text === "string" &&
          typeof todo.completed === "boolean"
      )
      .map((todo) => ({
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
      }));
  } catch {
    return [];
  }
}

// localStorageからポイントを読み込む
function loadPoints() {
  const raw = localStorage.getItem(POINTS_STORAGE_KEY);
  const parsed = Number.parseInt(raw ?? "0", 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

// localStorageから花火強化レベルを読み込む
function loadFireworkPowerLevel() {
  const raw = localStorage.getItem(FIREWORK_POWER_STORAGE_KEY);
  const parsed = Number.parseInt(raw ?? "0", 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}
