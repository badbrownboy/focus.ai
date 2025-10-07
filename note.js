// Dynamic Checklist Functionality
class ChecklistManager {
    constructor() {
        this.tasks = [];
        this.taskIdCounter = 0;
        this.container = document.getElementById('checklistContainer');
        this.addBtn = document.getElementById('addBtn');
        
        this.init();
    }

    init() {
        // Load tasks from localStorage
        this.loadTasks();
        
        // Render initial state
        this.render();
        
        // Hide the add button since we always have an empty input
        this.addBtn.parentElement.style.display = 'none';
        
        // Initialize drag and drop for the container
        this.initializeDragContainer();
    }
    
    initializeDragContainer() {
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            // Clean up any remaining drag-over classes
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        });
    }

    addNewTask(taskText = '') {
        if (!taskText.trim()) return; // Don't add empty tasks
        
        // Check if we've reached the maximum limit of 8 tasks
        if (this.tasks.length >= 8) {
            this.showMaxTasksMessage();
            return;
        }
        
        const taskId = ++this.taskIdCounter;
        const newTask = {
            id: taskId,
            text: taskText,
            completed: false,
            priority: 'medium' // Default priority: low, medium, high, urgent
        };
        
        this.tasks.push(newTask);
        this.saveTasks();
        this.render();
        
        // Focus back on the empty input after a short delay
        setTimeout(() => {
            const emptyInput = document.querySelector('#empty-task-input');
            if (emptyInput) {
                emptyInput.focus();
            }
        }, 150);
    }

    showMaxTasksMessage() {
        // Create a temporary message element
        const message = document.createElement('div');
        message.className = 'max-tasks-message';
        message.innerHTML = '⚠️ Maximum 8 tasks reached. Complete or delete some tasks to add more.';
        
        // Insert after the container
        this.container.parentNode.insertBefore(message, this.container.nextSibling);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.render();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    updateTaskText(taskId, newText) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.text = newText;
            this.saveTasks();
            // Don't re-render on text updates to avoid losing focus
        }
    }

    render() {
        this.container.innerHTML = '';
        
        // Add or remove multi-column class based on task count
        if (this.tasks.length > 4) {
            this.container.classList.add('multi-column');
        } else {
            this.container.classList.remove('multi-column');
        }
        
        // Render existing tasks
        this.tasks.forEach((task, index) => {
            const taskElement = this.createTaskElement(task, index);
            this.container.appendChild(taskElement);
        });
        
        // Only show empty input if we haven't reached the limit of 8 tasks
        if (this.tasks.length < 8) {
            const emptyTaskElement = this.createEmptyTaskElement();
            this.container.appendChild(emptyTaskElement);
        } else {
            // Show a message when limit is reached
            const limitMessage = document.createElement('div');
            limitMessage.className = 'limit-reached-message';
            limitMessage.innerHTML = `
                <div class="limit-content">
                    <span class="limit-icon">🎯</span>
                    <div class="limit-text">
                        <strong>Maximum tasks reached (8/8)</strong>
                        <p>Complete or delete some tasks to add more</p>
                    </div>
                </div>
            `;
            this.container.appendChild(limitMessage);
        }
        
        // Clear any existing drag state
        this.draggedTaskId = null;
    }

    createTaskElement(task, index) {
        const div = document.createElement('div');
        div.className = `checklist-box${task.completed ? ' completed' : ''}`;
        div.style.animationDelay = `${index * 0.1}s`;
        div.draggable = true;
        div.dataset.taskId = task.id;
        
        div.innerHTML = `
            <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
            <div class="priority-container" data-task-id="${task.id}">
                <div class="priority-indicator ${task.priority || 'medium'}"></div>
                <div class="priority-tooltip">Task Level</div>
            </div>
            <input type="checkbox" id="task${task.id}" ${task.completed ? 'checked' : ''}>
            <label for="task${task.id}">
                <input 
                    type="text" 
                    class="task-input" 
                    id="task-input-${task.id}"
                    value="${task.text}" 
                    placeholder="Enter your task..."
                >
            </label>
            <button class="delete-btn" title="Delete task">×</button>
        `;

        // Add event listeners
        const checkbox = div.querySelector(`#task${task.id}`);
        const input = div.querySelector(`#task-input-${task.id}`);
        const deleteBtn = div.querySelector('.delete-btn');

        checkbox.addEventListener('change', () => {
            this.toggleTask(task.id);
        });

        input.addEventListener('input', (e) => {
            this.updateTaskText(task.id, e.target.value);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
                // Focus back to empty input instead of adding new task
                setTimeout(() => {
                    const emptyInput = document.querySelector('#empty-task-input');
                    if (emptyInput) {
                        emptyInput.focus();
                    }
                }, 100);
            }
        });

        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.deleteTask(task.id);
        });

        // Add priority container click event listener
        const priorityContainer = div.querySelector('.priority-container');
        priorityContainer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Priority container clicked for task:', task.id);
            this.showPrioritySelector(task.id, e.currentTarget);
        });

        // Add drag and drop event listeners
        this.addDragListeners(div);

        return div;
    }

    createEmptyTaskElement() {
        const div = document.createElement('div');
        div.className = 'checklist-box empty-task';
        div.style.animationDelay = `${this.tasks.length * 0.1}s`;
        
        div.innerHTML = `
            <input type="checkbox" disabled>
            <label>
                <input 
                    type="text" 
                    class="task-input empty-input" 
                    id="empty-task-input"
                    placeholder="Type a new task and press Enter..."
                >
            </label>
        `;

        // Add event listener for the empty input
        const input = div.querySelector('.empty-input');
        let isProcessing = false; // Prevent duplicate submissions
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim() && !isProcessing) {
                e.preventDefault();
                isProcessing = true;
                const taskText = input.value.trim();
                input.value = ''; // Clear immediately
                this.addNewTask(taskText);
                setTimeout(() => { isProcessing = false; }, 100);
            }
        });

        // Remove blur event to prevent double-adding tasks

        return div;
    }

    addDragListeners(element) {
        element.addEventListener('dragstart', (e) => {
            this.draggedTaskId = element.dataset.taskId;
            this.draggedElement = element;
            element.classList.add('dragging');
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.draggedTaskId);
            console.log('Drag started:', this.draggedTaskId);
        });

        element.addEventListener('dragend', (e) => {
            console.log('Drag ended');
            element.classList.remove('dragging');
            this.draggedTaskId = null;
            this.draggedElement = null;
            
            // Clean up all drag classes
            document.querySelectorAll('.drag-over, .swapping-out, .swapping-in, .fading-out, .fading-in').forEach(el => {
                el.classList.remove('drag-over', 'swapping-out', 'swapping-in', 'fading-out', 'fading-in');
                el.style.transform = '';
            });
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (this.draggedTaskId && element.dataset.taskId !== this.draggedTaskId) {
                // Remove drag-over from all elements first
                document.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
                element.classList.add('drag-over');
            }
        });

        element.addEventListener('dragleave', (e) => {
            if (!element.contains(e.relatedTarget)) {
                element.classList.remove('drag-over');
            }
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            console.log('Drop detected');
            
            if (this.draggedTaskId && element.dataset.taskId !== this.draggedTaskId) {
                const targetTaskId = element.dataset.taskId;
                console.log('Swapping:', this.draggedTaskId, 'with', targetTaskId);
                
                // Immediate swap without complex animation for now
                this.reorderTasks(this.draggedTaskId, targetTaskId);
            }
            
            // Clean up drag classes
            element.classList.remove('drag-over');
        });
    }

    reorderTasks(draggedTaskId, targetTaskId) {
        console.log('Reordering tasks:', draggedTaskId, 'with', targetTaskId);
        
        const draggedIndex = this.tasks.findIndex(task => task.id == draggedTaskId);
        const targetIndex = this.tasks.findIndex(task => task.id == targetTaskId);
        
        console.log('Indices:', draggedIndex, targetIndex);
        
        if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
            console.log('Invalid swap');
            return;
        }
        
        // Simple swap: exchange the positions of the two tasks
        const newTasks = [...this.tasks];
        [newTasks[draggedIndex], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[draggedIndex]];
        
        this.tasks = newTasks;
        console.log('New task order:', this.tasks.map(t => t.text));
        
        this.saveTasks();
        this.render();
    }

    showPrioritySelector(taskId, buttonElement) {
        console.log('showPrioritySelector called for task:', taskId, 'element:', buttonElement);
        
        // Remove any existing priority selector
        const existingSelector = document.querySelector('.priority-selector');
        if (existingSelector) {
            existingSelector.remove();
        }

        const priorities = [
            { value: 'low', label: 'Low', color: '#4CAF50' },
            { value: 'medium', label: 'Medium', color: '#FF9800' },
            { value: 'high', label: 'High', color: '#F44336' },
            { value: 'urgent', label: 'Urgent', color: '#9C27B0' }
        ];

        const selector = document.createElement('div');
        selector.className = 'priority-selector';
        selector.innerHTML = `
            <div class="priority-options">
                ${priorities.map(p => `
                    <button class="priority-option" data-priority="${p.value}" style="--priority-color: ${p.color}">
                        <div class="priority-dot" style="background-color: ${p.color}"></div>
                        ${p.label}
                    </button>
                `).join('')}
            </div>
        `;

        // Position the selector near the button
        const rect = buttonElement.getBoundingClientRect();
        selector.style.position = 'fixed';
        selector.style.top = `${rect.bottom + 5}px`;
        selector.style.left = `${rect.left}px`;
        selector.style.zIndex = '1000';

        console.log('Appending selector to body:', selector);
        document.body.appendChild(selector);
        console.log('Selector added to DOM');

        // Add event listeners for priority options
        selector.querySelectorAll('.priority-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const priority = e.target.closest('.priority-option').dataset.priority;
                this.updateTaskPriority(taskId, priority);
                selector.remove();
            });
        });

        // Close selector when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeSelector(e) {
                if (!selector.contains(e.target) && e.target !== buttonElement) {
                    selector.remove();
                    document.removeEventListener('click', closeSelector);
                }
            });
        }, 100);
    }

    updateTaskPriority(taskId, priority) {
        const task = this.tasks.find(t => t.id == taskId);
        if (task) {
            task.priority = priority;
            this.saveTasks();
            this.render();
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('focusAiTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks:', error);
        }
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('focusAiTasks');
            if (saved) {
                this.tasks = JSON.parse(saved);
                // Ensure all tasks have a priority (for backward compatibility)
                this.tasks.forEach(task => {
                    if (!task.priority) {
                        task.priority = 'medium';
                    }
                });
                this.taskIdCounter = Math.max(...this.tasks.map(t => t.id), 0);
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.tasks = [];
        }
    }
}

