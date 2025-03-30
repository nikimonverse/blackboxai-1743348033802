// Shared functionality across all pages
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dark mode if set
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
        document.getElementById('dark-mode-toggle')?.checked = true;
    }
    
    // Load sample data if none exists
    initializeSampleData();
    
    // Set up dark mode toggle
    document.getElementById('dark-mode-toggle')?.addEventListener('change', toggleDarkMode);
    
    // Set up notification test button
    document.getElementById('test-notification')?.addEventListener('click', testNotification);
    
    // Set up data management buttons
    document.getElementById('export-data')?.addEventListener('click', exportData);
    document.getElementById('import-data')?.addEventListener('click', () => document.getElementById('data-import-input')?.click());
    document.getElementById('reset-data')?.addEventListener('click', confirmResetData);
    
    // Set up confirmation modal
    document.getElementById('confirm-cancel')?.addEventListener('click', closeConfirmModal);
    
    // Initialize pages
    if (document.getElementById('task-list')) {
        initializeTaskPage();
    }
    if (document.getElementById('schedule-grid')) {
        initializeSchedulePage();
    }
});

// Data initialization
function initializeSampleData() {
    if (!localStorage.getItem('tasks')) {
        const sampleTasks = [
            {
                id: Date.now(),
                title: 'Complete math assignment',
                priority: 'high',
                dueDate: new Date().toISOString().split('T')[0],
                completed: false
            },
            {
                id: Date.now() + 1,
                title: 'Read history chapter 5',
                priority: 'medium',
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                completed: false
            }
        ];
        localStorage.setItem('tasks', JSON.stringify(sampleTasks));
    }

    if (!localStorage.getItem('schedule')) {
        const sampleSchedule = {
            monday: [
                { time: '09:00', subject: 'Mathematics', type: 'lecture' }
            ],
            tuesday: [],
            wednesday: [
                { time: '11:00', subject: 'History', type: 'seminar' }
            ],
            thursday: [],
            friday: [
                { time: '14:00', subject: 'Science Lab', type: 'lab' }
            ],
            saturday: [],
            sunday: []
        };
        localStorage.setItem('schedule', JSON.stringify(sampleSchedule));
    }
}

// Dark mode functionality
function toggleDarkMode() {
    const isDarkMode = document.getElementById('dark-mode-toggle').checked;
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
}

// Notification functionality
function testNotification() {
    if (Notification.permission === 'granted') {
        new Notification('Study Planner', {
            body: 'This is a test notification!',
            icon: '/favicon.ico'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                testNotification();
            }
        });
    }
}

// Data management functions
function exportData() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const schedule = JSON.parse(localStorage.getItem('schedule') || '{}');
    const data = { tasks, schedule };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.tasks && data.schedule) {
                localStorage.setItem('tasks', JSON.stringify(data.tasks));
                localStorage.setItem('schedule', JSON.stringify(data.schedule));
                showToast('Data imported successfully', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Invalid data format', 'error');
            }
        } catch (error) {
            showToast('Error importing data', 'error');
        }
    };
    reader.readAsText(file);
}

function confirmResetData() {
    showConfirmModal(
        'Reset All Data',
        'This will permanently delete all your tasks and schedule. Are you sure?',
        () => {
            localStorage.removeItem('tasks');
            localStorage.removeItem('schedule');
            initializeSampleData();
            showToast('Data reset successfully', 'success');
            setTimeout(() => location.reload(), 1000);
        }
    );
}

// Modal functions
function showConfirmModal(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-ok').onclick = () => {
        callback();
        closeConfirmModal();
    };
    document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
}

// Task page functions
function initializeTaskPage() {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const taskTemplate = document.getElementById('task-template');
    
    // Load and render tasks
    renderTasks();
    
    // Add new task
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-input').value.trim();
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;
        
        if (title) {
            addTask(title, priority, dueDate);
            taskForm.reset();
        }
    });
    
    // Filter buttons
    document.getElementById('filter-all').addEventListener('click', () => renderTasks('all'));
    document.getElementById('filter-active').addEventListener('click', () => renderTasks('active'));
    document.getElementById('filter-completed').addEventListener('click', () => renderTasks('completed'));
    document.getElementById('priority-filter').addEventListener('change', (e) => renderTasks('all', e.target.value));
}

