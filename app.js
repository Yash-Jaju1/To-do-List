// Todo App Advanced Features Implementation

const todoList = document.getElementById('todoList');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const fromDateInput = document.getElementById('fromDate');
const toDateInput = document.getElementById('toDate');
const sortSelect = document.getElementById('sortSelect');
const clearFiltersBtn = document.getElementById('clearFilters');
const addTodoForm = document.getElementById('addTodoForm');
const newTodoInput = document.getElementById('newTodoInput');
const errorMessageDiv = document.getElementById('errorMessage');
const successMessageDiv = document.getElementById('successMessage');
const toggleDarkModeBtn = document.getElementById('toggleDarkMode');

let todos = [];
let filteredTodos = [];
let currentPage = 1;
const todosPerPage = 10;

function showError(message) {
  errorMessageDiv.textContent = message;
  errorMessageDiv.classList.remove('d-none');
}

function hideError() {
  errorMessageDiv.classList.add('d-none');
  errorMessageDiv.textContent = '';
}

function showSuccess(message) {
  successMessageDiv.textContent = message;
  successMessageDiv.classList.remove('d-none');
  setTimeout(() => {
    successMessageDiv.classList.add('d-none');
    successMessageDiv.textContent = '';
  }, 3000);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function fetchTodos() {
  hideError();
  todoList.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></div>';
  try {
    const response = await fetch('https://dummyjson.com/todos?limit=50');
    if (!response.ok) throw new Error('Failed to fetch todos');
    const data = await response.json();

    todos = data.todos.map(todo => ({
      ...todo,
      createdAt: randomDate(new Date(2023, 0, 1), new Date())
    }));

    applyFilters();
  } catch (err) {
    showError('Error loading todos: ' + err.message);
    todoList.innerHTML = '';
  }
}

function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const fromDate = fromDateInput.value ? new Date(fromDateInput.value) : null;
  const toDate = toDateInput.value ? new Date(toDateInput.value) : null;

  filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.todo.toLowerCase().includes(search);
    const created = new Date(todo.createdAt);
    const matchesFrom = fromDate ? created >= fromDate : true;
    const matchesTo = toDate ? created <= toDate : true;
    return matchesSearch && matchesFrom && matchesTo;
  });

  if (sortSelect.value) {
    const value = sortSelect.value;
    if (value === 'az') filteredTodos.sort((a, b) => a.todo.localeCompare(b.todo));
    if (value === 'za') filteredTodos.sort((a, b) => b.todo.localeCompare(a.todo));
    if (value === 'newest') filteredTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (value === 'oldest') filteredTodos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  currentPage = 1;
  renderPage();
  renderPagination();
}

function renderPage() {
  const start = (currentPage - 1) * todosPerPage;
  const paginatedTodos = filteredTodos.slice(start, start + todosPerPage);

  if (todos.length === 0) {
    todoList.innerHTML = '<li class="list-group-item text-center">You have no tasks yet. Start by adding one!</li>';
    return;
  }

  if (paginatedTodos.length === 0) {
    todoList.innerHTML = '<li class="list-group-item text-center">No todos match your filters.</li>';
    return;
  }

  todoList.innerHTML = paginatedTodos.map(todo => `
    <li class="list-group-item d-flex justify-content-between align-items-start ${todo.completed ? 'completed list-group-item-success' : ''}" data-id="${todo.id}">
      <div class="me-auto">
        <span class="todo-text">${todo.todo}</span><br />
        <small>Created on: ${new Date(todo.createdAt).toDateString()}</small>
      </div>
      <div class="btn-group">
        <button class="btn btn-sm btn-outline-success toggle-complete">✔️</button>
        <button class="btn btn-sm btn-outline-primary edit-todo">✏️</button>
        <button class="btn btn-sm btn-outline-danger delete-todo">🗑️</button>
      </div>
    </li>
  `).join('');
}

function renderPagination() {
  const totalPages = Math.ceil(filteredTodos.length / todosPerPage);
  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = `<button class="page-link">${i}</button>`;
    li.addEventListener('click', () => {
      currentPage = i;
      renderPage();
      renderPagination();
    });
    pagination.appendChild(li);
  }
}

addTodoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const task = newTodoInput.value.trim();
  if (!task) return;

  newTodoInput.disabled = true;
  addTodoForm.querySelector('button').textContent = 'Adding...';

  try {
    const response = await fetch('https://dummyjson.com/todos/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo: task, completed: false, userId: 1 })
    });

    if (!response.ok) throw new Error('Failed to add todo');

    const newTodo = await response.json();
    newTodo.createdAt = new Date();
    todos.unshift(newTodo);
    applyFilters();
    showSuccess('Todo added successfully!');
    newTodoInput.value = '';
  } catch (err) {
    showError('Error adding todo: ' + err.message);
  } finally {
    newTodoInput.disabled = false;
    addTodoForm.querySelector('button').textContent = 'Add Todo';
  }
});

searchInput.addEventListener('input', applyFilters);
fromDateInput.addEventListener('change', applyFilters);
toDateInput.addEventListener('change', applyFilters);
sortSelect.addEventListener('change', applyFilters);

clearFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  fromDateInput.value = '';
  toDateInput.value = '';
  sortSelect.value = '';
  applyFilters();
});

todoList.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  const id = Number(li.dataset.id);

  if (e.target.classList.contains('toggle-complete')) {
    const todo = todos.find(t => t.id === id);
    todo.completed = !todo.completed;
    applyFilters();
  }

  if (e.target.classList.contains('edit-todo')) {
    const todo = todos.find(t => t.id === id);
    const newText = prompt('Edit task:', todo.todo);
    if (newText) {
      todo.todo = newText;
      applyFilters();
      showSuccess('Todo updated.');
    }
  }

  if (e.target.classList.contains('delete-todo')) {
    if (confirm('Are you sure you want to delete this todo?')) {
      todos = todos.filter(t => t.id !== id);
      applyFilters();
      showSuccess('Todo deleted.');
    }
  }
});

toggleDarkModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

fetchTodos();
