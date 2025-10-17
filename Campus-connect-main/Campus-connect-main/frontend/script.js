const API_BASE = 'http://127.0.0.1:5000/api'; // ADDED /api back

class CampusConnect {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
    }

    checkAuth() {
        if (this.token && this.user) {
            this.showAuthenticatedUI();
        } else {
            this.showPublicUI();
        }
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                e.preventDefault();
                this.navigateTo(e.target.getAttribute('data-page'));
            }
            
            if (e.target.matches('.logout-btn')) {
                this.logout();
            }
        });
    }

    navigateTo(page) {
        window.location.href = `${page}.html`;
    }

    showAuthenticatedUI() {
        const authElements = document.querySelectorAll('.auth-only');
        const nonAuthElements = document.querySelectorAll('.non-auth-only');
        
        authElements.forEach(el => el.style.display = 'block');
        nonAuthElements.forEach(el => el.style.display = 'none');

        // Update user info
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(el => {
            el.textContent = this.user?.name || 'User';
        });
    }

    showPublicUI() {
        const authElements = document.querySelectorAll('.auth-only');
        const nonAuthElements = document.querySelectorAll('.non-auth-only');
        
        authElements.forEach(el => el.style.display = 'none');
        nonAuthElements.forEach(el => el.style.display = 'block');
    }

    async apiCall(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers,
                ...options
            });

            // Get response as text first to handle errors
            const responseText = await response.text();
            let data;
            
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
            }

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('API Call error:', error);
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification implementation
        alert(`${type.toUpperCase()}: ${message}`);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        window.location.href = 'index.html';
    }

    // Event-related methods
    async loadEvents(category = 'all') {
        try {
            const query = category !== 'all' ? `?category=${category}` : '';
            const events = await this.apiCall(`/events${query}`);
            this.displayEvents(events);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    displayEvents(events) {
        const container = document.getElementById('eventsContainer');
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = '<p class="text-center">No events found.</p>';
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="event-card">
                <div class="event-header">
                    <span class="event-category">${event.category}</span>
                    <h3>${event.title}</h3>
                </div>
                <div class="event-body">
                    <p>${event.description}</p>
                    <div class="event-details">
                        <div class="event-detail">
                            <strong>Venue:</strong> ${event.venue}
                        </div>
                        <div class="event-detail">
                            <strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}
                        </div>
                        <div class="event-detail">
                            <strong>Time:</strong> ${event.time || 'TBA'}
                        </div>
                        <div class="event-detail">
                            <strong>Organizer:</strong> ${event.organizer.name}
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="app.registerForEvent('${event._id}')">
                        Register Now
                    </button>
                </div>
            </div>
        `).join('');
    }

    async registerForEvent(eventId) {
        if (!this.token) {
            this.showNotification('Please login to register for events', 'error');
            this.navigateTo('login');
            return;
        }

        try {
            await this.apiCall(`/events/${eventId}/register`, {
                method: 'POST'
            });
            this.showNotification('Successfully registered for the event!', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // QR Code generation
    generateQRCodeUrl(qrData) {
        return `${API_BASE}/qrcode/${encodeURIComponent(qrData)}`;
    }
}

// Global app instance
const app = new CampusConnect();

// Utility function for form handling
function handleFormSubmit(formId, submitCallback) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            await submitCallback(data);
        });
    }
}