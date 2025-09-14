// File upload and processing functionality
class FileUploadHelper {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.selectedFile = null;
        
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.filePreview = document.getElementById('filePreview');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.removeFileBtn = document.getElementById('removeFileBtn');
        this.processFileBtn = document.getElementById('processFileBtn');
        
        // Options
        this.autoSummarize = document.getElementById('autoSummarize');
        this.autoTranslate = document.getElementById('autoTranslate');
        this.createMindmap = document.getElementById('createMindmap');
        
        // Results
        this.extractedTextArea = document.getElementById('extractedTextArea');
        this.textStats = document.getElementById('textStats');
        this.copyTextBtn = document.getElementById('copyTextBtn');
        this.aiResults = document.getElementById('aiResults');
    }

    initializeEventListeners() {
        // File input
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        
        // Drag and drop
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        
        // File actions
        this.removeFileBtn.addEventListener('click', () => this.removeFile());
        this.processFileBtn.addEventListener('click', () => this.processFile());
        this.copyTextBtn.addEventListener('click', () => this.copyExtractedText());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileSelect(files[0]);
        }
    }

    handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            commonHelper.showError('Please select a PDF or image file.');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            commonHelper.showError('File size must be less than 10MB.');
            return;
        }

        this.selectedFile = file;
        this.showFilePreview();
        this.processFileBtn.disabled = false;
    }

    showFilePreview() {
        if (!this.selectedFile) return;

        const fileSize = commonHelper.formatFileSize(this.selectedFile.size);
        const fileIcon = this.selectedFile.type === 'application/pdf' ? 'fas fa-file-pdf' : 'fas fa-file-image';

        this.fileName.textContent = this.selectedFile.name;
        this.fileSize.textContent = fileSize;

        // Show file icon
        const icon = this.filePreview.querySelector('i');
        if (icon) {
            icon.className = fileIcon + ' text-primary-600';
        }

        this.filePreview.classList.remove('hidden');
    }

    removeFile() {
        this.selectedFile = null;
        this.fileInput.value = '';
        this.filePreview.classList.add('hidden');
        this.processFileBtn.disabled = true;
        this.clearResults();
    }

    clearResults() {
        this.extractedTextArea.innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div class="text-center">
                    <i class="fas fa-file-text text-2xl mb-2"></i>
                    <p>Extracted text will appear here</p>
                </div>
            </div>
        `;
        this.textStats.textContent = '';
        this.aiResults.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <i class="fas fa-magic text-2xl mb-2"></i>
                <p>AI processing results will appear here</p>
            </div>
        `;
    }

    async processFile() {
        if (!this.selectedFile) {
            commonHelper.showError('Please select a file first.');
            return;
        }

        commonHelper.showLoading('Processing file...');
        this.processFileBtn.disabled = true;

        try {
            // Upload and extract text
            const formData = new FormData();
            formData.append('file', this.selectedFile);

            const response = await fetch(`${this.apiBaseUrl}/files/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.displayExtractedText(data.data.extractedText);
                this.textStats.textContent = `${data.data.textLength} characters extracted from ${data.data.originalFilename}`;

                // Process with AI if options are selected
                await this.processWithAI(data.data.extractedText);

                commonHelper.showMessage('File processed successfully!', 'success');
            } else {
                commonHelper.showError(data.error || 'Failed to process file.');
            }
        } catch (error) {
            console.error('Error:', error);
            commonHelper.showError('Network error. Please check your connection and try again.');
        } finally {
            commonHelper.hideLoading();
            this.processFileBtn.disabled = false;
        }
    }

    displayExtractedText(text) {
        this.extractedTextArea.innerHTML = `<div class="whitespace-pre-wrap text-gray-900 dark:text-white">${text}</div>`;
    }

    async processWithAI(text) {
        const promises = [];

        if (this.autoSummarize.checked) {
            promises.push(this.generateSummary(text));
        }

        if (this.autoTranslate.checked) {
            promises.push(this.translateText(text, 'Telugu'));
        }

        if (this.createMindmap.checked) {
            promises.push(this.generateMindMap(text));
        }

        if (promises.length > 0) {
            try {
                const results = await Promise.all(promises);
                this.displayAIResults(results);
            } catch (error) {
                console.error('AI processing error:', error);
                commonHelper.showError('Some AI processing failed. Check individual results.');
            }
        }
    }

    async generateSummary(text) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/ai/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            return { type: 'summary', success: data.success, data: data.data };
        } catch (error) {
            return { type: 'summary', success: false, error: error.message };
        }
    }

    async translateText(text, language) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/ai/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language })
            });
            const data = await response.json();
            return { type: 'translation', success: data.success, data: data.data };
        } catch (error) {
            return { type: 'translation', success: false, error: error.message };
        }
    }

    async generateMindMap(text) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/files/mindmap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            return { type: 'mindmap', success: data.success, data: data.data };
        } catch (error) {
            return { type: 'mindmap', success: false, error: error.message };
        }
    }

    displayAIResults(results) {
        let html = '';
        
        results.forEach(result => {
            if (result.success) {
                const typeIcon = commonHelper.getTypeIcon(result.type);
                const typeColor = commonHelper.getTypeColor(result.type);
                const typeLabel = commonHelper.getTypeLabel(result.type);
                
                let content = '';
                if (result.type === 'summary') {
                    content = result.data.summary;
                } else if (result.type === 'translation') {
                    content = result.data.translation;
                } else if (result.type === 'mindmap') {
                    content = 'Mind map structure generated successfully. You can view it in the Mind Maps section.';
                }

                html += `
                    <div class="bg-${typeColor}-50 dark:bg-${typeColor}-900/20 border border-${typeColor}-200 dark:border-${typeColor}-800 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center space-x-2">
                                <i class="${typeIcon} text-${typeColor}-600 dark:text-${typeColor}-400"></i>
                                <h3 class="font-semibold text-${typeColor}-800 dark:text-${typeColor}-200">${typeLabel}</h3>
                            </div>
                            <button onclick="commonHelper.copyToClipboard('${content.replace(/'/g, "\\'")}')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <div class="whitespace-pre-wrap text-gray-800 dark:text-gray-200">${content}</div>
                    </div>
                `;
            } else {
                html += `
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div class="flex items-center space-x-2 mb-2">
                            <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400"></i>
                            <h3 class="font-semibold text-red-800 dark:text-red-200">${commonHelper.getTypeLabel(result.type)} Failed</h3>
                        </div>
                        <p class="text-red-700 dark:text-red-300">${result.error}</p>
                    </div>
                `;
            }
        });

        this.aiResults.innerHTML = html;
    }

    copyExtractedText() {
        const textElement = this.extractedTextArea.querySelector('div');
        if (textElement) {
            commonHelper.copyToClipboard(textElement.textContent);
        } else {
            commonHelper.showError('No text to copy.');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fileUploadHelper = new FileUploadHelper();
});
