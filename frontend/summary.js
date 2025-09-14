// Summary functionality
class SummaryHelper {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.currentSummary = null;
        
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.textInput = document.getElementById('textInput');
        this.urlInput = document.getElementById('urlInput');
        this.generateSummaryBtn = document.getElementById('generateSummaryBtn');
        this.clearSummaryBtn = document.getElementById('clearSummaryBtn');
        this.loadExampleBtn = document.getElementById('loadExampleBtn');
        this.summaryResults = document.getElementById('summaryResults');
        this.saveSummaryBtn = document.getElementById('saveSummaryBtn');
        this.downloadSummaryBtn = document.getElementById('downloadSummaryBtn');
        this.copySummaryBtn = document.getElementById('copySummaryBtn');
        this.createMindMapBtn = document.getElementById('createMindMapBtn');
        
        // Text size controls
        this.decreaseTextSizeBtn = document.getElementById('decreaseTextSizeBtn');
        this.increaseTextSizeBtn = document.getElementById('increaseTextSizeBtn');
        this.resetTextSizeBtn = document.getElementById('resetTextSizeBtn');
        this.textSizeDisplay = document.getElementById('textSizeDisplay');
        
        // Note memory controls
        this.loadNotesBtn = document.getElementById('loadNotesBtn');
        this.clearSelectedNotesBtn = document.getElementById('clearSelectedNotesBtn');
        this.selectedNotesContainer = document.getElementById('selectedNotesContainer');
        
        // Initialize text size
        this.currentTextSize = 1; // 1 = normal, 0.8 = small, 1.2 = large, etc.
        
