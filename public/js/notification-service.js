class NotificationService {
    constructor() {
        this.notifications = [];
        this.listeners = new Set();
    }

    // Show a notification
    show(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            html: this.generateNotificationHTML(message, type)
        };

        this.notifications.push(notification);
        this.notifyListeners();
        this.showToast(notification);

        if (duration > 0) {
            setTimeout(() => this.dismiss(notification.id), duration);
        }

        return notification.id;
    }

    // Generate notification HTML
    generateNotificationHTML(message, type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const colors = {
            success: 'bg-green-100 text-green-800 border-green-200',
            error: 'bg-red-100 text-red-800 border-red-200',
            warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            info: 'bg-blue-100 text-blue-800 border-blue-200'
        };

        return `
            <div class="notification-toast fixed right-4 top-20 transform transition-all duration-300 ease-in-out z-50"
                 role="alert">
                <div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border ${colors[type]}">
                    <div class="p-4">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <i class="fas ${icons[type]} text-2xl"></i>
                            </div>
                            <div class="ml-3 w-0 flex-1">
                                <p class="text-sm font-medium">
                                    ${message}
                                </p>
                            </div>
                            <div class="ml-4 flex-shrink-0 flex">
                                <button class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Show success notification
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    // Show error notification
    error(message, duration = 3000) {
        return this.show(message, 'error', duration);
    }

    // Show warning notification
    warning(message, duration = 3000) {
        return this.show(message, 'warning', duration);
    }

    // Show info notification
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    // Dismiss a notification
    dismiss(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notifications.splice(index, 1);
            this.notifyListeners();
            this.removeToast(id);
        }
    }

    // Add a listener for notifications
    addListener(callback) {
        this.listeners.add(callback);
    }

    // Remove a listener
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.notifications));
    }

    // Show toast notification
    showToast(notification) {
        const container = document.getElementById('notification-container') || this.createContainer();
        const toast = document.createElement('div');
        toast.innerHTML = notification.html;
        toast.id = `notification-${notification.id}`;
        
        // Add animation classes
        toast.firstElementChild.classList.add('translate-x-full');
        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.firstElementChild.classList.remove('translate-x-full');
        }, 10);

        // Add click handler for dismiss button
        const dismissButton = toast.querySelector('button');
        dismissButton.onclick = () => this.dismiss(notification.id);
    }

    // Remove toast notification
    removeToast(id) {
        const toast = document.getElementById(`notification-${id}`);
        if (toast) {
            // Add exit animation
            toast.firstElementChild.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }
    }

    // Create container for notifications
    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed right-0 top-20 p-4 space-y-4 z-50';
        document.body.appendChild(container);
        return container;
    }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService; 