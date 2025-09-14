// Simple test script to verify the setup
const { initializeDatabase, saveNote, getAllNotes } = require('./db');

async function testSetup() {
  console.log('🧪 Testing Study Helper Setup...\n');

  try {
    // Test database initialization
    console.log('1. Testing database initialization...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully\n');

    // Test saving a note
    console.log('2. Testing note saving...');
    const testNote = await saveNote(
      'This is a test summary for the Study Helper application.',
      'summary',
      'Original text for testing purposes.',
      null
    );
    console.log('✅ Note saved successfully with ID:', testNote.id, '\n');

    // Test retrieving notes
    console.log('3. Testing note retrieval...');
    const notes = await getAllNotes();
    console.log(`✅ Retrieved ${notes.length} note(s) successfully\n`);

    // Test environment variables
    console.log('4. Testing environment variables...');
    if (process.env.GEMINI_API_KEY) {
      console.log('✅ Gemini API key is configured');
    } else {
      console.log('⚠️  Gemini API key not found - set GEMINI_API_KEY in .env file');
    }
    console.log(`✅ Server port: ${process.env.PORT || 3000}`);
    console.log(`✅ Database path: ${process.env.DB_PATH || './study.db'}\n`);

    console.log('🎉 All tests passed! The Study Helper is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Set your GEMINI_API_KEY in the .env file');
    console.log('2. Run: npm start');
    console.log('3. Open: http://localhost:3000');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSetup();
