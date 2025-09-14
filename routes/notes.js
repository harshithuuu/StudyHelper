const express = require('express');
const { getAllNotes, getNoteById, deleteNote, saveNote } = require('../db');

const router = express.Router();

// Get all saved notes
router.get('/', async (req, res) => {
  try {
    console.log('📝 Fetching all notes...');
    
    const notes = await getAllNotes();
    
    console.log(`✅ Retrieved ${notes.length} notes`);
    
    res.json({
      success: true,
      data: notes,
      count: notes.length
    });

  } catch (error) {
    console.error('❌ Error fetching notes:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes. Please try again.'
    });
  }
});

// Get a specific note by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid note ID is required'
      });
    }

    console.log(`📝 Fetching note with ID: ${id}`);
    
    const note = await getNoteById(parseInt(id));
    
    console.log('✅ Note retrieved successfully');
    
    res.json({
      success: true,
      data: note
    });

  } catch (error) {
    console.error('❌ Error fetching note:', error);
    
    if (error.message === 'Note not found') {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note. Please try again.'
    });
  }
});

// Save a manual note
router.post('/', async (req, res) => {
  try {
    const { content, type = 'notes', originalText = null, language = null } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Note content is required'
      });
    }

    if (!['summary', 'translation', 'notes', 'mindmap'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid note type. Must be one of: summary, translation, notes, mindmap'
      });
    }

    console.log(`💾 Saving ${type} note...`);
    
    const savedNote = await saveNote(content, type, originalText, language);
    
    console.log('✅ Note saved successfully');
    
    res.status(201).json({
      success: true,
      data: savedNote
    });

  } catch (error) {
    console.error('❌ Error saving note:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to save note. Please try again.'
    });
  }
});

// Delete a note by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid note ID is required'
      });
    }

    console.log(`🗑️ Deleting note with ID: ${id}`);
    
    const result = await deleteNote(parseInt(id));
    
    console.log('✅ Note deleted successfully');
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error deleting note:', error);
    
    if (error.message === 'Note not found') {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete note. Please try again.'
    });
  }
});

// Get notes by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['summary', 'translation', 'notes', 'mindmap'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid note type. Must be one of: summary, translation, notes, mindmap'
      });
    }

    console.log(`📝 Fetching ${type} notes...`);
    
    const allNotes = await getAllNotes();
    const filteredNotes = allNotes.filter(note => note.type === type);
    
    console.log(`✅ Retrieved ${filteredNotes.length} ${type} notes`);
    
    res.json({
      success: true,
      data: filteredNotes,
      count: filteredNotes.length,
      type
    });

  } catch (error) {
    console.error('❌ Error fetching notes by type:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes. Please try again.'
    });
  }
});

module.exports = router;
