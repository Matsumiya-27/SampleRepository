const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const clearCompletedButton = document.getElementById("clear-completed");

const STORAGE_KEY = "simple-todo-items";

let todos = loadTodos();
render();

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

clearCompletedButton.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.completed);
  persistAndRender();
});

function render() {
  list.textContent = "";

  for (const todo of todos) {
    const item = document.createElement("li");
    item.className = "todo-item";
    if (todo.completed) {
      item.classList.add("completed");
    }

    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => {
      todo.completed = checkbox.checked;
      persistAndRender();
    });

    const span = document.createElement("span");
    span.textContent = todo.text;

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

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  render();
}

function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

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
