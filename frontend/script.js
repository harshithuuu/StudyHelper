// Study Helper Frontend JavaScript
class StudyHelper {
    constructor() {
        // Use the backend server URL (port 3000) instead of the current origin
        this.apiBaseUrl = 'http://localhost:3000/api';
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadSavedNotes();
    }

    initializeElements() {
        // Input elements
        this.textInput = document.getElementById('textInput');
        this.urlInput = document.getElementById('urlInput');
        this.languageSelect = document.getElementById('languageSelect');
        
        // Button elements
        this.summarizeBtn = document.getElementById('summarizeBtn');
        this.revisionBtn = document.getElementById('revisionBtn');
        this.translateBtn = document.getElementById('translateBtn');
        this.refreshNotesBtn = document.getElementById('refreshNotesBtn');
        
        // Output elements
        this.outputArea = document.getElementById('outputArea');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorDisplay = document.getElementById('errorDisplay');
        this.errorMessage = document.getElementById('errorMessage');
        this.savedNotesContainer = document.getElementById('savedNotesContainer');
    }

    initializeEventListeners() {
        // Action buttons
        this.summarizeBtn.addEventListener('click', () => this.handleSummarize());
        this.revisionBtn.addEventListener('click', () => this.handleRevisionNotes());
        this.translateBtn.addEventListener('click', () => this.handleTranslate());
        this.refreshNotesBtn.addEventListener('click', () => this.loadSavedNotes());

        // URL input handling
        this.urlInput.addEventListener('blur', () => this.handleUrlInput());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (this.textInput.value.trim()) {
                            this.handleSummarize();
                        }
                        break;
                    case 't':
                        e.preventDefault();
                        if (this.textInput.value.trim()) {
                            this.handleTranslate();
                        }
                        break;
                    case 'r':
                        e.preventDefault();
                        if (this.textInput.value.trim()) {
                            this.handleRevisionNotes();
                        }
                        break;
                }
            }
        });
    }


    async handleUrlInput() {
        const url = this.urlInput.value.trim();
        if (url && this.isValidUrl(url)) {
            try {
                this.showLoading('Fetching content from URL...');
                // Note: In a real implementation, you'd need a backend endpoint to fetch URL content
                // For now, we'll just show a placeholder message
                this.showMessage('URL detected! Please paste the content manually for now.', 'info');
            } catch (error) {
                this.showError('Failed to fetch content from URL. Please paste the content manually.');
            }
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async handleSummarize() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.showError('Please enter some text to summarize.');
            return;
        }

        this.showLoading('Summarizing your text...');
        this.disableButtons(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/ai/summarize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();

            if (data.success) {
                this.displayResult(data.data.summary, 'summary', data.data.noteId);
                this.loadSavedNotes(); // Refresh saved notes
            } else {
                this.showError(data.error || 'Failed to summarize text.');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.hideLoading();
            this.disableButtons(false);
        }
    }

    async handleRevisionNotes() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.showError('Please enter some text to generate revision notes.');
            return;
        }

        this.showLoading('Generating revision notes...');
        this.disableButtons(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/ai/revision-notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();

            if (data.success) {
                this.displayResult(data.data.revisionNotes, 'revision', data.data.noteId);
                this.loadSavedNotes(); // Refresh saved notes
            } else {
                this.showError(data.error || 'Failed to generate revision notes.');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.hideLoading();
            this.disableButtons(false);
        }
    }

    async handleTranslate() {
        const text = this.textInput.value.trim();
        const language = this.languageSelect.value;

        if (!text) {
            this.showError('Please enter some text to translate.');
            return;
        }

        this.showLoading(`Translating to ${language}...`);
        this.disableButtons(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/ai/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, language })
            });

            const data = await response.json();

            if (data.success) {
                this.displayResult(data.data.translation, 'translation', data.data.noteId, {
                    originalText: data.data.originalText,
                    language: data.data.language
                });
                this.loadSavedNotes(); // Refresh saved notes
            } else {
                this.showError(data.error || 'Failed to translate text.');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.hideLoading();
            this.disableButtons(false);
        }
    }

    displayResult(content, type, noteId, metadata = {}) {
        const typeLabels = {
            'summary': 'Summary',
            'revision': 'Revision Notes',
            'translation': 'Translation'
        };

        const typeIcons = {
            'summary': 'fas fa-compress-alt',
            'revision': 'fas fa-book',
            'translation': 'fas fa-language'
        };

        const typeColors = {
            'summary': 'blue',
            'revision': 'green',
            'translation': 'purple'
        };

        let resultHtml = `
            <div class="bg-${typeColors[type]}-50 dark:bg-${typeColors[type]}-900/20 border border-${typeColors[type]}-200 dark:border-${typeColors[type]}-800 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <i class="${typeIcons[type]} text-${typeColors[type]}-600 dark:text-${typeColors[type]}-400"></i>
                        <h3 class="font-semibold text-${typeColors[type]}-800 dark:text-${typeColors[type]}-200">${typeLabels[type]}</h3>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400">Note ID: ${noteId}</span>
                        <button onclick="studyHelper.copyToClipboard('${content.replace(/'/g, "\\'")}')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
        `;

        if (metadata.originalText && metadata.language) {
            resultHtml += `
                <div class="mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                    <strong>Original (${metadata.language}):</strong><br>
                    <span class="text-gray-600 dark:text-gray-300">${metadata.originalText.substring(0, 200)}${metadata.originalText.length > 200 ? '...' : ''}</span>
                </div>
            `;
        }

        resultHtml += `
                <div class="prose dark:prose-invert max-w-none">
                    <div class="whitespace-pre-wrap text-gray-800 dark:text-gray-200">${content}</div>
                </div>
            </div>
        `;

        this.outputArea.innerHTML = resultHtml;
        this.hideError();
    }

    async loadSavedNotes() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notes`);
            const data = await response.json();

            if (data.success) {
                this.displaySavedNotes(data.data);
            } else {
                console.error('Failed to load saved notes:', data.error);
            }
        } catch (error) {
            console.error('Error loading saved notes:', error);
        }
    }

    displaySavedNotes(notes) {
        if (notes.length === 0) {
            this.savedNotesContainer.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>No saved notes yet. Generate some notes to see them here!</p>
                </div>
            `;
            return;
        }

        const notesHtml = notes.map(note => {
            const typeLabels = {
                'summary': 'Summary',
                'translation': 'Translation',
                'notes': 'Revision Notes'
            };

            const typeColors = {
                'summary': 'blue',
                'translation': 'purple',
                'notes': 'green'
            };

            const typeIcons = {
                'summary': 'fas fa-compress-alt',
                'translation': 'fas fa-language',
                'notes': 'fas fa-book'
            };

            const createdDate = new Date(note.created_at).toLocaleDateString();
            const createdTime = new Date(note.created_at).toLocaleTimeString();

            return `
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${typeColors[note.type]}-100 text-${typeColors[note.type]}-800 dark:bg-${typeColors[note.type]}-900/30 dark:text-${typeColors[note.type]}-200">
                                <i class="${typeIcons[note.type]} mr-1"></i>
                                ${typeLabels[note.type]}
                            </span>
                            ${note.language ? `<span class="text-xs text-gray-500 dark:text-gray-400">→ ${note.language}</span>` : ''}
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs text-gray-500 dark:text-gray-400">${createdDate} ${createdTime}</span>
                            <button onclick="studyHelper.deleteNote(${note.id})" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}
                    </div>
                    <div class="flex items-center justify-between">
                        <button onclick="studyHelper.copyToClipboard('${note.content.replace(/'/g, "\\'")}')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
                            <i class="fas fa-copy mr-1"></i>Copy
                        </button>
                        <button onclick="studyHelper.loadNoteToInput(${note.id})" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm">
                            <i class="fas fa-edit mr-1"></i>Edit
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.savedNotesContainer.innerHTML = notesHtml;
    }

    async deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/notes/${noteId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.loadSavedNotes();
                this.showMessage('Note deleted successfully.', 'success');
            } else {
                this.showError(data.error || 'Failed to delete note.');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            this.showError('Failed to delete note. Please try again.');
        }
    }

    async loadNoteToInput(noteId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notes/${noteId}`);
            const data = await response.json();

            if (data.success) {
                this.textInput.value = data.data.content;
                this.showMessage('Note loaded into input area.', 'success');
            } else {
                this.showError(data.error || 'Failed to load note.');
            }
        } catch (error) {
            console.error('Error loading note:', error);
            this.showError('Failed to load note. Please try again.');
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showMessage('Copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showError('Failed to copy to clipboard.');
        });
    }

    showLoading(message = 'Processing...') {
        this.loadingIndicator.querySelector('span').textContent = message;
        this.loadingIndicator.classList.remove('hidden');
        this.hideError();
    }

    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorDisplay.classList.remove('hidden');
        this.hideLoading();
    }

    hideError() {
        this.errorDisplay.classList.add('hidden');
    }

    showMessage(message, type = 'info') {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 3000);
    }

    disableButtons(disable) {
        this.summarizeBtn.disabled = disable;
        this.revisionBtn.disabled = disable;
        this.translateBtn.disabled = disable;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studyHelper = new StudyHelper();
});
