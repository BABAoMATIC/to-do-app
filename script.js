// To-Do List App JavaScript

class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.taskIdCounter = this.getNextId();
        this.alarmCheckInterval = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
        this.startAlarmChecker();
    }
    
    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.taskCount = document.getElementById('taskCount');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        // Date/Time elements
        this.datetimeToggle = document.getElementById('datetimeToggle');
        this.datetimeSection = document.getElementById('datetimeSection');
        this.taskDate = document.getElementById('taskDate');
        this.taskTime = document.getElementById('taskTime');
        this.alarmToggle = document.getElementById('alarmToggle');
    }
    
    bindEvents() {
        // Add task events
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        // Date/Time toggle event
        this.datetimeToggle.addEventListener('change', () => {
            this.toggleDateTimeSection();
        });
        
        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Task list events (delegation)
        this.taskList.addEventListener('click', (e) => {
            if (e.target.classList.contains('complete-btn')) {
                this.toggleTask(e.target.closest('.task-item').dataset.id);
            } else if (e.target.classList.contains('delete-btn')) {
                this.deleteTask(e.target.closest('.task-item').dataset.id);
            } else if (e.target.classList.contains('task-text')) {
                this.toggleTask(e.target.closest('.task-item').dataset.id);
            }
        });
    }
    
    addTask() {
        const text = this.taskInput.value.trim();
        
        if (text === '') {
            this.showMessage('Please enter a task!', 'error');
            return;
        }
        
        if (text.length > 100) {
            this.showMessage('Task is too long! Maximum 100 characters.', 'error');
            return;
        }
        
        const task = {
            id: this.taskIdCounter++,
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Add date/time if enabled
        if (this.datetimeToggle.checked) {
            const date = this.taskDate.value;
            const time = this.taskTime.value;
            
            if (date && time) {
                task.dueDate = date;
                task.dueTime = time;
                task.hasAlarm = this.alarmToggle.checked;
                
                // Validate date/time is not in the past
                const dueDateTime = new Date(`${date}T${time}`);
                if (dueDateTime < new Date()) {
                    this.showMessage('Date and time cannot be in the past!', 'error');
                    return;
                }
            } else {
                this.showMessage('Please select both date and time!', 'error');
                return;
            }
        }
        
        this.tasks.unshift(task); // Add to beginning
        this.taskInput.value = '';
        this.clearDateTimeInputs();
        this.saveTasks();
        this.render();
        this.showMessage('Task added successfully!', 'success');
    }
    
    toggleTask(id) {
        const task = this.tasks.find(t => t.id == id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }
    
    deleteTask(id) {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id != id);
                this.saveTasks();
                this.render();
            }, 300);
        }
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.render();
    }
    
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return this.tasks;
        }
    }
    
    render() {
        const filteredTasks = this.getFilteredTasks();
        
        // Clear current tasks
        this.taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            this.renderEmptyState();
        } else {
            filteredTasks.forEach(task => {
                this.renderTask(task);
            });
        }
        
        this.updateTaskCount();
    }
    
    renderTask(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        
        let datetimeHtml = '';
        if (task.dueDate && task.dueTime) {
            const formattedDate = this.formatDate(task.dueDate);
            const formattedTime = this.formatTime(task.dueTime);
            
            datetimeHtml = `
                <div class="task-datetime">
                    <div class="task-date">📅 ${formattedDate}</div>
                    <div class="task-time">🕐 ${formattedTime}</div>
                    ${task.hasAlarm ? '<div class="task-alarm">Alarm Set</div>' : ''}
                </div>
            `;
        }
        
        li.innerHTML = `
            <div class="task-content">
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                ${datetimeHtml}
            </div>
            <div class="task-actions">
                <button class="task-btn complete-btn">
                    ${task.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="task-btn delete-btn">Delete</button>
            </div>
        `;
        
        this.taskList.appendChild(li);
    }
    
    renderEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        let message = '';
        switch (this.currentFilter) {
            case 'active':
                message = 'No active tasks!';
                break;
            case 'completed':
                message = 'No completed tasks!';
                break;
            default:
                message = 'No tasks yet!';
        }
        
        emptyState.innerHTML = `
            <h3>${message}</h3>
            <p>Add a new task to get started</p>
        `;
        
        this.taskList.appendChild(emptyState);
    }
    
    updateTaskCount() {
        const activeTasks = this.tasks.filter(task => !task.completed).length;
        const totalTasks = this.tasks.length;
        
        if (totalTasks === 0) {
            this.taskCount.textContent = 'No tasks';
        } else if (activeTasks === 0) {
            this.taskCount.textContent = 'All tasks completed! 🎉';
        } else {
            this.taskCount.textContent = `${activeTasks} of ${totalTasks} tasks remaining`;
        }
    }
    
    showMessage(message, type = 'info') {
        // Create temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                messageEl.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                break;
            case 'error':
                messageEl.style.background = 'linear-gradient(135deg, #dc3545, #e74c3c)';
                break;
            default:
                messageEl.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
        
        document.body.appendChild(messageEl);
        
        // Animate in
        setTimeout(() => {
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // LocalStorage methods
    saveTasks() {
        try {
            localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
            localStorage.setItem('todoTaskIdCounter', this.taskIdCounter.toString());
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showMessage('Error saving tasks!', 'error');
        }
    }
    
    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('todoTasks');
            const savedCounter = localStorage.getItem('todoTaskIdCounter');
            
            if (savedTasks) {
                this.taskIdCounter = savedCounter ? parseInt(savedCounter) : 1;
                return JSON.parse(savedTasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showMessage('Error loading tasks!', 'error');
        }
        
        return [];
    }
    
    getNextId() {
        if (this.tasks.length === 0) {
            return 1;
        }
        return Math.max(...this.tasks.map(t => t.id)) + 1;
    }
    
    // Date/Time methods
    toggleDateTimeSection() {
        if (this.datetimeToggle.checked) {
            this.datetimeSection.style.display = 'block';
            this.setDefaultDateTime();
        } else {
            this.datetimeSection.style.display = 'none';
            this.clearDateTimeInputs();
        }
    }
    
    setDefaultDateTime() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Set default date to tomorrow
        this.taskDate.value = tomorrow.toISOString().split('T')[0];
        
        // Set default time to 9:00 AM
        this.taskTime.value = '09:00';
    }
    
    clearDateTimeInputs() {
        this.taskDate.value = '';
        this.taskTime.value = '';
        this.alarmToggle.checked = false;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }
    
    // Alarm methods
    startAlarmChecker() {
        // Check for alarms every minute
        this.alarmCheckInterval = setInterval(() => {
            this.checkAlarms();
        }, 60000);
    }
    
    checkAlarms() {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const currentDate = now.toISOString().split('T')[0];
        
        this.tasks.forEach(task => {
            if (task.hasAlarm && 
                task.dueDate === currentDate && 
                task.dueTime === currentTime && 
                !task.completed && 
                !task.alarmTriggered) {
                
                this.triggerAlarm(task);
                task.alarmTriggered = true;
                this.saveTasks();
            }
        });
    }
    
    triggerAlarm(task) {
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            new Notification('Task Reminder', {
                body: `Time for: ${task.text}`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
                tag: `task-${task.id}`
            });
        }
        
        // Show in-app notification
        this.showMessage(`🔔 Reminder: ${task.text}`, 'alarm');
        
        // Play sound if available
        this.playAlarmSound();
        
        // Make the task item flash
        const taskElement = document.querySelector(`[data-id="${task.id}"]`);
        if (taskElement) {
            taskElement.style.animation = 'flash 1s ease-in-out 3';
        }
    }
    
    playAlarmSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio not available');
        }
    }
    
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    // Utility methods
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.render();
        this.showMessage(`Cleared ${completedCount} completed tasks!`, 'success');
    }
    
    clearAll() {
        if (this.tasks.length === 0) {
            this.showMessage('No tasks to clear!', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to delete all tasks?')) {
            this.tasks = [];
            this.taskIdCounter = 1;
            this.saveTasks();
            this.render();
            this.showMessage('All tasks cleared!', 'success');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new TodoApp();
    
    // Request notification permission
    app.requestNotificationPermission();
    
    // Add some helpful keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to add task
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            document.getElementById('addTaskBtn').click();
        }
        
        // Escape to clear input
        if (e.key === 'Escape') {
            document.getElementById('taskInput').value = '';
            document.getElementById('taskInput').blur();
        }
    });
    
    // Add focus to input on page load
    document.getElementById('taskInput').focus();
});