        // Initialize note memory
        this.selectedNotes = [];
        this.availableNotes = [];
    }

    initializeEventListeners() {
        this.generateSummaryBtn.addEventListener('click', () => this.generateSummary());
        this.clearSummaryBtn.addEventListener('click', () => this.clearSummary());
        this.loadExampleBtn.addEventListener('click', () => this.loadExample());
        this.saveSummaryBtn.addEventListener('click', () => this.saveSummary());
        this.downloadSummaryBtn.addEventListener('click', () => this.downloadSummary());
        this.copySummaryBtn.addEventListener('click', () => this.copySummary());
        this.createMindMapBtn.addEventListener('click', () => this.createMindMap());
        
        // Text size controls
        this.decreaseTextSizeBtn.addEventListener('click', () => this.decreaseTextSize());
        this.increaseTextSizeBtn.addEventListener('click', () => this.increaseTextSize());
        this.resetTextSizeBtn.addEventListener('click', () => this.resetTextSize());
        
        // Note memory controls
        this.loadNotesBtn.addEventListener('click', () => this.loadNotes());
        this.clearSelectedNotesBtn.addEventListener('click', () => this.clearSelectedNotes());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (this.textInput.value.trim()) {
                            this.generateSummary();
                        }
                        break;
                }
            }
        });
    }

    async generateSummary() {
        const text = this.textInput.value.trim();
        const url = this.urlInput.value.trim();
        const depth = document.querySelector('input[name="depth"]:checked').value;
        
        if (!text) {
            commonHelper.showError('Please enter text to summarize.');
            return;
        }

        commonHelper.showLoading('Generating summary...');
        this.disableButtons(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/ai/summarize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, url, depth })
            });

            const data = await response.json();

            if (data.success) {
                this.currentSummary = data.data.summary;
                this.displaySummary();
                commonHelper.showMessage('Summary generated successfully!', 'success');
            } else {
                commonHelper.showError(data.error || 'Failed to generate summary.');
            }
        } catch (error) {
            console.error('Error:', error);
            commonHelper.showError('Network error. Please check your connection and try again.');
        } finally {
            commonHelper.hideLoading();
            this.disableButtons(false);
        }
    }

    displaySummary() {
        if (!this.currentSummary) {
            this.summaryResults.innerHTML = `
                <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div class="text-center">
                        <i class="fas fa-compress-alt text-4xl mb-4"></i>
                        <p>No summary to display</p>
                    </div>
                </div>
            `;
            return;
        }

        this.summaryResults.innerHTML = `
            <div class="prose dark:prose-invert max-w-none">
                <div class="whitespace-pre-wrap text-white" style="font-size: ${this.currentTextSize}rem; line-height: 1.6;">${this.currentSummary}</div>
            </div>
        `;
    }

    async saveSummary() {
        if (!this.currentSummary) {
            commonHelper.showError('No summary to save. Please generate a summary first.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: 'AI Summary',
                    content: this.currentSummary,
                    type: 'summary',
                    original_text: this.textInput.value.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                commonHelper.showMessage('Summary saved successfully!', 'success');
            } else {
                commonHelper.showError('Failed to save summary.');
            }
        } catch (error) {
            console.error('Error saving summary:', error);
            commonHelper.showError('Network error. Please try again.');
        }
    }

    async createMindMap() {
        if (!this.currentSummary) {
            commonHelper.showError('No summary to convert to mind map. Please generate a summary first.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/files/mindmap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: this.currentSummary })
            });

            const data = await response.json();

            if (data.success) {
                // Open mind map in new tab
                const mindMapWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                
                if (mindMapWindow) {
                    const mindMapHTML = this.generateMindMapViewerHTML(data.data.mindMap, 'Summary Mind Map');
                    mindMapWindow.document.write(mindMapHTML);
                    mindMapWindow.document.close();
                    mindMapWindow.focus();
                    commonHelper.showMessage('Mind map created successfully!', 'success');
                } else {
                    commonHelper.showError('Please allow popups to view mind maps.');
                }
            } else {
                commonHelper.showError('Failed to create mind map.');
            }
        } catch (error) {
            console.error('Error creating mind map:', error);
            commonHelper.showError('Network error. Please try again.');
        }
    }

    downloadSummary() {
        if (!this.currentSummary) {
            commonHelper.showError('No summary to download. Please generate a summary first.');
            return;
        }

        try {
            const content = `# AI Summary\n\n${this.currentSummary}\n\n---\n\n*Generated by Study Helper*`;
            
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `summary-${Date.now()}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            commonHelper.showMessage('Summary downloaded successfully!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            commonHelper.showError('Failed to download summary.');
        }
    }

    copySummary() {
        if (!this.currentSummary) {
            commonHelper.showError('No summary to copy. Please generate a summary first.');
            return;
        }

        commonHelper.copyToClipboard(this.currentSummary);
        commonHelper.showMessage('Summary copied to clipboard!', 'success');
    }

    loadExample() {
        const exampleText = `Machine Learning (ML) is a subset of artificial intelligence (AI) that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience, without being explicitly programmed. 

The field of machine learning has evolved significantly over the past few decades, driven by advances in computational power, data availability, and algorithmic innovations. Machine learning algorithms can be broadly categorized into three main types: supervised learning, unsupervised learning, and reinforcement learning.

Supervised learning involves training algorithms on labeled datasets, where the input data is paired with the correct output. Common applications include image recognition, spam detection, and predictive analytics. Popular supervised learning algorithms include linear regression, decision trees, random forests, support vector machines, and neural networks.

Unsupervised learning deals with finding hidden patterns in data without labeled examples. This includes clustering algorithms like K-means, dimensionality reduction techniques like Principal Component Analysis (PCA), and association rule learning. These methods are particularly useful for exploratory data analysis and market segmentation.

Reinforcement learning is a paradigm where an agent learns to make decisions by interacting with an environment and receiving feedback in the form of rewards or penalties. This approach has been successfully applied to game playing, robotics, and autonomous systems.

The success of machine learning depends heavily on data quality, feature engineering, and model selection. Data preprocessing, including cleaning, normalization, and feature scaling, is crucial for achieving good performance. Feature engineering involves selecting and transforming input variables to improve model accuracy.

Recent advances in deep learning, a subset of machine learning based on artificial neural networks with multiple layers, have revolutionized the field. Deep learning has achieved remarkable success in computer vision, natural language processing, and speech recognition.

Machine learning applications are now ubiquitous, from recommendation systems in e-commerce and streaming platforms to medical diagnosis, fraud detection, autonomous vehicles, and smart home devices. The field continues to evolve rapidly, with ongoing research in areas like explainable AI, federated learning, and quantum machine learning.

However, machine learning also presents challenges, including ethical considerations around bias and fairness, data privacy concerns, and the need for interpretable models. As the field matures, there is increasing emphasis on developing responsible AI systems that are transparent, accountable, and beneficial to society.`;

        this.textInput.value = exampleText;
        this.urlInput.value = '';
    }

    clearSummary() {
        this.textInput.value = '';
        this.urlInput.value = '';
        this.currentSummary = null;
        this.displaySummary();
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
        
        // Update the summary display if it exists
        if (this.currentSummary) {
            this.displaySummary();
        }
    }

    async loadNotes() {
        try {
            this.loadNotesBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
            this.loadNotesBtn.disabled = true;

            const response = await fetch(`${this.apiBaseUrl}/notes`);
            const data = await response.json();

            if (data.success) {
                this.availableNotes = data.data;
                this.showNotesSelection();
                commonHelper.showSuccess(`Loaded ${this.availableNotes.length} notes`);
            } else {
                commonHelper.showError('Failed to load notes');
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            commonHelper.showError('Network error. Please try again.');
        } finally {
            this.loadNotesBtn.innerHTML = '<i class="fas fa-folder-open mr-2"></i>Load My Notes';
            this.loadNotesBtn.disabled = false;
        }
    }

    showNotesSelection() {
        if (this.availableNotes.length === 0) {
            this.selectedNotesContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">No notes available.</p>';
            return;
        }

        const notesHtml = this.availableNotes.map(note => {
            const isSelected = this.selectedNotes.some(selected => selected.id === note.id);
            const typeIcon = commonHelper.getTypeIcon(note.type);
            const typeColor = commonHelper.getTypeColor(note.type);
            const createdDate = commonHelper.formatDate(note.created_at);
            const title = note.title || 'Untitled Note';

            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <input 
                            type="checkbox" 
                            id="note-${note.id}" 
                            class="note-checkbox" 
                            data-note-id="${note.id}"
                            ${isSelected ? 'checked' : ''}
                        >
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2 mb-1">
                                <i class="${typeIcon} text-${typeColor}-500"></i>
                                <span class="font-medium text-gray-900 dark:text-white truncate">${title}</span>
                                <span class="text-xs text-gray-500 dark:text-gray-400">${createdDate}</span>
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">${commonHelper.truncateText(note.content, 100)}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.selectedNotesContainer.innerHTML = `
            <div class="space-y-2">
                ${notesHtml}
            </div>
        `;

        // Add event listeners to checkboxes
        this.selectedNotesContainer.querySelectorAll('.note-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const noteId = e.target.dataset.noteId;
                const note = this.availableNotes.find(n => n.id == noteId);
                
                if (e.target.checked) {
                    if (!this.selectedNotes.some(n => n.id == noteId)) {
                        this.selectedNotes.push(note);
                    }
                } else {
                    this.selectedNotes = this.selectedNotes.filter(n => n.id != noteId);
                }
                
                this.updateSelectedNotesDisplay();
            });
        });
    }

    updateSelectedNotesDisplay() {
        if (this.selectedNotes.length === 0) {
            this.selectedNotesContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">No notes selected. Click "Load My Notes" to see your previous notes.</p>';
            return;
        }

        const selectedHtml = this.selectedNotes.map(note => {
            const typeIcon = commonHelper.getTypeIcon(note.type);
            const typeColor = commonHelper.getTypeColor(note.type);
            const createdDate = commonHelper.formatDate(note.created_at);
            const title = note.title || 'Untitled Note';

            return `
                <div class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-center space-x-2 flex-1 min-w-0">
                        <i class="${typeIcon} text-${typeColor}-500"></i>
                        <span class="font-medium text-gray-900 dark:text-white truncate">${title}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${createdDate}</span>
                    </div>
                    <button 
                        onclick="window.summaryHelper.removeSelectedNote('${note.id}')" 
                        class="text-red-500 hover:text-red-700 text-sm"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');

        this.selectedNotesContainer.innerHTML = `
            <div class="space-y-2">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Selected Notes (${this.selectedNotes.length}):</p>
                ${selectedHtml}
            </div>
        `;
    }

    removeSelectedNote(noteId) {
        this.selectedNotes = this.selectedNotes.filter(note => note.id !== noteId);
        this.updateSelectedNotesDisplay();
        
        // Update checkbox state
        const checkbox = this.selectedNotesContainer.querySelector(`#note-${noteId}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }

    clearSelectedNotes() {
        this.selectedNotes = [];
        this.updateSelectedNotesDisplay();
        
        // Uncheck all checkboxes
        this.selectedNotesContainer.querySelectorAll('.note-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    disableButtons(disable) {
        this.generateSummaryBtn.disabled = disable;
        this.saveSummaryBtn.disabled = disable;
        this.downloadSummaryBtn.disabled = disable;
        this.copySummaryBtn.disabled = disable;
        this.createMindMapBtn.disabled = disable;
    }

    generateMindMapViewerHTML(mindMapData, title) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mind Map Viewer - ${title}</title>
    <script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"></script>
    <script src="https://unpkg.com/dagre@0.8.5/dist/dagre.min.js"></script>
    <script src="https://unpkg.com/cytoscape-dagre@2.5.0/cytoscape-dagre.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        #cy { width: 100%; height: 600px; border: 1px solid #e5e7eb; background: #111827; }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <div class="p-6">
        <div class="mb-4">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                <i class="fas fa-project-diagram text-orange-600 mr-2"></i>
                Mind Map: ${title}
            </h1>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Interactive Mind Map</h2>
                <div class="flex items-center space-x-2">
                    <button onclick="zoomIn()" class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm">
                        <i class="fas fa-search-plus mr-1"></i>Zoom In
                    </button>
                    <button onclick="zoomOut()" class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm">
                        <i class="fas fa-search-minus mr-1"></i>Zoom Out
                    </button>
                    <button onclick="fitToScreen()" class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm">
                        <i class="fas fa-expand-arrows-alt mr-1"></i>Fit
                    </button>
                </div>
            </div>
            <div id="cy"></div>
        </div>
    </div>

    <script>
        let cy;
        const mindMapData = ${JSON.stringify(mindMapData)};

        function initializeMindMap() {
            if (typeof cytoscape === 'undefined') {
                alert('Cytoscape library not loaded');
                return;
            }

            if (typeof dagre !== 'undefined' && typeof cytoscapeDagre !== 'undefined' && cytoscape.use) {
                try {
                    cytoscape.use(cytoscapeDagre);
                } catch (error) {
                    console.warn('Failed to register cytoscape-dagre extension:', error);
                }
            }

            const elements = [];
            
            mindMapData.nodes.forEach(node => {
                elements.push({
                    data: {
                        id: node.id,
                        label: node.label || node.name || 'Node',
                        type: node.type || 'branch',
                        level: node.level || 0,
                        description: node.description || '',
                        relationship: node.relationship || ''
                    }
                });
            });

            mindMapData.edges.forEach(edge => {
                elements.push({
                    data: {
                        id: \`\${edge.source}-\${edge.target}\`,
                        source: edge.source,
                        target: edge.target,
                        relationship: edge.relationship || ''
                    }
                });
            });

            const layoutConfig = getLayoutConfig();

            cy = cytoscape({
                container: document.getElementById('cy'),
                elements: elements,
                style: [
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'background-color': 'transparent',
                            'border-width': 0,
                            'font-size': '14px',
                            'font-weight': '600',
                            'color': '#ffffff',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'text-outline-width': 2,
                            'text-outline-color': '#000000',
                            'width': 'label',
                            'height': 'label',
                            'padding': '8px',
                            'text-wrap': 'wrap',
                            'text-max-width': '200px'
                        }
                    },
                    {
                        selector: 'node[type="central"]',
                        style: {
                            'font-size': '18px',
                            'font-weight': 'bold',
                            'color': '#ff6b6b',
                            'text-outline-width': 3,
                            'text-outline-color': '#000000'
                        }
                    },
                    {
                        selector: 'node[type="primary"]',
                        style: {
                            'font-size': '16px',
                            'font-weight': '600',
                            'color': '#4ecdc4',
                            'text-outline-width': 2,
                            'text-outline-color': '#000000'
                        }
                    },
                    {
                        selector: 'node[type="secondary"]',
                        style: {
                            'font-size': '14px',
                            'font-weight': '500',
                            'color': '#45b7d1',
                            'text-outline-width': 2,
                            'text-outline-color': '#000000'
                        }
                    },
                    {
                        selector: 'node[type="example"]',
                        style: {
                            'font-size': '12px',
                            'font-weight': '400',
                            'color': '#f9ca24',
                            'text-outline-width': 1,
                            'text-outline-color': '#000000'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'line-color': '#6b7280',
                            'target-arrow-color': '#6b7280',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                            'line-style': 'solid'
                        }
                    }
                ],
                layout: layoutConfig,
                userZoomingEnabled: true,
                userPanningEnabled: true,
                boxSelectionEnabled: true
            });

            cy.on('tap', 'node', (event) => {
                const node = event.target;
                const description = node.data('description');
                const level = node.data('level');
                
                let message = \`📚 \${node.data('label')}\`;
                if (description) {
                    message += \`\\n\\n💡 \${description}\`;
                }
                if (level !== undefined) {
                    const levelNames = ['Central Topic', 'Primary Concept', 'Secondary Concept', 'Example/Detail'];
                    message += \`\\n\\n📊 Level: \${levelNames[level] || \`Level \${level}\`}\`;
                }
                
                alert(message);
            });

            setTimeout(() => {
                cy.fit();
            }, 100);
        }

        function getLayoutConfig() {
            if (typeof dagre !== 'undefined' && typeof cytoscapeDagre !== 'undefined') {
                return {
                    name: 'dagre',
                    nodeSep: 60,
                    edgeSep: 30,
                    rankSep: 100,
                    rankDir: 'TB',
                    align: 'UL',
                    fit: true,
                    padding: 30,
                    minLen: 2,
                    edgeWeight: 1,
                    nodeDimensionsIncludeLabels: true
                };
            } else {
                return {
                    name: 'breadfirst',
                    directed: true,
                    roots: '[type="central"]',
                    fit: true,
                    padding: 30,
                    spacingFactor: 2.0,
                    avoidOverlap: true,
                    nodeDimensionsIncludeLabels: true
                };
            }
        }

        function zoomIn() {
            if (cy) {
                cy.zoom({ level: cy.zoom() * 1.2, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
            }
        }

        function zoomOut() {
            if (cy) {
                cy.zoom({ level: cy.zoom() * 0.8, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
            }
        }

        function fitToScreen() {
            if (cy) {
                cy.fit();
            }
        }

        document.addEventListener('DOMContentLoaded', initializeMindMap);
    </script>
</body>
</html>`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.summaryHelper = new SummaryHelper();
});
