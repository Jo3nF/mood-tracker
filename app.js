// ===== Mood Tracker PWA =====
// Data stored in localStorage with key 'moodData'
// Format: { "YYYY-MM-DD": { grade: 0-5, note: "string" } }

const GRADES = ['A+', 'A', 'B', 'C', 'D', 'F'];
const GRADE_VALUES = [5, 4, 3, 2, 1, 0]; // For calculating averages
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// ===== State =====
let currentView = 'month';
let currentDate = new Date();
let viewYear = currentDate.getFullYear();
let viewMonth = currentDate.getMonth();

// ===== DOM Elements =====
const yearDisplay = document.getElementById('yearDisplay');
const todayDate = document.getElementById('todayDate');
const moodButtons = document.getElementById('moodButtons');
const noteInput = document.getElementById('noteInput');
const monthNav = document.getElementById('monthNav');
const monthLabel = document.getElementById('monthLabel');
const calendar = document.getElementById('calendar');
const yearGrid = document.getElementById('yearGrid');
const statsRow = document.getElementById('statsRow');
const averageValue = document.getElementById('averageValue');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const shareBtn = document.getElementById('shareBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

// ===== LocalStorage =====
function getData() {
    const data = localStorage.getItem('moodData');
    return data ? JSON.parse(data) : {};
}

function saveData(data) {
    localStorage.setItem('moodData', JSON.stringify(data));
}

function getMood(dateStr) {
    const data = getData();
    return data[dateStr] || null;
}

function saveMood(dateStr, grade, note) {
    const data = getData();
    if (grade === null) {
        delete data[dateStr];
    } else {
        data[dateStr] = { grade, note: note || '' };
    }
    saveData(data);
}

// ===== Date Utilities =====
function formatDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getTodayStr() {
    return formatDateStr(new Date());
}

function formatDisplayDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday-first (0-6)
}

// ===== Statistics =====
function calculateStats(entries) {
    const counts = [0, 0, 0, 0, 0, 0];
    let total = 0;
    let sum = 0;

    for (const entry of Object.values(entries)) {
        if (entry && typeof entry.grade === 'number') {
            counts[entry.grade]++;
            total++;
            sum += GRADE_VALUES[entry.grade];
        }
    }

    const percentages = counts.map(c => total > 0 ? ((c / total) * 100).toFixed(1) : '0.0');
    const average = total > 0 ? sum / total : null;

    return { counts, percentages, total, average };
}

function gradeFromAverage(avg) {
    if (avg === null) return { letter: '—', grade: null };
    if (avg >= 4.5) return { letter: 'A+', grade: 0 };
    if (avg >= 3.5) return { letter: 'A', grade: 1 };
    if (avg >= 2.5) return { letter: 'B', grade: 2 };
    if (avg >= 1.5) return { letter: 'C', grade: 3 };
    if (avg >= 0.5) return { letter: 'D', grade: 4 };
    return { letter: 'F', grade: 5 };
}

function getMonthEntries(year, month) {
    const data = getData();
    const entries = {};
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    for (const [dateStr, entry] of Object.entries(data)) {
        if (dateStr.startsWith(prefix)) {
            entries[dateStr] = entry;
        }
    }
    return entries;
}

function getYearEntries(year) {
    const data = getData();
    const entries = {};
    const prefix = `${year}-`;

    for (const [dateStr, entry] of Object.entries(data)) {
        if (dateStr.startsWith(prefix)) {
            entries[dateStr] = entry;
        }
    }
    return entries;
}

// ===== Render Functions =====
function renderToday() {
    const today = new Date();
    todayDate.textContent = formatDisplayDate(today);
    yearDisplay.textContent = viewYear;

    const todayStr = getTodayStr();
    const mood = getMood(todayStr);

    // Update mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        const grade = parseInt(btn.dataset.grade);
        btn.classList.toggle('selected', mood && mood.grade === grade);
    });

    // Update note input
    noteInput.value = mood ? mood.note : '';
}

