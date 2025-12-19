// --- State Management ---
const defaultState = {
    habits: [],
    journal: [],
    xp: 0,
    level: 1,
    theme: 'dark', // 'dark' or 'light'
    user: 'User',
    isAuthenticated: false,
    occasions: [] // { id, date: 'YYYY-MM-DD', title, color }
};

let state = loadState();
let currentCalendarDate = new Date();
let selectedDate = new Date().toISOString().split('T')[0]; // Default select today
let isSignupMode = false;


// --- DOM Elements ---
// Auth
const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');
const authForm = document.getElementById('auth-form');
const authNameInput = document.getElementById('auth-name');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const nameGroup = document.getElementById('name-group');

// Views
const views = {
    dashboard: document.getElementById('dashboard-view'),
    journal: document.getElementById('journal-view'),
    analytics: document.getElementById('analytics-view'),
    calendar: document.getElementById('calendar-view')
};

// Analytics Elements
const weeklyChart = document.getElementById('weekly-chart');
const weeklyLabels = document.getElementById('weekly-labels');
const completionRateEl = document.getElementById('completion-rate');
const bestDayEl = document.getElementById('best-day');

// Calendar Elements
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const occasionsDisplay = document.getElementById('occasions-display');
const occasionModal = document.getElementById('occasion-modal');
const occasionTitleInput = document.getElementById('occasion-title');
const colorSelector = document.getElementById('color-selector');
const saveOccasionBtn = document.getElementById('save-occasion-btn');


// Nav
const navLinks = document.querySelectorAll('.nav-links li');
const themeToggle = document.getElementById('theme-toggle');

// Dashboard Elements
const habitsList = document.getElementById('habits-list');
const totalCompletedEl = document.getElementById('total-completed');
const currentStreakEl = document.getElementById('current-streak');
const userLevelEl = document.getElementById('user-level');
const currentXpEl = document.getElementById('current-xp');
const nextLevelXpEl = document.getElementById('next-level-xp');
const xpBarFill = document.querySelector('.xp-bar-fill');
const greetingText = document.getElementById('greeting-text');

// Modals
const habitModal = document.getElementById('habit-modal');
const journalModal = document.getElementById('journal-modal');
const closeButtons = document.querySelectorAll('.close-modal');

// Buttons
const addHabitBtn = document.getElementById('add-habit-btn');
const newEntryBtn = document.getElementById('new-entry-btn');
const saveHabitBtn = document.getElementById('save-habit-btn');
const saveJournalBtn = document.getElementById('save-journal-btn');

// Form Inputs
const habitNameInput = document.getElementById('habit-name');
const iconSelector = document.getElementById('icon-selector');
const journalTitleInput = document.getElementById('journal-title');
const journalContentInput = document.getElementById('journal-content');
const moodSelector = document.getElementById('mood-selector');
const journalList = document.getElementById('journal-list');

// --- Initialization ---

init();

function init() {
    applyTheme(state.theme);

    if (state.isAuthenticated) {
        showApp();
    } else {
        showAuth();
    }
}

function showApp() {
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';

    renderDashboard();
    renderJournal();
    renderAnalytics();
    renderCalendar();
    updateOccasionsDisplay(selectedDate);
    setupEventListeners();
    updateGreeting();
}

function showAuth() {
    authContainer.style.display = 'flex';
    dashboardContainer.style.display = 'none';
}

// --- Auth Functions ---

window.handleAuth = () => {
    if (isSignupMode) {
        // Sign Up
        const name = authNameInput.value.trim();
        if (!name) {
            alert("Please enter your name");
            return;
        }
        state.user = name;
        state.isAuthenticated = true;
        saveState();
        showApp();
    } else {
        // Sign In
        // For local demo, we just accept any "password" if they click Sign In
        // If they have a saved name, we use it, otherwise keep 'User' or ask.
        // Let's pretend we validated credentials.
        state.isAuthenticated = true;

        // If they never set a name (cleared cache?), maybe ask for it?
        // simple:
        saveState();
        showApp();
    }
}

window.toggleAuthMode = () => {
    isSignupMode = !isSignupMode;
    if (isSignupMode) {
        authTitle.innerText = "Create Account";
        authSubtitle.innerText = "Start your journey with Habitix today.";
        authSubmitBtn.innerText = "Sign Up";
        authSwitchText.innerHTML = 'Already have an account? <a href="#" onclick="toggleAuthMode()">Sign In</a>';
        nameGroup.style.display = 'block';
    } else {
        authTitle.innerText = "Welcome Back";
        authSubtitle.innerText = "Enter your details to access your account.";
        authSubmitBtn.innerText = "Sign In";
        authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleAuthMode()">Sign Up</a>';
        nameGroup.style.display = 'none';
    }
}

