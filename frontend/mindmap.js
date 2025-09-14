// Mind Map functionality
class MindMapHelper {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.cy = null; // Cytoscape instance
        this.mindMapData = null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadRecentMindMaps();
    }

    initializeElements() {
        this.mindmapInput = document.getElementById('mindmapInput');
        this.generateBtn = document.getElementById('generateMindmapBtn');
        this.clearBtn = document.getElementById('clearMindmapBtn');
        this.loadExampleBtn = document.getElementById('loadExampleBtn');
        this.testMindmapBtn = document.getElementById('testMindmapBtn');
        this.mindmapContainer = document.getElementById('mindmapContainer');
        this.recentMindMapsContainer = document.getElementById('recentMindMaps');
        
        // Control buttons
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.fitBtn = document.getElementById('fitBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
    }

    initializeEventListeners() {
        this.generateBtn.addEventListener('click', () => this.generateMindMap());
        this.clearBtn.addEventListener('click', () => this.clearMindMap());
        this.loadExampleBtn.addEventListener('click', () => this.loadExample());
        this.testMindmapBtn.addEventListener('click', () => this.createTestMindMap());
        
        // Control buttons
        this.zoomInBtn.addEventListener('click', () => this.zoomIn());
        this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        this.fitBtn.addEventListener('click', () => this.fitToScreen());
        this.downloadBtn.addEventListener('click', () => this.downloadMindMap());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (this.mindmapInput.value.trim()) {
                            this.generateMindMap();
                        }
                        break;
                    case '=':
                    case '+':
                        e.preventDefault();
                        this.zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        this.zoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        this.fitToScreen();
                        break;
                }
            }
        });
    }

    loadExample() {
        const exampleText = `Photosynthesis is the process by which plants convert light energy into chemical energy. This fundamental biological process occurs in the chloroplasts of plant cells and is essential for life on Earth.

The process begins when chlorophyll molecules in the chloroplasts absorb light energy from the sun. This light energy is used to split water molecules in a process called photolysis, releasing oxygen as a byproduct.

The light-dependent reactions occur in the thylakoid membranes and produce ATP and NADPH, which are energy-carrying molecules. These reactions require sunlight and water.

The light-independent reactions, also known as the Calvin cycle, occur in the stroma of the chloroplasts. They use the ATP and NADPH from the light-dependent reactions to convert carbon dioxide into glucose.

The overall equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This process is crucial for maintaining atmospheric oxygen levels and providing the foundation for most food chains.

Factors affecting photosynthesis include light intensity, carbon dioxide concentration, temperature, and water availability. Understanding these factors helps in agricultural practices and greenhouse management.

Photosynthesis has many practical applications, including improving crop yields, developing renewable energy sources, and understanding climate change impacts on plant life.`;

        this.mindmapInput.value = exampleText;
        this.showMessage('Educational example loaded! Click "Generate Mind Map" to create a comprehensive visualization.', 'success');
    }

    // Test function to create a simple mind map with guaranteed labels
    createTestMindMap() {
        console.log('Creating test mind map...');
        this.mindMapData = {
            nodes: [
                { id: "central", label: "Photosynthesis", type: "central", level: 0, description: "The process of converting light energy to chemical energy" },
                { id: "node1", label: "Light Reactions", type: "primary", level: 1, description: "Convert light energy to ATP and NADPH" },
                { id: "node2", label: "Calvin Cycle", type: "primary", level: 1, description: "Use ATP and NADPH to make glucose" },
                { id: "sub1", label: "Chlorophyll", type: "secondary", level: 2, description: "Pigment that absorbs light" },
                { id: "sub2", label: "ATP Production", type: "secondary", level: 2, description: "Energy storage molecule" }
            ],
            edges: [
                { source: "central", target: "node1", relationship: "main_topic" },
                { source: "central", target: "node2", relationship: "main_topic" },
                { source: "node1", target: "sub1", relationship: "includes" },
                { source: "node1", target: "sub2", relationship: "includes" }
            ]
        };
        
        this.renderMindMap();
        commonHelper.showMessage('Test mind map created!', 'success');
    }

    async generateMindMap() {
        const text = this.mindmapInput.value.trim();
        
        if (!text) {
            commonHelper.showError('Please enter some text to generate a mind map.');
            return;
        }

        commonHelper.showLoading('Generating mind map structure...');
        this.disableButtons(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/files/mindmap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();

            if (data.success) {
                this.mindMapData = data.data.mindMap;
                this.renderMindMap();
                commonHelper.showMessage('Mind map generated successfully!', 'success');
            } else {
                commonHelper.showError(data.error || 'Failed to generate mind map.');
            }
        } catch (error) {
            console.error('Error:', error);
            commonHelper.showError('Network error. Please check your connection and try again.');
        } finally {
            commonHelper.hideLoading();
            this.disableButtons(false);
        }
    }

    renderMindMap() {
        if (!this.mindMapData || !this.mindMapData.nodes || !this.mindMapData.edges) {
            commonHelper.showError('Invalid mind map data received.');
            return;
        }

        // Clear previous visualization
        this.mindmapContainer.innerHTML = '';

        // Check if required libraries are loaded
        if (typeof cytoscape === 'undefined') {
            commonHelper.showError('Cytoscape library not loaded. Please refresh the page.');
            return;
        }

        // Wait for dagre to load if it's not available yet
        if (typeof dagre === 'undefined') {
            console.warn('Dagre not loaded yet, waiting...');
            setTimeout(() => {
                if (typeof dagre === 'undefined') {
                    console.warn('Dagre still not loaded, using fallback layout');
                    this.renderMindMapWithFallback();
                } else {
                    this.renderMindMapWithDagre();
                }
            }, 500);
            return;
        }

        this.renderMindMapWithDagre();
    }

    renderMindMapWithDagre() {
        if (!this.mindMapData || !this.mindMapData.nodes || !this.mindMapData.edges) {
            commonHelper.showError('Invalid mind map data received.');
            return;
        }

        // Clear previous visualization
        this.mindmapContainer.innerHTML = '';

        // Check if required libraries are loaded
        if (typeof cytoscape === 'undefined') {
            commonHelper.showError('Cytoscape library not loaded. Please refresh the page.');
            return;
        }

        // Dagre is optional - we have fallback layouts

        // Try to register cytoscape-dagre extension if available
        let dagreAvailable = false;
        if (typeof dagre !== 'undefined' && typeof cytoscapeDagre !== 'undefined' && cytoscape.use) {
            try {
                cytoscape.use(cytoscapeDagre);
                dagreAvailable = true;
                console.log('Cytoscape-dagre extension registered successfully');
            } catch (error) {
                console.warn('Failed to register cytoscape-dagre extension, using fallback:', error.message);
                dagreAvailable = false;
            }
        } else {
            console.log('Dagre or cytoscape-dagre not available, using fallback layout');
        }

        // Prepare nodes and edges for Cytoscape
        const elements = [];
        
        // Add nodes with enhanced data
        console.log('Mind map data received:', this.mindMapData);
        console.log('Nodes to process:', this.mindMapData.nodes);
        
        this.mindMapData.nodes.forEach((node, index) => {
            console.log(`Processing node ${index}:`, node);
            elements.push({
                data: {
                    id: node.id,
                    label: node.label || node.name || `Node ${index}`, // Fallback for missing labels
                    type: node.type || 'branch',
                    level: node.level || 0,
                    description: node.description || '',
                    relationship: node.relationship || ''
                }
            });
        });
        
        console.log('Elements created:', elements);

        // Ensure we have a central node for fallback layout
        const hasCentralNode = this.mindMapData.nodes.some(node => node.type === 'central');
        if (!hasCentralNode && this.mindMapData.nodes.length > 0) {
            // Mark the first node as central for fallback layout
            const firstNode = elements.find(el => el.data.id === this.mindMapData.nodes[0].id);
            if (firstNode) {
                firstNode.data.type = 'central';
            }
        }

        // Add edges
        console.log('Edges to process:', this.mindMapData.edges);
        this.mindMapData.edges.forEach((edge, index) => {
            console.log(`Processing edge ${index}:`, edge);
            elements.push({
                data: {
                    id: `${edge.source}-${edge.target}`,
                    source: edge.source,
                    target: edge.target,
                    relationship: edge.relationship || ''
                }
            });
        });

        // Initialize Cytoscape
        this.cy = cytoscape({
            container: this.mindmapContainer,
            elements: elements,
            style: [
                // All nodes - simplified with only text labels
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
                // Central node - larger and bold
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
                // Primary concepts - medium size
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
                // Secondary concepts - smaller
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
                // Examples - smallest
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
                // Edge styles based on relationship
                {
                    selector: 'edge[relationship="main_topic"]',
                    style: {
                        'width': 4,
                        'line-color': '#dc2626',
                        'target-arrow-color': '#dc2626',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'line-style': 'solid'
                    }
                },
                {
                    selector: 'edge[relationship="includes"]',
                    style: {
                        'width': 3,
                        'line-color': '#3b82f6',
                        'target-arrow-color': '#3b82f6',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'line-style': 'solid'
                    }
                },
                {
                    selector: 'edge[relationship="example_of"]',
                    style: {
                        'width': 2,
                        'line-color': '#f59e0b',
                        'target-arrow-color': '#f59e0b',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'line-style': 'dashed'
                    }
                },
                // Default edges
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
            layout: this.getLayoutConfig(dagreAvailable),
            userZoomingEnabled: true,
            userPanningEnabled: true,
            boxSelectionEnabled: true
        });

        // Add interactive event listeners
        this.cy.on('tap', 'node', (event) => {
            const node = event.target;
            const description = node.data('description');
            const level = node.data('level');
            const type = node.data('type');
            
            let message = `📚 ${node.data('label')}`;
            if (description) {
                message += `\n\n💡 ${description}`;
            }
            if (level !== undefined) {
                const levelNames = ['Central Topic', 'Primary Concept', 'Secondary Concept', 'Example/Detail'];
                message += `\n\n📊 Level: ${levelNames[level] || `Level ${level}`}`;
            }
            
            commonHelper.showMessage(message, 'info');
        });

        // Add hover effects for better UX
        this.cy.on('mouseover', 'node', (event) => {
            const node = event.target;
            node.style('border-width', '3px');
            node.style('border-color', '#fbbf24');
        });

        this.cy.on('mouseout', 'node', (event) => {
            const node = event.target;
            const type = node.data('type');
            const originalColors = {
                'central': '#991b1b',
                'primary': '#1d4ed8',
                'secondary': '#059669',
                'example': '#d97706'
            };
            node.style('border-color', originalColors[type] || '#4b5563');
            node.style('border-width', type === 'central' ? '3px' : '2px');
        });

        // Fit to screen after layout
        setTimeout(() => {
            this.cy.fit();
        }, 100);
    }

    clearMindMap() {
        if (this.cy) {
            this.cy.destroy();
            this.cy = null;
        }
        this.mindmapContainer.innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div class="text-center">
                    <i class="fas fa-project-diagram text-4xl mb-4"></i>
                    <p>Your mind map will appear here</p>
                </div>
            </div>
        `;
        this.mindMapData = null;
        this.mindmapInput.value = '';
    }

    zoomIn() {
        if (this.cy) {
            this.cy.zoom({
                level: this.cy.zoom() * 1.2,
                renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 }
            });
        }
    }

    zoomOut() {
        if (this.cy) {
            this.cy.zoom({
                level: this.cy.zoom() * 0.8,
                renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 }
            });
        }
    }

    fitToScreen() {
        if (this.cy) {
            this.cy.fit();
        }
    }

    downloadMindMap() {
        if (!this.cy) {
            commonHelper.showError('No mind map to download. Generate a mind map first.');
            return;
        }

        try {
            const png = this.cy.png({
                output: 'blob',
                bg: 'white',
                scale: 2
            });

            const url = URL.createObjectURL(png);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mindmap-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            commonHelper.showMessage('Mind map downloaded successfully!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            commonHelper.showError('Failed to download mind map.');
        }
    }

    getLayoutConfig(dagreAvailable = false) {
        // Use dagre layout if available and working
        if (dagreAvailable) {
            return {
                name: 'dagre',
                nodeSep: 60,
                edgeSep: 30,
                rankSep: 100,
                rankDir: 'TB',
                align: 'UL',
                fit: true,
                padding: 30,
                // Better spacing for educational mind maps
                minLen: 2,
                edgeWeight: 1,
                nodeDimensionsIncludeLabels: true
            };
        } else {
            // Fallback to breadthfirst layout with better spacing
            console.log('Using fallback breadthfirst layout');
            return {
                name: 'breadthfirst',
                directed: true,
                roots: '[type="central"]',
                fit: true,
                padding: 30,
                spacingFactor: 2.0,
                // Better spacing for educational content
                avoidOverlap: true,
                nodeDimensionsIncludeLabels: true
            };
        }
    }

    async loadRecentMindMaps() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notes?type=mindmap&limit=5`);
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                this.displayRecentMindMaps(data.data);
            } else {
                this.recentMindMapsContainer.innerHTML = `
                    <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                        <i class="fas fa-project-diagram text-2xl mb-2"></i>
                        <p class="text-sm">No recent mind maps found</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading recent mind maps:', error);
            this.recentMindMapsContainer.innerHTML = `
                <div class="text-center text-red-500 dark:text-red-400 py-4">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p class="text-sm">Failed to load recent mind maps</p>
                </div>
            `;
        }
    }

    displayRecentMindMaps(mindMaps) {
        const html = mindMaps.map(note => {
            const title = note.title || 'Untitled Mind Map';
            const createdDate = commonHelper.formatDate(note.created_at);
            const preview = commonHelper.truncateText(note.original_text || 'Mind Map', 50);

            return `
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer" 
                     onclick="mindMapHelper.loadRecentMindMap(${note.id})">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">${title}</h4>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${createdDate}</span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400 truncate">${preview}</p>
                </div>
            `;
        }).join('');

        this.recentMindMapsContainer.innerHTML = html;
    }

    async loadRecentMindMap(noteId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notes/${noteId}`);
            const data = await response.json();

            if (data.success && data.data.type === 'mindmap') {
                let mindMapData;
                try {
                    mindMapData = JSON.parse(data.data.content);
                } catch (parseError) {
                    commonHelper.showError('Invalid mind map data. Please try regenerating the mind map.');
                    return;
                }

                this.mindMapData = mindMapData;
                this.renderMindMap();
                commonHelper.showMessage('Recent mind map loaded successfully!', 'success');
            } else {
                commonHelper.showError('This note is not a mind map.');
            }
        } catch (error) {
            console.error('Error loading recent mind map:', error);
            commonHelper.showError('Failed to load recent mind map.');
        }
    }

    disableButtons(disable) {
        this.generateBtn.disabled = disable;
        this.clearBtn.disabled = disable;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mindMapHelper = new MindMapHelper();
});