function renderCalendar() {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const todayStr = getTodayStr();
    const data = getData();

    monthLabel.textContent = `${MONTHS[viewMonth]} ${viewYear}`;

    let html = '';

    // Day headers
    DAYS.forEach(day => {
        html += `<div class="calendar-header">${day}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const mood = data[dateStr];
        const isToday = dateStr === todayStr;

        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (mood) classes += ` has-mood grade-${mood.grade}`;

        html += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
    }

    calendar.innerHTML = html;

    // Add click handlers
    calendar.querySelectorAll('.calendar-day:not(.empty)').forEach(cell => {
        cell.addEventListener('click', () => handleDayClick(cell.dataset.date));
    });
}

function renderYearGrid() {
    const todayStr = getTodayStr();
    const data = getData();

    let html = '';

    for (let month = 0; month < 12; month++) {
        const daysInMonth = getDaysInMonth(viewYear, month);
        const firstDay = getFirstDayOfMonth(viewYear, month);
        const monthEntries = getMonthEntries(viewYear, month);
        const stats = calculateStats(monthEntries);
        const avgInfo = gradeFromAverage(stats.average);

        html += `<div class="mini-month" data-month="${month}">`;
        html += `<div class="mini-month-header">`;
        html += `<span>${MONTHS[month].slice(0, 3)}</span>`;
        if (avgInfo.grade !== null) {
            html += `<span class="mini-month-avg grade-${avgInfo.grade}" style="background: var(--grade-${avgInfo.grade}); color: #000;">${avgInfo.letter}</span>`;
        }
        html += `</div>`;
        html += `<div class="mini-month-grid">`;

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="mini-day"></div>';
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${viewYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const mood = data[dateStr];
            const gradeClass = mood ? ` grade-${mood.grade}` : '';
            html += `<div class="mini-day${gradeClass}"></div>`;
        }

        html += '</div></div>';
    }

    yearGrid.innerHTML = html;

    // Click handlers for mini-months
    yearGrid.querySelectorAll('.mini-month').forEach(el => {
        el.addEventListener('click', () => {
            viewMonth = parseInt(el.dataset.month);
            switchView('month');
        });
    });
}

function renderStats() {
    let entries;
    if (currentView === 'month') {
        entries = getMonthEntries(viewYear, viewMonth);
    } else {
        entries = getYearEntries(viewYear);
    }

    const stats = calculateStats(entries);

    // Render stat items
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `
            <div class="stat-item">
                <span class="stat-dot grade-${i}"></span>
                <span class="stat-count">${stats.counts[i]}</span>
                <span class="stat-percent">${stats.percentages[i]}%</span>
            </div>
        `;
    }
    statsRow.innerHTML = html;

    // Render average
    const avgInfo = gradeFromAverage(stats.average);
    if (avgInfo.grade !== null) {
        averageValue.textContent = `${avgInfo.letter} (${stats.average.toFixed(1)})`;
        averageValue.className = `average-value grade-${avgInfo.grade}`;
        averageValue.style.background = `var(--grade-${avgInfo.grade})`;
        averageValue.style.color = '#000';
    } else {
        averageValue.textContent = '—';
        averageValue.className = 'average-value';
        averageValue.style.background = 'var(--bg-card)';
        averageValue.style.color = 'var(--text-secondary)';
    }
}

function switchView(view) {
    currentView = view;

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    if (view === 'month') {
        calendar.classList.remove('hidden');
        monthNav.classList.remove('hidden');
        yearGrid.classList.add('hidden');
        renderCalendar();
    } else {
        calendar.classList.add('hidden');
        monthNav.classList.add('hidden');
        yearGrid.classList.remove('hidden');
        renderYearGrid();
    }

    renderStats();
}

// ===== Event Handlers =====
function handleMoodClick(grade) {
    const todayStr = getTodayStr();
    const currentMood = getMood(todayStr);

    if (currentMood && currentMood.grade === grade) {
        // Deselect
        saveMood(todayStr, null, null);
    } else {
        // Select new mood
        saveMood(todayStr, grade, noteInput.value);
    }

    renderToday();
    renderCalendar();
    renderStats();
}

function handleNoteChange() {
    const todayStr = getTodayStr();
    const mood = getMood(todayStr);
    if (mood) {
        saveMood(todayStr, mood.grade, noteInput.value);
    }
}

function handleDayClick(dateStr) {
    const mood = getMood(dateStr);
    const dateObj = new Date(dateStr + 'T12:00:00');

    // Create modal for editing past days
    showDayModal(dateStr, dateObj, mood);
}

function showDayModal(dateStr, dateObj, mood) {
    // Remove existing modal
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const moodButtonsHtml = GRADES.map((g, i) => `
        <button class="mood-btn ${mood && mood.grade === i ? 'selected' : ''}" 
                data-grade="${i}" style="width: 40px; height: 40px;">${g}</button>
    `).join('');

    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-title">${formatDisplayDate(dateObj)}</div>
            <div class="modal-content">
                <div class="mood-buttons" style="margin-bottom: 12px;">
                    ${moodButtonsHtml}
                </div>
                <input type="text" class="note-input" placeholder="Add a note..." 
                       value="${mood ? mood.note : ''}" id="modalNote">
            </div>
            <div class="modal-buttons">
                <button class="modal-btn secondary" id="modalCancel">Cancel</button>
                <button class="modal-btn primary" id="modalSave">Save</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('active'));

    let selectedGrade = mood ? mood.grade : null;

    // Mood button handlers
    overlay.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const grade = parseInt(btn.dataset.grade);
            if (selectedGrade === grade) {
                selectedGrade = null;
                btn.classList.remove('selected');
            } else {
                overlay.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedGrade = grade;
            }
        });
    });

    // Cancel
    overlay.querySelector('#modalCancel').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    });

    // Save
    overlay.querySelector('#modalSave').addEventListener('click', () => {
        const note = overlay.querySelector('#modalNote').value;
        saveMood(dateStr, selectedGrade, note);
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        renderCalendar();
        renderYearGrid();
        renderStats();
        renderToday();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
    });
}

// ===== Export/Import =====
function exportData() {
    const data = getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            const current = getData();
            // Merge imported data (imported overwrites conflicts)
            const merged = { ...current, ...imported };
            saveData(merged);
            renderToday();
            renderCalendar();
            renderYearGrid();
            renderStats();
            alert('Data imported successfully!');
        } catch (err) {
            alert('Error importing data. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

function shareYear() {
    const entries = getYearEntries(viewYear);
    const stats = calculateStats(entries);
    const avgInfo = gradeFromAverage(stats.average);

    const text = `My ${viewYear} Mood Summary 🎭\n\n` +
        `Average: ${avgInfo.letter} (${stats.average ? stats.average.toFixed(1) : '—'})\n` +
        `Total entries: ${stats.total}\n\n` +
        `A+: ${stats.counts[0]} | A: ${stats.counts[1]} | B: ${stats.counts[2]}\n` +
        `C: ${stats.counts[3]} | D: ${stats.counts[4]} | F: ${stats.counts[5]}`;

    if (navigator.share) {
        navigator.share({ title: 'My Mood Year', text });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('Summary copied to clipboard!');
        });
    }
}

// ===== Daily Reminder =====
const reminderToggle = document.getElementById('reminderToggle');
const reminderTime = document.getElementById('reminderTime');
const reminderTimeRow = document.getElementById('reminderTimeRow');

function getReminderSettings() {
    const settings = localStorage.getItem('reminderSettings');
    return settings ? JSON.parse(settings) : { enabled: false, time: '20:00' };
}

function saveReminderSettings(enabled, time) {
    localStorage.setItem('reminderSettings', JSON.stringify({ enabled, time }));
}

function updateReminderUI() {
    const settings = getReminderSettings();
    reminderToggle.checked = settings.enabled;
    reminderTime.value = settings.time;
    reminderTimeRow.classList.toggle('hidden', !settings.enabled);
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('This browser does not support notifications.');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        alert('Notifications are blocked. Please enable them in your browser settings.');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        // Try service worker notification first (works better on mobile)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body,
                    icon: 'icons/icon-192.png',
                    badge: 'icons/icon-192.png',
                    tag: 'mood-reminder',
                    renotify: true
                });
            });
        } else {
            // Fallback to regular notification
            new Notification(title, {
                body,
                icon: 'icons/icon-192.png'
            });
        }
    }
}

function checkAndShowReminder() {
    const settings = getReminderSettings();
    if (!settings.enabled) return;

    const today = getTodayStr();
    const todayMood = getMood(today);

    // If already logged today, no reminder needed
    if (todayMood) return;

    const now = new Date();
    const [reminderHour, reminderMin] = settings.time.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const reminderMinutes = reminderHour * 60 + reminderMin;

    // Check if it's past reminder time
    if (currentMinutes >= reminderMinutes) {
        // Check if we already showed reminder today
        const lastReminder = localStorage.getItem('lastReminderDate');
        if (lastReminder !== today) {
            localStorage.setItem('lastReminderDate', today);
            showNotification('Mood Tracker', "Don't forget to log your mood today! 🎭");
        }
    }
}

function scheduleNextReminder() {
    const settings = getReminderSettings();
    if (!settings.enabled) return;

    const now = new Date();
    const [reminderHour, reminderMin] = settings.time.split(':').map(Number);

    const reminderDate = new Date();
    reminderDate.setHours(reminderHour, reminderMin, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (reminderDate <= now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
    }

    const msUntilReminder = reminderDate - now;

    // Only schedule if within 24 hours (JS timeout limit)
    if (msUntilReminder > 0 && msUntilReminder < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
            const todayMood = getMood(getTodayStr());
            if (!todayMood) {
                showNotification('Mood Tracker', "Time to log your mood! 🎭");
            }
            // Schedule next one
            scheduleNextReminder();
        }, msUntilReminder);
    }
}

async function handleReminderToggle() {
    if (reminderToggle.checked) {
        const granted = await requestNotificationPermission();
        if (!granted) {
            reminderToggle.checked = false;
            return;
        }
    }

    saveReminderSettings(reminderToggle.checked, reminderTime.value);
    updateReminderUI();

    if (reminderToggle.checked) {
        scheduleNextReminder();
    }
}

function handleReminderTimeChange() {
    saveReminderSettings(reminderToggle.checked, reminderTime.value);
    scheduleNextReminder();
}

// ===== Initialize =====
function init() {
    renderToday();
    renderCalendar();
    renderStats();

    // Mood button clicks
    moodButtons.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => handleMoodClick(parseInt(btn.dataset.grade)));
    });

    // Note input
    noteInput.addEventListener('change', handleNoteChange);
    noteInput.addEventListener('blur', handleNoteChange);

    // View toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Month navigation
    prevMonthBtn.addEventListener('click', () => {
        viewMonth--;
        if (viewMonth < 0) {
            viewMonth = 11;
            viewYear--;
            yearDisplay.textContent = viewYear;
        }
        renderCalendar();
        renderStats();
    });

    nextMonthBtn.addEventListener('click', () => {
        viewMonth++;
        if (viewMonth > 11) {
            viewMonth = 0;
            viewYear++;
            yearDisplay.textContent = viewYear;
        }
        renderCalendar();
        renderStats();
    });

    // Action buttons
    shareBtn.addEventListener('click', shareYear);
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importData(e.target.files[0]);
            e.target.value = '';
        }
    });

    // Daily reminder
    updateReminderUI();
    reminderToggle.addEventListener('change', handleReminderToggle);
    reminderTime.addEventListener('change', handleReminderTimeChange);

    // Check for reminder on app open
    checkAndShowReminder();
    scheduleNextReminder();
}

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed:', err));
}

// Start app
document.addEventListener('DOMContentLoaded', init);
