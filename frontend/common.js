// Common functionality for all Study Helper pages

class CommonHelper {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.initializeTheme();
        this.loadNavbar();
        this.initializeEventListeners();
    }

    initializeTheme() {
        if (this.currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
        this.updateThemeIcon();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        
        if (this.currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const moonIcon = themeToggle.querySelector('.fa-moon');
        const sunIcon = themeToggle.querySelector('.fa-sun');
        
        if (this.currentTheme === 'dark') {
            if (moonIcon) moonIcon.classList.add('hidden');
            if (sunIcon) sunIcon.classList.remove('hidden');
        } else {
            if (moonIcon) moonIcon.classList.remove('hidden');
            if (sunIcon) sunIcon.classList.add('hidden');
        }
    }

    async loadNavbar() {
        try {
            const navbarContainer = document.getElementById('navbar-container');
            if (!navbarContainer) return;

            const response = await fetch('navbar.html');
            const navbarHtml = await response.text();
            navbarContainer.innerHTML = navbarHtml;
            
            // Re-attach theme toggle event listener
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => this.toggleTheme());
            }

            // Re-attach mobile menu event listener
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                });
            }

            // Highlight current page in navigation
            this.highlightCurrentPage();
            
        } catch (error) {
            console.error('Failed to load navbar:', error);
        }
    }

    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '/' && href === '/')) {
                link.classList.add('text-primary-600', 'dark:text-primary-400');
                link.classList.remove('text-gray-700', 'dark:text-gray-300');
            } else {
                link.classList.remove('text-primary-600', 'dark:text-primary-400');
                link.classList.add('text-gray-700', 'dark:text-gray-300');
            }
        });
    }

    initializeEventListeners() {
        // Mobile menu toggle
        document.addEventListener('click', (e) => {
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileMenu = document.getElementById('mobileMenu');
            
            if (mobileMenuBtn && mobileMenu && !mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    showLoading(message = 'Loading...') {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            const span = loadingIndicator.querySelector('span');
            if (span) span.textContent = message;
            loadingIndicator.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
        }
    }

    showError(message) {
        const errorDisplay = document.getElementById('errorDisplay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorDisplay && errorMessage) {
            errorMessage.textContent = message;
            errorDisplay.classList.remove('hidden');
            this.hideLoading();
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }
    }

    hideError() {
        const errorDisplay = document.getElementById('errorDisplay');
        if (errorDisplay) {
            errorDisplay.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(messageEl)) {
                document.body.removeChild(messageEl);
            }
        }, 3000);
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showMessage('Copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showError('Failed to copy to clipboard.');
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getTypeIcon(type) {
        const icons = {
            'summary': 'fas fa-compress-alt',
            'translation': 'fas fa-language',
            'notes': 'fas fa-book',
            'mindmap': 'fas fa-project-diagram'
        };
        return icons[type] || 'fas fa-file-alt';
    }

    getTypeColor(type) {
        const colors = {
            'summary': 'blue',
            'translation': 'purple',
            'notes': 'green',
            'mindmap': 'orange'
        };
        return colors[type] || 'gray';
    }

    getTypeLabel(type) {
        const labels = {
            'summary': 'Summary',
            'translation': 'Translation',
            'notes': 'Revision Notes',
            'mindmap': 'Mind Map'
        };
        return labels[type] || 'Note';
    }

    truncateText(text, maxLength = 200) {
        if (!text) return '';
        
        // If it's JSON content, try to extract a meaningful preview
        if (text.startsWith('{') && text.includes('"label"')) {
            try {
                const parsed = JSON.parse(text);
                if (parsed.nodes && parsed.nodes.length > 0) {
                    const centralNode = parsed.nodes.find(node => node.type === 'central');
                    if (centralNode && centralNode.label) {
                        return `Mind Map: ${centralNode.label}`;
                    }
                    // Fallback to first node label
                    const firstNode = parsed.nodes[0];
                    if (firstNode && firstNode.label) {
                        return `Mind Map: ${firstNode.label}`;
                    }
                }
            } catch (e) {
                // If JSON parsing fails, fall back to regular truncation
            }
        }
        
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// Initialize common functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.commonHelper = new CommonHelper();
});