window.logout = () => {
    state.isAuthenticated = false;
    saveState();
    location.reload(); // Simple reload to reset view
}


// --- Logic & Functions ---

function loadState() {
    const stored = localStorage.getItem('habitixApp');
    return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
}

function saveState() {
    localStorage.setItem('habitixApp', JSON.stringify(state));
    renderDashboard(); // Re-render to update stats
    renderAnalytics(); // Update analytics real-time
    renderCalendar(); // Re-render calendar markers
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-body');
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'ph-fill ph-moon' : 'ph-fill ph-sun';
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    saveState();
}

function getNextLevelXp(level) {
    return level * 100;
}

function addXp(amount) {
    state.xp += amount;
    const nextLvl = getNextLevelXp(state.level);

    if (state.xp >= nextLvl) {
        state.level++;
        state.xp -= nextLvl;
        showToast(`Level Up! You are now Level ${state.level}`);
    }
    saveState();
}

function updateGreeting() {
    const hour = new Date().getHours();
    let text = 'Good Morning';
    if (hour >= 12 && hour < 18) text = 'Good Afternoon';
    else if (hour >= 18) text = 'Good Evening';
    greetingText.innerText = `${text}, ${state.user}`;
}

// --- Rendering ---

function renderDashboard() {
    // Habits Render
    habitsList.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];

    // Sort habits: Completed at bottom
    const sortedHabits = [...state.habits].sort((a, b) => {
        const aCompleted = a.datesCompleted.includes(today);
        const bCompleted = b.datesCompleted.includes(today);
        return aCompleted === bCompleted ? 0 : aCompleted ? 1 : -1;
    });

    if (sortedHabits.length === 0) {
        habitsList.innerHTML = '<div class="empty-state">No habits yet. Start by adding one!</div>';
    } else {
        sortedHabits.forEach(habit => {
            const isCompleted = habit.datesCompleted.includes(today);
            const div = document.createElement('div');
            div.className = 'habit-item';
            div.innerHTML = `
                <div class="habit-info">
                    <div class="habit-icon">
                        <i class="${habit.icon}"></i>
                    </div>
                    <div class="habit-text">
                        <h4>${habit.name}</h4>
                        <span class="streak-count">🔥 ${calculateStreak(habit)} Day Streak</span>
                    </div>
                </div>
                <button class="check-btn ${isCompleted ? 'completed' : ''}" onclick="toggleHabit('${habit.id}')">
                    <i class="ph-bold ph-check"></i>
                </button>
            `;
            habitsList.appendChild(div);
        });
    }

    // Stats Render
    // Total Completed: Count total check-ins across all history
    const totalCheckins = state.habits.reduce((acc, h) => acc + h.datesCompleted.length, 0);
    totalCompletedEl.innerText = totalCheckins;

    // Current Streak: Max streak among all habits
    const maxStreak = state.habits.reduce((max, h) => Math.max(max, calculateStreak(h)), 0);
    currentStreakEl.innerText = `${maxStreak} Days`;

    // XP & Level
    userLevelEl.innerText = state.level;
    currentXpEl.innerText = state.xp;
    const totalXpNeeded = getNextLevelXp(state.level);
    nextLevelXpEl.innerText = totalXpNeeded;
    const progressPerc = (state.xp / totalXpNeeded) * 100;
    xpBarFill.style.width = `${progressPerc}%`;
}

function renderAnalytics() {
    if (!weeklyChart) return;
    weeklyChart.innerHTML = '';
    weeklyLabels.innerHTML = '';

    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    let totalPossible = 0;
    let totalDone = 0;
    let bestDayName = '-';
    let maxDone = -1;

    days.forEach(date => {
        // Find habits active on this day (simplified: all current habits assumed active)
        const possible = state.habits.length;
        const done = state.habits.filter(h => h.datesCompleted.includes(date)).length;

        totalPossible += possible;
        totalDone += done;

        // Best Day Calc
        if (done > maxDone && done > 0) {
            maxDone = done;
            bestDayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        }

        const percent = possible > 0 ? (done / possible) * 100 : 0;

        // Render Bar
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';

        const bar = document.createElement('div');
        bar.className = `chart-bar ${percent > 0 ? 'filled' : ''}`;
        bar.style.height = `${percent}%`;

        // Tooltip
        bar.innerHTML = `<div class="tooltip">${done}/${possible}</div>`;

        const label = document.createElement('div');
        label.className = 'chart-label';
        label.innerText = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

        barContainer.appendChild(bar);
        weeklyChart.appendChild(barContainer);
        weeklyLabels.appendChild(label);
    });

    // Stats
    const rate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
    completionRateEl.innerText = `${rate}%`;
    bestDayEl.innerText = bestDayName;
}

