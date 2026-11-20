/* ═══════════════════════════════════════════════
   Focus Dashboard — app.js
   Challenges: Light/Dark mode · Custom name · Change Pomodoro time · Prevent duplicate tasks · Sort tasks
═══════════════════════════════════════════════ */

/* ──────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/* ──────────────────────────────────────────────
   GREETING & DATETIME
────────────────────────────────────────────── */
function getGreetingWord(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function updateDatetime() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  $('datetime').textContent = `${dateStr} · ${timeStr}`;

  const name = loadLS('userName', '');
  const word = getGreetingWord(now.getHours());
  $('greeting').textContent = name ? `${word}, ${name}! 👋` : `${word}! 👋`;
}

setInterval(updateDatetime, 1000);
updateDatetime();

/* ──────────────────────────────────────────────
   LIGHT / DARK MODE
────────────────────────────────────────────── */
const themeToggle = $('theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

let currentTheme = loadLS('theme', 'light');
applyTheme(currentTheme);

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
  saveLS('theme', currentTheme);
});

/* ──────────────────────────────────────────────
   CUSTOM NAME
────────────────────────────────────────────── */
const nameModal  = $('name-modal');
const nameInput  = $('name-input');
const nameSave   = $('name-save');
const nameCancel = $('name-cancel');

$('name-btn').addEventListener('click', () => {
  nameInput.value = loadLS('userName', '');
  nameModal.classList.remove('hidden');
  nameInput.focus();
});

nameSave.addEventListener('click', saveName);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
nameCancel.addEventListener('click', () => nameModal.classList.add('hidden'));
nameModal.addEventListener('click', (e) => { if (e.target === nameModal) nameModal.classList.add('hidden'); });

function saveName() {
  const val = nameInput.value.trim();
  saveLS('userName', val);
  nameModal.classList.add('hidden');
  updateDatetime();
}

/* ──────────────────────────────────────────────
   FOCUS TIMER
────────────────────────────────────────────── */
let timerDuration = loadLS('timerDuration', 25); // minutes
let timerSeconds  = timerDuration * 60;
let timerInterval = null;
let timerRunning  = false;

const timerDisplay  = $('timer-display');
const timerStatus   = $('timer-status');
const durationInput = $('timer-duration');

durationInput.value = timerDuration;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

renderTimer();

$('timer-start').addEventListener('click', () => {
  if (timerRunning) return;
  timerRunning = true;
  timerStatus.textContent = '';
  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerStatus.textContent = '🎉 Session complete! Take a break.';
      timerDisplay.textContent = '00:00';
    }
  }, 1000);
});

$('timer-stop').addEventListener('click', () => {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  timerStatus.textContent = 'Paused.';
});

$('timer-reset').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = timerDuration * 60;
  renderTimer();
  timerStatus.textContent = '';
});

$('timer-apply').addEventListener('click', () => {
  const val = parseInt(durationInput.value, 10);
  if (!val || val < 1 || val > 120) {
    timerStatus.textContent = 'Enter a value between 1 and 120.';
    return;
  }
  clearInterval(timerInterval);
  timerRunning = false;
  timerDuration = val;
  timerSeconds  = timerDuration * 60;
  saveLS('timerDuration', timerDuration);
  renderTimer();
  timerStatus.textContent = `Timer set to ${timerDuration} min.`;
});

/* ──────────────────────────────────────────────
   TO-DO LIST
────────────────────────────────────────────── */
let tasks = loadLS('tasks', []); // [{ id, text, done }]

const todoInput     = $('todo-input');
const todoList      = $('todo-list');
const duplicateMsg  = $('todo-duplicate-msg');
const sortSelect    = $('sort-select');

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getSortedTasks() {
  const mode = sortSelect.value;
  const copy = [...tasks];
  if (mode === 'asc')  return copy.sort((a, b) => a.text.localeCompare(b.text));
  if (mode === 'desc') return copy.sort((a, b) => b.text.localeCompare(a.text));
  if (mode === 'done') return copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy; // default: insertion order
}

