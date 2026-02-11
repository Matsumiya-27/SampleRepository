// TODOアプリの主要DOM要素
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const clearCompletedButton = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

// localStorageで使うキー
const STORAGE_KEY = "simple-todo-items";

// 表示中のフィルター状態（all / active / completed）
let currentFilter = "all";

// 初期表示: 保存済みTODOを読み込み、描画
let todos = loadTodos();
render();

// TODO追加
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
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
  todos = todos.filter((todo) => !todo.completed);
  persistAndRender();
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
}

// フィルターボタンの見た目（activeクラス）を同期する
function updateFilterButtonState() {
  for (const button of filterButtons) {
    const isSelected = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isSelected);
  }
}

// 保存して再描画する共通処理
function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
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
      .map((todo) => ({ id: todo.id, text: todo.text, completed: todo.completed }));
  } catch {
    return [];
  }
}
