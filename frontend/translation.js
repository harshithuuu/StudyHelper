// Translation functionality
class TranslationHelper {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.currentTranslation = null;
        this.originalText = '';
        
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.textInput = document.getElementById('textInput');
        this.languageSelect = document.getElementById('languageSelect');
        this.translateBtn = document.getElementById('translateBtn');
        this.clearTranslationBtn = document.getElementById('clearTranslationBtn');
        this.loadExampleBtn = document.getElementById('loadExampleBtn');
        this.translationResults = document.getElementById('translationResults');
        this.saveTranslationBtn = document.getElementById('saveTranslationBtn');
        this.downloadTranslationBtn = document.getElementById('downloadTranslationBtn');
        this.copyTranslationBtn = document.getElementById('copyTranslationBtn');
        this.swapLanguagesBtn = document.getElementById('swapLanguagesBtn');
        
        // Text size controls
        this.decreaseTextSizeBtn = document.getElementById('decreaseTextSizeBtn');
        this.increaseTextSizeBtn = document.getElementById('increaseTextSizeBtn');
        this.resetTextSizeBtn = document.getElementById('resetTextSizeBtn');
        this.textSizeDisplay = document.getElementById('textSizeDisplay');
        
        // Initialize text size
        this.currentTextSize = 1; // 1 = normal, 0.8 = small, 1.2 = large, etc.
    }

    initializeEventListeners() {
        this.translateBtn.addEventListener('click', () => this.translateText());
        this.clearTranslationBtn.addEventListener('click', () => this.clearTranslation());
        this.loadExampleBtn.addEventListener('click', () => this.loadExample());
        this.saveTranslationBtn.addEventListener('click', () => this.saveTranslation());
        this.downloadTranslationBtn.addEventListener('click', () => this.downloadTranslation());
        this.copyTranslationBtn.addEventListener('click', () => this.copyTranslation());
        this.swapLanguagesBtn.addEventListener('click', () => this.swapLanguages());
        
        // Text size controls
        this.decreaseTextSizeBtn.addEventListener('click', () => this.decreaseTextSize());
        this.increaseTextSizeBtn.addEventListener('click', () => this.increaseTextSize());
        this.resetTextSizeBtn.addEventListener('click', () => this.resetTextSize());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (this.textInput.value.trim()) {
                            this.translateText();
                        }
                        break;
                }
            }
        });
    }

    async translateText() {
        const text = this.textInput.value.trim();
        const language = this.languageSelect.value;
        
        if (!text) {
            commonHelper.showError('Please enter text to translate.');
            return;
        }

        this.originalText = text;
        commonHelper.showLoading('Translating text...');
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
                this.currentTranslation = data.data.translation;
                this.displayTranslation();
                commonHelper.showMessage('Translation completed successfully!', 'success');
            } else {
                commonHelper.showError(data.error || 'Failed to translate text.');
            }
        } catch (error) {
            console.error('Error:', error);
            commonHelper.showError('Network error. Please check your connection and try again.');
        } finally {
            commonHelper.hideLoading();
            this.disableButtons(false);
        }
    }

    displayTranslation() {
        if (!this.currentTranslation) {
            this.translationResults.innerHTML = `
                <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div class="text-center">
                        <i class="fas fa-language text-4xl mb-4"></i>
                        <p>No translation to display</p>
                    </div>
                </div>
            `;
            return;
        }

        this.translationResults.innerHTML = `
            <div class="prose dark:prose-invert max-w-none">
                <div class="whitespace-pre-wrap text-white" style="font-size: ${this.currentTextSize}rem; line-height: 1.6;">${this.currentTranslation}</div>
            </div>
        `;
    }

    async saveTranslation() {
        if (!this.currentTranslation) {
            commonHelper.showError('No translation to save. Please translate text first.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: `Translation to ${this.languageSelect.value}`,
                    content: this.currentTranslation,
                    type: 'translation',
                    original_text: this.originalText,
                    language: this.languageSelect.value
                })
            });

            const data = await response.json();

            if (data.success) {
                commonHelper.showMessage('Translation saved successfully!', 'success');
            } else {
                commonHelper.showError('Failed to save translation.');
            }
        } catch (error) {
            console.error('Error saving translation:', error);
            commonHelper.showError('Network error. Please try again.');
        }
    }

    downloadTranslation() {
        if (!this.currentTranslation) {
            commonHelper.showError('No translation to download. Please translate text first.');
            return;
        }

        try {
            const content = `# Translation to ${this.languageSelect.value}\n\n## Original Text\n${this.originalText}\n\n## Translation\n${this.currentTranslation}\n\n---\n\n*Generated by Study Helper*`;
            
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `translation-${this.languageSelect.value}-${Date.now()}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            commonHelper.showMessage('Translation downloaded successfully!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            commonHelper.showError('Failed to download translation.');
        }
    }

    copyTranslation() {
        if (!this.currentTranslation) {
            commonHelper.showError('No translation to copy. Please translate text first.');
            return;
        }

        commonHelper.copyToClipboard(this.currentTranslation);
        commonHelper.showMessage('Translation copied to clipboard!', 'success');
    }

    swapLanguages() {
        if (!this.currentTranslation) {
            commonHelper.showError('No translation to swap. Please translate text first.');
            return;
        }

        // Swap the text and translation
        const tempText = this.textInput.value;
        this.textInput.value = this.currentTranslation;
        this.currentTranslation = tempText;
        
        this.displayTranslation();
        commonHelper.showMessage('Text and translation swapped!', 'success');
    }

    loadExample() {
        const exampleText = `Machine learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience, without being explicitly programmed.`;

        this.textInput.value = exampleText;
    }

    clearTranslation() {
        this.textInput.value = '';
        this.currentTranslation = null;
        this.originalText = '';
        this.displayTranslation();
    }

    decreaseTextSize() {
        if (this.currentTextSize > 0.6) {
            this.currentTextSize -= 0.1;
            this.updateTextSize();
        }
    }

    increaseTextSize() {
        if (this.currentTextSize < 2.0) {
            this.currentTextSize += 0.1;
            this.updateTextSize();
        }
    }

    resetTextSize() {
        this.currentTextSize = 1.0;
        this.updateTextSize();
    }

    updateTextSize() {
        // Update the display
        const sizeLabels = {
            0.6: 'Very Small',
            0.7: 'Small',
            0.8: 'Small',
            0.9: 'Small',
            1.0: 'Normal',
            1.1: 'Large',
            1.2: 'Large',
            1.3: 'Large',
            1.4: 'Very Large',
            1.5: 'Very Large',
            1.6: 'Very Large',
            1.7: 'Huge',
            1.8: 'Huge',
            1.9: 'Huge',
            2.0: 'Huge'
        };
        
        const roundedSize = Math.round(this.currentTextSize * 10) / 10;
        this.textSizeDisplay.textContent = sizeLabels[roundedSize] || 'Custom';
        
        // Update the translation display if it exists
        if (this.currentTranslation) {
            this.displayTranslation();
        }
    }

    disableButtons(disable) {
        this.translateBtn.disabled = disable;
        this.saveTranslationBtn.disabled = disable;
        this.downloadTranslationBtn.disabled = disable;
        this.copyTranslationBtn.disabled = disable;
        this.swapLanguagesBtn.disabled = disable;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.translationHelper = new TranslationHelper();
});