// 24-Hour Timer Class
class Timer {
    constructor() {
        this.hoursElement = document.getElementById('hours');
        this.minutesElement = document.getElementById('minutes');
        this.secondsElement = document.getElementById('seconds');
        this.dateElement = document.getElementById('currentDate');
        
        this.updateDate();
        this.startTimer();
    }

    startTimer() {
        this.updateTimer();
        setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    updateTimer() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0); // Next midnight
        
        const timeLeft = midnight.getTime() - now.getTime();
        
        if (timeLeft <= 0) {
            // Reset to next day
            midnight.setDate(midnight.getDate() + 1);
            const newTimeLeft = midnight.getTime() - now.getTime();
            this.displayTime(newTimeLeft);
            this.updateDate(); // Update date when day changes
        } else {
            this.displayTime(timeLeft);
        }
    }

    updateDate() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        const formattedDate = now.toLocaleDateString('en-US', options);
        if (this.dateElement) {
            this.dateElement.textContent = formattedDate;
        }
    }

    displayTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        this.hoursElement.textContent = hours.toString().padStart(2, '0');
        this.minutesElement.textContent = minutes.toString().padStart(2, '0');
        this.secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.checklistManager = new ChecklistManager();
    window.timer = new Timer();
    
    // Add keyboard shortcut to add new task (Ctrl/Cmd + N)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            window.checklistManager.addNewTask();
        }
    });
});
