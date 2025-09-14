// Research functionality
class ResearchHelper {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.currentResearch = null;
        this.currentSources = [];
        
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.researchTopic = document.getElementById('researchTopic');
        this.youtubeUrl = document.getElementById('youtubeUrl');
        this.startResearchBtn = document.getElementById('startResearchBtn');
        this.clearResearchBtn = document.getElementById('clearResearchBtn');
        this.summarizeVideoBtn = document.getElementById('summarizeVideoBtn');
        this.researchResults = document.getElementById('researchResults');
        this.sourcesList = document.getElementById('sourcesList');
        this.saveResearchBtn = document.getElementById('saveResearchBtn');
        this.createMindMapBtn = document.getElementById('createMindMapBtn');
        this.downloadResearchBtn = document.getElementById('downloadResearchBtn');
        this.copyResearchBtn = document.getElementById('copyResearchBtn');
    }

    initializeEventListeners() {
        this.startResearchBtn.addEventListener('click', () => this.startResearch());
        this.clearResearchBtn.addEventListener('click', () => this.clearResearch());
        this.summarizeVideoBtn.addEventListener('click', () => this.summarizeVideo());
        this.saveResearchBtn.addEventListener('click', () => this.saveResearch());
        this.createMindMapBtn.addEventListener('click', () => this.createMindMap());
        this.downloadResearchBtn.addEventListener('click', () => this.downloadResearch());
        this.copyResearchBtn.addEventListener('click', () => this.copyResearch());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (this.researchTopic.value.trim()) {
                            this.startResearch();
                        }
                        break;
                }
            }
        });
    }

    async startResearch() {
        const topic = this.researchTopic.value.trim();
        const depth = document.querySelector('input[name="depth"]:checked').value;
        
        if (!topic) {
            commonHelper.showError('Please enter a research topic.');
            return;
        }

        commonHelper.showLoading('Researching topic...');
        this.disableButtons(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/research`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic, depth })
            });

            const data = await response.json();

            if (data.success) {
                this.currentResearch = data.data.research;
                this.currentSources = data.data.sources;
                this.displayResearchResults();
                commonHelper.showMessage('Research completed successfully!', 'success');
            } else {
                commonHelper.showError(data.error || 'Failed to complete research.');
            }
        } catch (error) {
            console.error('Error:', error);
            commonHelper.showError('Network error. Please check your connection and try again.');
        } finally {
            commonHelper.hideLoading();
            this.disableButtons(false);
        }
    }

    async summarizeVideo() {
        const url = this.youtubeUrl.value.trim();
        
        if (!url) {
            commonHelper.showError('Please enter a YouTube URL.');
            return;
        }

        if (!this.isValidYouTubeUrl(url)) {
            commonHelper.showError('Please enter a valid YouTube URL.');
            return;
        }

        commonHelper.showLoading('Summarizing video...');
        this.disableButtons(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/youtube-summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (data.success) {
                this.currentResearch = data.data.summary;
                this.currentSources = [{ title: 'YouTube Video', url: url, type: 'video' }];
                this.displayResearchResults();
                commonHelper.showMessage('Video summarized successfully!', 'success');
            } else {
                commonHelper.showError(data.error || 'Failed to summarize video.');
            }
        } catch (error) {
            console.error('Error:', error);
            commonHelper.showError('Network error. Please check your connection and try again.');
        } finally {
            commonHelper.hideLoading();
            this.disableButtons(false);
        }
    }

    displayResearchResults() {
        if (!this.currentResearch) {
            this.researchResults.innerHTML = `
                <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div class="text-center">
                        <i class="fas fa-search text-4xl mb-4"></i>
                        <p>No research results to display</p>
                    </div>
                </div>
            `;
            return;
        }

        this.researchResults.innerHTML = `
            <div class="prose dark:prose-invert max-w-none">
                <div class="whitespace-pre-wrap text-gray-900 dark:text-white">${this.currentResearch}</div>
            </div>
        `;

        this.displaySources();
    }

    displaySources() {
        if (!this.currentSources || this.currentSources.length === 0) {
            this.sourcesList.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    <i class="fas fa-link text-2xl mb-2"></i>
                    <p class="text-sm">No sources available</p>
                </div>
            `;
            return;
        }

        const html = this.currentSources.map((source, index) => `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            ${source.title || `Source ${index + 1}`}
                        </h4>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">${source.url}</p>
                        ${source.type ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">${source.type}</span>` : ''}
                    </div>
                    <a href="${source.url}" target="_blank" class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
        `).join('');

        this.sourcesList.innerHTML = html;
    }

    async saveResearch() {
        if (!this.currentResearch) {
            commonHelper.showError('No research to save. Please complete research first.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: this.researchTopic.value.trim() || 'Research Notes',
                    content: this.currentResearch,
                    type: 'notes',
                    original_text: this.researchTopic.value.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                commonHelper.showMessage('Research saved successfully!', 'success');
            } else {
                commonHelper.showError('Failed to save research.');
            }
        } catch (error) {
            console.error('Error saving research:', error);
            commonHelper.showError('Network error. Please try again.');
        }
    }

    async createMindMap() {
        if (!this.currentResearch) {
            commonHelper.showError('No research to convert to mind map. Please complete research first.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/files/mindmap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: this.currentResearch })
            });

            const data = await response.json();

            if (data.success) {
                // Open mind map in new tab
                const mindMapWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                
                if (mindMapWindow) {
                    const mindMapHTML = this.generateMindMapViewerHTML(data.data.mindMap, this.researchTopic.value.trim());
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

    downloadResearch() {
        if (!this.currentResearch) {
            commonHelper.showError('No research to download. Please complete research first.');
            return;
        }

        try {
            const content = `# Research: ${this.researchTopic.value.trim()}\n\n${this.currentResearch}\n\n## Sources\n\n${this.currentSources.map((source, index) => `${index + 1}. ${source.title || 'Source'} - ${source.url}`).join('\n')}`;
            
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `research-${this.researchTopic.value.trim().replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            commonHelper.showMessage('Research downloaded successfully!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            commonHelper.showError('Failed to download research.');
        }
    }

    copyResearch() {
        if (!this.currentResearch) {
            commonHelper.showError('No research to copy. Please complete research first.');
            return;
        }

        const content = `Research: ${this.researchTopic.value.trim()}\n\n${this.currentResearch}\n\nSources:\n${this.currentSources.map((source, index) => `${index + 1}. ${source.title || 'Source'} - ${source.url}`).join('\n')}`;
        
        commonHelper.copyToClipboard(content);
        commonHelper.showMessage('Research copied to clipboard!', 'success');
    }

    clearResearch() {
        this.researchTopic.value = '';
        this.youtubeUrl.value = '';
        this.currentResearch = null;
        this.currentSources = [];
        this.displayResearchResults();
        this.displaySources();
    }

    disableButtons(disable) {
        this.startResearchBtn.disabled = disable;
        this.summarizeVideoBtn.disabled = disable;
        this.saveResearchBtn.disabled = disable;
        this.createMindMapBtn.disabled = disable;
        this.downloadResearchBtn.disabled = disable;
        this.copyResearchBtn.disabled = disable;
    }

    isValidYouTubeUrl(url) {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
        return pattern.test(url);
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
    window.researchHelper = new ResearchHelper();
});