function renderTasks() {
  todoList.innerHTML = '';
  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    todoList.innerHTML = '<li style="color:var(--text-muted);font-size:.85rem;padding:8px 0;">No tasks yet. Add one above!</li>';
    return;
  }

  sorted.forEach((task) => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" class="todo-check" ${task.done ? 'checked' : ''} title="Mark done" />
      <span class="todo-text">${escapeHtml(task.text)}</span>
      <div class="todo-actions">
        <button class="btn btn-sm edit-btn">Edit</button>
        <button class="btn btn-sm btn-danger delete-btn">Delete</button>
      </div>`;

    // toggle done
    li.querySelector('.todo-check').addEventListener('change', () => toggleTask(task.id));
    // edit
    li.querySelector('.edit-btn').addEventListener('click', () => startEdit(task.id, li));
    // delete
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

    todoList.appendChild(li);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function addTask() {
  const text = todoInput.value.trim();
  if (!text) return;

  // prevent duplicates (case-insensitive)
  const exists = tasks.some((t) => t.text.toLowerCase() === text.toLowerCase());
  if (exists) {
    duplicateMsg.classList.remove('hidden');
    setTimeout(() => duplicateMsg.classList.add('hidden'), 2500);
    return;
  }
  duplicateMsg.classList.add('hidden');

  tasks.push({ id: uid(), text, done: false });
  saveLS('tasks', tasks);
  todoInput.value = '';
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
  saveLS('tasks', tasks);
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveLS('tasks', tasks);
  renderTasks();
}

function startEdit(id, li) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const textSpan = li.querySelector('.todo-text');
  const actions  = li.querySelector('.todo-actions');

  const input = document.createElement('input');
  input.type  = 'text';
  input.className = 'todo-edit-input';
  input.value = task.text;
  input.maxLength = 100;

  textSpan.replaceWith(input);
  input.focus();

  actions.innerHTML = `
    <button class="btn btn-sm btn-primary save-edit-btn">Save</button>
    <button class="btn btn-sm cancel-edit-btn">Cancel</button>`;

  function saveEdit() {
    const newText = input.value.trim();
    if (!newText) return;

    // prevent duplicate on edit (ignore self)
    const exists = tasks.some((t) => t.id !== id && t.text.toLowerCase() === newText.toLowerCase());
    if (exists) {
      duplicateMsg.classList.remove('hidden');
      setTimeout(() => duplicateMsg.classList.add('hidden'), 2500);
      return;
    }
    duplicateMsg.classList.add('hidden');

    tasks = tasks.map((t) => t.id === id ? { ...t, text: newText } : t);
    saveLS('tasks', tasks);
    renderTasks();
  }

  actions.querySelector('.save-edit-btn').addEventListener('click', saveEdit);
  actions.querySelector('.cancel-edit-btn').addEventListener('click', renderTasks);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') renderTasks();
  });
}

$('todo-add').addEventListener('click', addTask);
todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
sortSelect.addEventListener('change', renderTasks);

renderTasks();

/* ──────────────────────────────────────────────
   QUICK LINKS
────────────────────────────────────────────── */
let links = loadLS('quickLinks', [
  { id: uid(), name: 'Google',    url: 'https://google.com' },
  { id: uid(), name: 'YouTube',   url: 'https://youtube.com' },
  { id: uid(), name: 'GitHub',    url: 'https://github.com' },
]);

const linksContainer = $('links-container');

function faviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return '';
  }
}

function renderLinks() {
  linksContainer.innerHTML = '';
  if (links.length === 0) {
    linksContainer.innerHTML = '<span style="color:var(--text-muted);font-size:.85rem;">No links yet.</span>';
    return;
  }

  links.forEach((link) => {
    const a = document.createElement('a');
    a.href   = link.url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.className = 'link-chip';

    const favicon = faviconUrl(link.url);
    a.innerHTML = `
      ${favicon ? `<img class="link-favicon" src="${favicon}" alt="" loading="lazy" onerror="this.style.display='none'" />` : ''}
      ${escapeHtml(link.name)}
      <button class="link-delete" title="Remove link" data-id="${link.id}">✕</button>`;

    a.querySelector('.link-delete').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    linksContainer.appendChild(a);
  });
}

function addLink() {
  const name = $('link-name-input').value.trim();
  const url  = $('link-url-input').value.trim();
  if (!name || !url) return;

  let full = url;
  if (!/^https?:\/\//i.test(full)) full = 'https://' + full;

  links.push({ id: uid(), name, url: full });
  saveLS('quickLinks', links);
  $('link-name-input').value = '';
  $('link-url-input').value  = '';
  renderLinks();
}

function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLS('quickLinks', links);
  renderLinks();
}

$('link-add').addEventListener('click', addLink);
$('link-url-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });

renderLinks();