function addTask(title, priority, dueDate) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.push({
        id: Date.now(),
        title,
        priority,
        dueDate: dueDate || null,
        completed: false
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
    showToast('Task added successfully', 'success');
}

function renderTasks(filter = 'all', priorityFilter = 'all') {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskList = document.getElementById('task-list');
    const taskTemplate = document.getElementById('task-template');
    
    taskList.innerHTML = '';
    
    const filteredTasks = tasks.filter(task => {
        const matchesFilter = filter === 'all' || 
                            (filter === 'active' && !task.completed) || 
                            (filter === 'completed' && task.completed);
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchesFilter && matchesPriority;
    });
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<div class="p-4 text-center text-gray-500">No tasks found</div>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = taskTemplate.content.cloneNode(true);
        const taskItem = taskElement.querySelector('.task-item');
        
        // Set priority class
        taskItem.classList.add(`priority-${task.priority}`);
        
        // Set task content
        taskElement.querySelector('.task-title').textContent = task.title;
        taskElement.querySelector('.priority-badge').textContent = task.priority;
        taskElement.querySelector('.priority-badge').classList.add(
            task.priority === 'high' ? 'bg-red-100 text-red-800' :
            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
        );
        
        if (task.dueDate) {
            taskElement.querySelector('.due-date').textContent = formatDate(task.dueDate);
        } else {
            taskElement.querySelector('.due-date').textContent = 'No due date';
        }
        
        // Set completed state
        if (task.completed) {
            taskElement.querySelector('.complete-btn i').className = 'fas fa-check-circle text-green-500';
            taskElement.querySelector('.task-title').classList.add('line-through', 'text-gray-400');
        }
        
        // Add event listeners
        taskElement.querySelector('.complete-btn').addEventListener('click', () => toggleTaskComplete(task.id));
        taskElement.querySelector('.edit-btn').addEventListener('click', () => editTask(task.id));
        taskElement.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
        
        taskList.appendChild(taskElement);
    });
}

function toggleTaskComplete(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }
}

function deleteTask(taskId) {
    showConfirmModal(
        'Delete Task',
        'Are you sure you want to delete this task?',
        () => {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            localStorage.setItem('tasks', JSON.stringify(updatedTasks));
            renderTasks();
            showToast('Task deleted', 'success');
        }
    );
}

// Schedule page functions
function initializeSchedulePage() {
    const addEventBtn = document.getElementById('add-event-btn');
    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const cancelEventBtn = document.getElementById('cancel-event');
    
    // Render schedule
    renderSchedule();
    
    // Event modal handling
    addEventBtn.addEventListener('click', () => {
        eventModal.classList.remove('hidden');
    });
    
    cancelEventBtn.addEventListener('click', () => {
        eventModal.classList.add('hidden');
        eventForm.reset();
    });
    
    // Add new event
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(eventForm);
        const event = {
            subject: formData.get('subject'),
            day: formData.get('day'),
            time: formData.get('time'),
            type: formData.get('type')
        };
        
        addEvent(event);
        eventForm.reset();
        eventModal.classList.add('hidden');
    });
}

function renderSchedule() {
    const schedule = JSON.parse(localStorage.getItem('schedule') || '{}');
    const scheduleGrid = document.getElementById('schedule-grid');
    
    // Clear existing content
    scheduleGrid.innerHTML = '';
    
    // Create time slots for each day
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeSlots = [];
    
    // Generate time slots from 8AM to 8PM
    for (let hour = 8; hour <= 20; hour++) {
        timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    // Create grid cells
    days.forEach(day => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'divide-y divide-gray-200';
        
        timeSlots.forEach(time => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'p-2 h-16 border-b border-gray-200';
            timeSlot.dataset.day = day;
            timeSlot.dataset.time = time;
            
            // Find event for this time slot
            const event = schedule[day]?.find(e => e.time === time);
            if (event) {
                timeSlot.innerHTML = `
                    <div class="event p-1 rounded text-white text-xs truncate ${getEventTypeClass(event.type)}">
                        ${event.subject}
                    </div>
                `;
            }
            
            dayColumn.appendChild(timeSlot);
        });
        
        scheduleGrid.appendChild(dayColumn);
    });
}

function addEvent(event) {
    const schedule = JSON.parse(localStorage.getItem('schedule') || '{}');
    
    if (!schedule[event.day]) {
        schedule[event.day] = [];
    }
    
    schedule[event.day].push({
        time: event.time,
        subject: event.subject,
        type: event.type
    });
    
    // Sort events by time
    schedule[event.day].sort((a, b) => a.time.localeCompare(b.time));
    
    localStorage.setItem('schedule', JSON.stringify(schedule));
    renderSchedule();
    showToast('Event added successfully', 'success');
}

function getEventTypeClass(type) {
    return type === 'lecture' ? 'bg-blue-500' :
           type === 'seminar' ? 'bg-purple-500' :
           type === 'lab' ? 'bg-green-500' : 'bg-yellow-500';
}

// Utility functions
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg text-white ${
        type === 'error' ? 'bg-red-500' : 
        type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}