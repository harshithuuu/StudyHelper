// Notes management functionality
class NotesHelper {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.allNotes = [];
        this.filteredNotes = [];
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadNotes();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.typeFilter = document.getElementById('typeFilter');
        this.refreshNotesBtn = document.getElementById('refreshNotesBtn');
        this.exportNotesBtn = document.getElementById('exportNotesBtn');
        this.notesGrid = document.getElementById('notesGrid');
        this.emptyState = document.getElementById('emptyState');
        
        // Modal elements
        this.noteModal = document.getElementById('noteModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalContent = document.getElementById('modalContent');
        this.modalType = document.getElementById('modalType');
        this.modalDate = document.getElementById('modalDate');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.copyNoteBtn = document.getElementById('copyNoteBtn');
        this.deleteNoteBtn = document.getElementById('deleteNoteBtn');
    }

    initializeEventListeners() {
        this.searchInput.addEventListener('input', () => this.filterNotes());
        this.typeFilter.addEventListener('change', () => this.filterNotes());
        this.refreshNotesBtn.addEventListener('click', () => this.loadNotes());
        this.exportNotesBtn.addEventListener('click', () => this.exportNotes());
        
        // Modal events
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.copyNoteBtn.addEventListener('click', () => this.copyCurrentNote());
        this.deleteNoteBtn.addEventListener('click', () => this.deleteCurrentNote());
        
        // Close modal on outside click
        this.noteModal.addEventListener('click', (e) => {
            if (e.target === this.noteModal) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.noteModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    async loadNotes() {
        try {
            commonHelper.showLoading('Loading your notes...');
            
            const response = await fetch(`${this.apiBaseUrl}/notes`);
            const data = await response.json();

            if (data.success) {
                this.allNotes = data.data;
                this.filterNotes();
                commonHelper.showMessage(`Loaded ${this.allNotes.length} notes`, 'success');
            } else {
                commonHelper.showError('Failed to load notes: ' + data.error);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            commonHelper.showError('Network error. Please check your connection.');
        } finally {
            commonHelper.hideLoading();
        }
    }

    filterNotes() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const typeFilter = this.typeFilter.value;

        this.filteredNotes = this.allNotes.filter(note => {
            const matchesSearch = !searchTerm || 
                note.content.toLowerCase().includes(searchTerm) ||
                (note.original_text && note.original_text.toLowerCase().includes(searchTerm));
            
            const matchesType = !typeFilter || note.type === typeFilter;
            
            return matchesSearch && matchesType;
        });

        this.displayNotes();
    }

    displayNotes() {
        if (this.filteredNotes.length === 0) {
            this.notesGrid.innerHTML = '';
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.emptyState.classList.add('hidden');
        
        const html = this.filteredNotes.map(note => this.createNoteCard(note)).join('');
        this.notesGrid.innerHTML = html;
    }

    createNoteCard(note) {
        const typeIcon = commonHelper.getTypeIcon(note.type);
        const typeColor = commonHelper.getTypeColor(note.type);
        const typeLabel = commonHelper.getTypeLabel(note.type);
        const createdDate = commonHelper.formatDate(note.created_at);
        const title = note.title || 'Untitled Note';

        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow max-w-full overflow-hidden">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${typeColor}-100 text-${typeColor}-800 dark:bg-${typeColor}-900/30 dark:text-${typeColor}-200 whitespace-nowrap">
                            <i class="${typeIcon} mr-1"></i>
                            ${typeLabel}
                        </span>
                        ${note.language ? `<span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">→ ${note.language}</span>` : ''}
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">${createdDate}</span>
                </div>
                
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">${title}</h3>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <button 
                            onclick="notesHelper.viewNote(${note.id})" 
                            class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
                        >
                            <i class="fas fa-eye mr-1"></i>View
                        </button>
                        ${note.type === 'mindmap' ? `
                        <button 
                            onclick="notesHelper.viewMindMap(${note.id})" 
                            class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm"
                        >
                            <i class="fas fa-project-diagram mr-1"></i>View Map
                        </button>
                        ` : ''}
                        <button 
                            onclick="notesHelper.copyNote('${note.content.replace(/'/g, "\\'")}')" 
                            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                        >
                            <i class="fas fa-copy mr-1"></i>Copy
                        </button>
                    </div>
                    <button 
                        onclick="notesHelper.deleteNote(${note.id})" 
                        class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    async viewNote(noteId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notes/${noteId}`);
            const data = await response.json();

            if (data.success) {
                this.showNoteModal(data.data);
            } else {
                commonHelper.showError('Failed to load note: ' + data.error);
            }
        } catch (error) {
            console.error('Error loading note:', error);
            commonHelper.showError('Network error. Please try again.');
        }
    }

    async viewMindMap(noteId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notes/${noteId}`);
            const data = await response.json();

            if (data.success && data.data.type === 'mindmap') {
                // Parse the mind map data
                let mindMapData;
                try {
                    mindMapData = JSON.parse(data.data.content);
                } catch (parseError) {
                    commonHelper.showError('Invalid mind map data. Please try regenerating the mind map.');
                    return;
                }

                // Open mind map in a new tab/window
                this.openMindMapViewer(mindMapData, data.data.original_text || 'Mind Map');
            } else {
                commonHelper.showError('This note is not a mind map or failed to load.');
            }
        } catch (error) {
            console.error('Error loading mind map:', error);
            commonHelper.showError('Network error. Please try again.');
        }
    }

    openMindMapViewer(mindMapData, originalText) {
        // Create a new window with mind map viewer
        const mindMapWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        
        if (!mindMapWindow) {
            commonHelper.showError('Please allow popups to view mind maps in a new window.');
            return;
        }

        // Generate HTML for the mind map viewer
        const mindMapHTML = this.generateMindMapViewerHTML(mindMapData, originalText);
        
        mindMapWindow.document.write(mindMapHTML);
        mindMapWindow.document.close();
        
        // Focus the new window
        mindMapWindow.focus();
    }

    generateMindMapViewerHTML(mindMapData, originalText) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mind Map Viewer</title>
    <script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"></script>
    <script src="https://unpkg.com/dagre@0.8.5/dist/dagre.min.js"></script>
    <script src="https://unpkg.com/cytoscape-dagre@2.5.0/cytoscape-dagre.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        #cy { width: 100%; height: 600px; border: 1px solid #e5e7eb; }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <div class="p-6">
        <div class="mb-4">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                <i class="fas fa-project-diagram text-orange-600 mr-2"></i>
                Mind Map Viewer
            </h1>
            <p class="text-gray-600 dark:text-gray-400">${originalText}</p>
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
                    <button onclick="downloadMindMap()" class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm">
                        <i class="fas fa-download mr-1"></i>Download
                    </button>
                </div>
            </div>
            <div id="cy"></div>
        </div>
        
        <div class="mt-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>Click on any node to see detailed information</p>
        </div>
    </div>

    <script>
        let cy;
        const mindMapData = ${JSON.stringify(mindMapData)};

        function initializeMindMap() {
            // Check if required libraries are loaded
            if (typeof cytoscape === 'undefined') {
                alert('Cytoscape library not loaded');
                return;
            }

            // Register cytoscape-dagre extension if available
            if (typeof dagre !== 'undefined' && typeof cytoscapeDagre !== 'undefined' && cytoscape.use) {
                try {
                    cytoscape.use(cytoscapeDagre);
                    console.log('Cytoscape-dagre extension registered successfully');
                } catch (error) {
                    console.warn('Failed to register cytoscape-dagre extension:', error);
                }
            }

            // Prepare elements
            const elements = [];
            
            // Add nodes
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

            // Add edges
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

            // Get layout config
            const layoutConfig = getLayoutConfig();

            // Initialize Cytoscape
            cy = cytoscape({
                container: document.getElementById('cy'),
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
                            'color': '#1f2937',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'text-outline-width': 2,
                            'text-outline-color': '#ffffff',
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
                            'color': '#dc2626',
                            'text-outline-width': 3,
                            'text-outline-color': '#ffffff'
                        }
                    },
                    // Primary concepts - medium size
                    {
                        selector: 'node[type="primary"]',
                        style: {
                            'font-size': '16px',
                            'font-weight': '600',
                            'color': '#2563eb',
                            'text-outline-width': 2,
                            'text-outline-color': '#ffffff'
                        }
                    },
                    // Secondary concepts - smaller
                    {
                        selector: 'node[type="secondary"]',
                        style: {
                            'font-size': '14px',
                            'font-weight': '500',
                            'color': '#059669',
                            'text-outline-width': 2,
                            'text-outline-color': '#ffffff'
                        }
                    },
                    // Examples - smallest
                    {
                        selector: 'node[type="example"]',
                        style: {
                            'font-size': '12px',
                            'font-weight': '400',
                            'color': '#d97706',
                            'text-outline-width': 1,
                            'text-outline-color': '#ffffff'
                        }
                    },
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

            // Add event listeners
            cy.on('tap', 'node', (event) => {
                const node = event.target;
                const description = node.data('description');
                const level = node.data('level');
                const type = node.data('type');
                
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

            // Fit to screen after layout
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
                    name: 'breadthfirst',
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

        function downloadMindMap() {
            if (!cy) {
                alert('No mind map to download');
                return;
            }

            try {
                const png = cy.png({ output: 'blob', bg: 'white', scale: 2 });
                const url = URL.createObjectURL(png);
                const link = document.createElement('a');
                link.href = url;
                link.download = \`mindmap-\${Date.now()}.png\`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                alert('Mind map downloaded successfully!');
            } catch (error) {
                console.error('Download error:', error);
                alert('Failed to download mind map');
            }
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', initializeMindMap);
    </script>
</body>
</html>`;
    }

    showNoteModal(note) {
        this.currentNote = note;
        
        const typeIcon = commonHelper.getTypeIcon(note.type);
        const typeColor = commonHelper.getTypeColor(note.type);
        const typeLabel = commonHelper.getTypeLabel(note.type);
        const createdDate = commonHelper.formatDate(note.created_at);
        const title = note.title || 'Untitled Note';

        this.modalTitle.textContent = `${title} - ${typeLabel}`;
        
        // Handle different content types
        let contentHtml = '';
        if (note.type === 'mindmap') {
            // For mind maps, show a message instead of JSON data
            contentHtml = `
                <div class="text-center py-8">
                    <i class="fas fa-project-diagram text-6xl text-orange-500 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Mind Map</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">This is a mind map visualization. Click "View Mind Map" to see the interactive diagram.</p>
                    <button 
                        onclick="window.notesHelper.viewMindMap('${note.id}')" 
                        class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <i class="fas fa-eye mr-2"></i>
                        View Mind Map
                    </button>
                </div>
            `;
        } else {
            contentHtml = `<div class="whitespace-pre-wrap break-words text-white">${note.content}</div>`;
        }
        
        this.modalContent.innerHTML = contentHtml;
        
        this.modalType.innerHTML = `
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${typeColor}-100 text-${typeColor}-800 dark:bg-${typeColor}-900/30 dark:text-${typeColor}-200">
                <i class="${typeIcon} mr-1"></i>
                ${typeLabel}
            </span>
        `;
        
        this.modalDate.textContent = createdDate;
        this.noteModal.classList.remove('hidden');
    }

    closeModal() {
        this.noteModal.classList.add('hidden');
        this.currentNote = null;
    }

    copyNote(text) {
        commonHelper.copyToClipboard(text);
    }

    copyCurrentNote() {
        if (this.currentNote) {
            this.copyNote(this.currentNote.content);
        }
    }

    async deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/notes/${noteId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                commonHelper.showMessage('Note deleted successfully', 'success');
                this.loadNotes(); // Reload notes
                if (this.currentNote && this.currentNote.id === noteId) {
                    this.closeModal();
                }
            } else {
                commonHelper.showError('Failed to delete note: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            commonHelper.showError('Network error. Please try again.');
        }
    }

    deleteCurrentNote() {
        if (this.currentNote) {
            this.deleteNote(this.currentNote.id);
        }
    }

    exportNotes() {
        if (this.allNotes.length === 0) {
            commonHelper.showError('No notes to export.');
            return;
        }

        try {
            const exportData = {
                exportedAt: new Date().toISOString(),
                totalNotes: this.allNotes.length,
                notes: this.allNotes.map(note => ({
                    type: note.type,
                    content: note.content,
                    originalText: note.original_text,
                    language: note.language,
                    createdAt: note.created_at
                }))
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `study-helper-notes-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            commonHelper.showMessage('Notes exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            commonHelper.showError('Failed to export notes.');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notesHelper = new NotesHelper();
});