function renderJournal() {
    journalList.innerHTML = '';

    // Recent first
    const sortedEntries = [...state.journal].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedEntries.length === 0) {
        journalList.innerHTML = '<p class="text-secondary" style="grid-column: 1/-1; text-align:center;">No entries yet.</p>';
        return;
    }

    sortedEntries.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'journal-card';
        card.onclick = () => openJournalEntry(entry.id);

        const moodEmoji = getMoodEmoji(entry.mood);
        const dateStr = new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <span class="journal-date">${dateStr}</span>
                <span>${moodEmoji}</span>
            </div>
            <h3>${entry.title}</h3>
            <div class="journal-preview">${entry.content}</div>
        `;
        journalList.appendChild(card);
    });
}

function renderCalendar() {
    calendarGrid.innerHTML = '';
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    currentMonthYear.innerText = currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    // Previous month padding
    for (let i = firstDayIndex; i > 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.innerText = prevLastDay - i + 1;
        calendarGrid.appendChild(dayDiv);
    }

    // Current month days
    for (let i = 1; i <= lastDay; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        if (dateStr === new Date().toISOString().split('T')[0]) dayDiv.classList.add('today');
        if (dateStr === selectedDate) dayDiv.classList.add('selected');

        dayDiv.onclick = () => {
            selectedDate = dateStr;
            renderCalendar();
            updateOccasionsDisplay(dateStr);
        };

        dayDiv.innerText = i;

        // Check for occasions
        const dayOccasions = state.occasions ? state.occasions.filter(o => o.date === dateStr) : [];
        if (dayOccasions.length > 0) {
            const dot = document.createElement('div');
            dot.className = 'occasion-dot';
            if (dayOccasions.length === 1) dot.style.backgroundColor = dayOccasions[0].color;
            dayDiv.appendChild(dot);
        }

        calendarGrid.appendChild(dayDiv);
    }

    // Next month padding (to fill 42 grid cells usually, but flex handles it)
}

function updateOccasionsDisplay(dateStr) {
    occasionsDisplay.innerHTML = '';

    // Header
    const prettyDate = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '1rem';
    header.innerHTML = `<h3>${prettyDate}</h3> <button class="btn btn-primary btn-sm" onclick="openOccasionModal()"><i class="ph-bold ph-plus"></i> Add Occasion</button>`;
    occasionsDisplay.appendChild(header);

    const dayOccasions = state.occasions ? state.occasions.filter(o => o.date === dateStr) : [];

    if (dayOccasions.length === 0) {
        occasionsDisplay.innerHTML += '<p class="text-secondary">No occasions for this day.</p>';
    } else {
        dayOccasions.forEach(occ => {
            const div = document.createElement('div');
            div.className = 'occasion-item';
            div.innerHTML = `
                <div class="occasion-badge" style="background-color: ${occ.color}"></div>
                <span>${occ.title}</span>
                <button onclick="deleteOccasion('${occ.id}')" style="margin-left:auto; background:none; border:none; cursor:pointer; color:var(--text-secondary);"><i class="ph ph-trash"></i></button>
            `;
            occasionsDisplay.appendChild(div);
        });
    }
}

function getMoodEmoji(mood) {
    const map = { happy: '😊', neutral: '😐', sad: '😔', tired: '😴', excited: '🤩' };
    return map[mood] || '😐';
}

function calculateStreak(habit) {
    if (!habit.datesCompleted || habit.datesCompleted.length === 0) return 0;

    const dates = [...habit.datesCompleted].sort().reverse();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if the most recent completion is today or yesterday
    const lastDate = new Date(dates[0]);
    lastDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) return 0; // Streak broken

    let streak = 0;
    let expectedDate = lastDate;

    for (const dateStr of dates) {
        const current = new Date(dateStr);
        current.setHours(0, 0, 0, 0);

        if (current.getTime() === expectedDate.getTime()) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else if (current.getTime() < expectedDate.getTime()) {
            // Gap found (e.g. today, then 3 days ago)
            break;
        }
        // If current > expected, it means duplicate execution/sorting issue, ignore
    }
    return streak;
}

// --- Actions ---

window.toggleHabit = (id) => {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    const today = new Date().toISOString().split('T')[0];
    const index = habit.datesCompleted.indexOf(today);

    if (index > -1) {
        // Uncheck
        habit.datesCompleted.splice(index, 1);
        // Remove XP (optional mechanism, usually we just keep it, but let's be strict)
    } else {
        // Check
        habit.datesCompleted.push(today);
        addXp(10); // 10 XP per habit
        triggerConfetti(window.event.clientX, window.event.clientY);
    }
    saveState();
};

function createHabit() {
    const name = habitNameInput.value.trim();
    if (!name) return;

    const selectedIconBtn = iconSelector.querySelector('.selected');
    const icon = selectedIconBtn ? selectedIconBtn.dataset.icon : 'ph-check';

    const newHabit = {
        id: Date.now().toString(),
        name,
        icon: 'ph-fill ' + icon.replace('ph-', ''), // fix to ensure proper class
        datesCompleted: [],
        created: new Date().toISOString()
    };

    state.habits.push(newHabit);
    saveState();
    closeAllModals();
    habitNameInput.value = '';
    showToast('Habit Created!');
}

function saveJournalEntry() {
    const title = journalTitleInput.value.trim() || 'Untitled';
    const content = journalContentInput.value.trim();
    if (!content) return;

    const moodBtn = moodSelector.querySelector('.selected');
    const mood = moodBtn ? moodBtn.dataset.mood : 'neutral';

    const newEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        title,
        content,
        mood
    };

    state.journal.push(newEntry);
    addXp(20); // 20 XP for journaling
    saveState();
    renderJournal();
    closeAllModals();

    // Reset form
    journalTitleInput.value = '';
    journalContentInput.value = '';
    showToast('Journal Entry Saved!');
}

function openJournalEntry(id) {
    const entry = state.journal.find(e => e.id === id);
    if (!entry) return;

    // Reuse modal for viewing
    // In a real app complexity, we'd have a separate View Modal
    journalModal.classList.add('open');

    // Populate fields
    journalTitleInput.value = entry.title;
    journalContentInput.value = entry.content;

    // Set mood
    moodSelector.querySelectorAll('button').forEach(b => {
        b.classList.remove('selected');
        if (b.dataset.mood === entry.mood) b.classList.add('selected');
    });

    // Make inputs readonly-ish or just clearly editable (Auto-save not implemented)
    // For simplicity, we allow "editing" but the Save button creates a NEW entry currently.
    // Let's change the Save button to "Update" or just hide it
    saveJournalBtn.innerText = "Close (View Only)";
    saveJournalBtn.onclick = () => {
        closeAllModals();
        // Reset button
        setTimeout(() => {
            saveJournalBtn.innerText = "Save Entry";
            saveJournalBtn.onclick = saveJournalEntry;
            journalTitleInput.value = '';
            journalContentInput.value = '';
        }, 500);
    };
}

window.openOccasionModal = () => {
    occasionModal.classList.add('open');
};

function saveOccasion() {
    const title = occasionTitleInput.value.trim();
    if (!title) return;

    const colorBtn = colorSelector.querySelector('.selected');
    const color = colorBtn ? colorBtn.dataset.color : '#3b82f6';

    if (!state.occasions) state.occasions = []; // Ensure array exists

    state.occasions.push({
        id: Date.now().toString(),
        date: selectedDate,
        title,
        color
    });

    saveState();
    closeAllModals();
    occasionTitleInput.value = '';
    renderCalendar();
    updateOccasionsDisplay(selectedDate);
    showToast('Occasion Added!');
}

window.deleteOccasion = (id) => {
    if (!state.occasions) return;
    state.occasions = state.occasions.filter(o => o.id !== id);
    saveState();
    renderCalendar();
    updateOccasionsDisplay(selectedDate);
}

// --- Event Listeners ---

function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Hide all views
            Object.values(views).forEach(v => v.classList.remove('active'));
            // Show target view
            views[link.dataset.tab].classList.add('active');
        });
    });

    themeToggle.addEventListener('click', toggleTheme);

    // Calendar Nav
    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    // Modals
    addHabitBtn.addEventListener('click', () => {
        habitModal.classList.add('open');
    });

    newEntryBtn.addEventListener('click', () => {
        journalModal.classList.add('open');
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Form logic
    saveHabitBtn.addEventListener('click', createHabit);
    saveJournalBtn.addEventListener('click', saveJournalEntry);
    saveOccasionBtn.addEventListener('click', saveOccasion);

    iconSelector.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            iconSelector.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    moodSelector.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            moodSelector.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    if (colorSelector) {
        colorSelector.querySelectorAll('.icon-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                colorSelector.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }
}


function closeAllModals() {
    habitModal.classList.remove('open');
    journalModal.classList.remove('open');
    occasionModal.classList.remove('open');
}

// Toast
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Simple Confetti Effect (Visual Polish)
function triggerConfetti(x, y) {
    // A placeholder for a particle effect using emojis maybe?
    // Keeping it simple for Vanilla JS without canvas
}
