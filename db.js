const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './study.db';

let db;

// Initialize database connection
function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        throw err;
      }
      console.log('📊 Connected to SQLite database');
    });
  }
  return db;
}

// Initialize database tables
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    // First, check if we need to migrate the existing table
    database.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='notes'", (err, row) => {
      if (err) {
        console.error('❌ Error checking table schema:', err.message);
        reject(err);
        return;
      }

      if (row && row.sql && (!row.sql.includes("'mindmap'") || !row.sql.includes('title'))) {
        // Need to migrate the table to include mindmap type and title column
        console.log('🔄 Migrating notes table to support mindmap type and title column...');
        migrateNotesTable(database, resolve, reject);
      } else {
        // Table is up to date, proceed with normal initialization
        createOrVerifyTable(database, resolve, reject);
      }
    });
  });
}

function migrateNotesTable(database, resolve, reject) {
  // Simply add the title column to existing table
  database.serialize(() => {
    // Add title column if it doesn't exist
    database.run(`ALTER TABLE notes ADD COLUMN title TEXT`, (err) => {
      // Ignore error if column already exists
      if (err && !err.message.includes('duplicate column name')) {
        console.warn('⚠️ Warning adding title column:', err.message);
      }
      
      console.log('✅ Migration completed successfully');
      createIndexes(database, resolve, reject);
    });
  });
}

function createOrVerifyTable(database, resolve, reject) {
  const createNotesTable = `
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('summary', 'translation', 'notes', 'mindmap')),
      original_text TEXT,
      language TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  database.serialize(() => {
    database.run(createNotesTable, (err) => {
      if (err) {
        console.error('❌ Error creating notes table:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Notes table created/verified');
      
      // Add title column if it doesn't exist
      database.run(`ALTER TABLE notes ADD COLUMN title TEXT`, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.warn('⚠️ Warning adding title column:', err.message);
        }
        createIndexes(database, resolve, reject);
      });
    });
  });
}

function createIndexes(database, resolve, reject) {
  const createIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type)',
    'CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)'
  ];

  let indexCount = 0;
  createIndexes.forEach((indexSQL) => {
    database.run(indexSQL, (err) => {
      if (err) {
        console.error('❌ Error creating index:', err.message);
        reject(err);
        return;
      }
      indexCount++;
      if (indexCount === createIndexes.length) {
        console.log('✅ Database indexes created/verified');
        console.log('✅ Database initialized successfully');
        resolve();
      }
    });
  });
}

// Save a note to the database
async function saveNote(content, type, originalText = null, language = null, title = null) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    const insertSQL = `
      INSERT INTO notes (title, content, type, original_text, language)
      VALUES (?, ?, ?, ?, ?)
    `;

    database.run(insertSQL, [title, content, type, originalText, language], function(err) {
      if (err) {
        console.error('❌ Error saving note:', err.message);
        reject(err);
        return;
      }
      
      console.log(`✅ Note saved with ID: ${this.lastID}`);
      resolve({
        id: this.lastID,
        content,
        type,
        originalText,
        language,
        createdAt: new Date().toISOString()
      });
    });
  });
}

// Get all notes from the database
async function getAllNotes() {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    const selectSQL = `
      SELECT id, content, type, original_text, language, created_at, updated_at
      FROM notes
      ORDER BY created_at DESC
    `;

    database.all(selectSQL, [], (err, rows) => {
      if (err) {
        console.error('❌ Error fetching notes:', err.message);
        reject(err);
        return;
      }
      
      console.log(`✅ Fetched ${rows.length} notes`);
      resolve(rows);
    });
  });
}

// Get a specific note by ID
async function getNoteById(id) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    const selectSQL = `
      SELECT id, content, type, original_text, language, created_at, updated_at
      FROM notes
      WHERE id = ?
    `;

    database.get(selectSQL, [id], (err, row) => {
      if (err) {
        console.error('❌ Error fetching note:', err.message);
        reject(err);
        return;
      }
      
      if (!row) {
        reject(new Error('Note not found'));
        return;
      }
      
      resolve(row);
    });
  });
}

// Delete a note by ID
async function deleteNote(id) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    const deleteSQL = 'DELETE FROM notes WHERE id = ?';

    database.run(deleteSQL, [id], function(err) {
      if (err) {
        console.error('❌ Error deleting note:', err.message);
        reject(err);
        return;
      }
      
      if (this.changes === 0) {
        reject(new Error('Note not found'));
        return;
      }
      
      console.log(`✅ Note with ID ${id} deleted`);
      resolve({ id, deleted: true });
    });
  });
}

// Close database connection
function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
        return;
      }
      console.log('📊 Database connection closed');
    });
  }
}

module.exports = {
  getDatabase,
  initializeDatabase,
  saveNote,
  getAllNotes,
  getNoteById,
  deleteNote,
  closeDatabase
};
