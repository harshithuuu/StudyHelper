const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { saveNote } = require('../db');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Summarize text using Gemini
router.post('/summarize', async (req, res) => {
  try {
    const { text, depth = 'detailed', selectedNotes = [] } = req.body;

    if ((!text || text.trim().length === 0) && selectedNotes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text input or selected notes are required for summarization'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.'
      });
    }

    console.log(`🤖 Generating ${depth} summary with Gemini...`);

    const depthInstructions = {
      brief: 'Provide a brief summary focusing only on the most essential points. Keep it to 1-2 paragraphs maximum. Highlight only the key takeaways.',
      detailed: 'Provide a detailed summary covering the main points and key concepts. Aim for 3-5 paragraphs with good coverage of important information.',
      comprehensive: 'Provide a comprehensive summary with in-depth analysis, examples, and detailed explanations. Aim for 5+ paragraphs with thorough coverage of all aspects.'
    };

    // Combine selected notes content
    let combinedContent = text || '';
    let contextInfo = '';

    if (selectedNotes.length > 0) {
      contextInfo = `\n\nPrevious Notes Context:\n`;
      selectedNotes.forEach((note, index) => {
        contextInfo += `\n--- Note ${index + 1}: ${note.title} (${note.type}) ---\n`;
        contextInfo += `${note.content}\n`;
      });
    }

    const fullContent = combinedContent + contextInfo;

    const prompt = `You are a helpful study assistant. ${depthInstructions[depth]} Summarize the given content into clear, educational notes that are easy to understand and remember.

CRITICAL INSTRUCTION: You must NOT use asterisks (*) anywhere in your response. Do not use any markdown formatting symbols like asterisks (*), underscores (_), hashtags (#), or other formatting characters. Provide only plain text with simple dashes (-) for bullet points if needed.

Content to summarize:
${fullContent}

Please provide a clear, well-structured summary that highlights the main points and key information according to the ${depth} level requested. If multiple notes are provided, synthesize the information across all sources to create a cohesive summary. Use simple dashes (-) for bullet points and avoid ALL asterisks (*) and markdown symbols.`;

    const result = await model.generateContent(prompt);
    let summary = result.response.text();
    
    // Remove all asterisks and other markdown formatting
    summary = summary.split('*').join('').split('_').join('').split('#').join('');
    // Clean up any extra spaces that might be left
    summary = summary.replace(/\s+/g, ' ').trim();

    // Generate a title for the summary
    const titlePrompt = `Create a concise, descriptive title (max 60 characters) for this educational summary. Focus on the main topic or subject matter. Make it clear and informative for students:

Summary: ${summary.substring(0, 300)}...
${selectedNotes.length > 0 ? `Based on ${selectedNotes.length} previous note(s)` : ''}

Provide only the title, no quotes or extra text.`;
    const titleResult = await model.generateContent(titlePrompt);
    const title = titleResult.response.text().trim().replace(/['"]/g, '');

    // Save the summary to database
    const originalText = text || selectedNotes.map(note => `${note.title}: ${note.content}`).join('\n\n');
    const savedNote = await saveNote(summary, 'summary', originalText, null, title);

    console.log('✅ Text summarized and saved successfully');

    res.json({
      success: true,
      summary,
      data: {
        summary,
        noteId: savedNote.id,
        type: 'summary'
      }
    });

  } catch (error) {
    console.error('❌ Error in summarization:', error);
    
    // Handle specific Gemini API errors
    if (error.message && error.message.includes('API key')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Gemini API key. Please check your configuration.'
      });
    }
    
    if (error.message && error.message.includes('quota')) {
      return res.status(402).json({
        success: false,
        error: 'Gemini API quota exceeded. Please check your billing.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to summarize text. Please try again.'
    });
  }
});

// Translate text using Gemini
router.post('/translate', async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text input is required for translation'
      });
    }

    if (!language || language.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Target language is required for translation'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.'
      });
    }

    console.log(`🌍 Translating text to ${language} with Gemini...`);

    const prompt = `You are a professional translator. Translate the given text accurately and naturally into ${language}. Maintain the original meaning and context while ensuring the translation sounds natural in the target language.

CRITICAL INSTRUCTION: You must NOT use asterisks (*) anywhere in your response. Do not use any markdown formatting symbols like asterisks (*), underscores (_), hashtags (#), or other formatting characters. Provide only plain text.

Text to translate:
${text}

Please provide only the translation without any additional commentary, explanation, or formatting symbols.`;

    const result = await model.generateContent(prompt);
    let translation = result.response.text();
    
    // Remove all asterisks and other markdown formatting
    translation = translation.split('*').join('').split('_').join('').split('#').join('');
    // Clean up any extra spaces that might be left
    translation = translation.replace(/\s+/g, ' ').trim();

    // Generate a title for the translation
    const titlePrompt = `Create a concise, descriptive title (max 60 characters) for this ${language} translation. Focus on the main topic or subject matter. Make it clear and informative for students:

Translation: ${translation.substring(0, 300)}...

Provide only the title, no quotes or extra text.`;
    const titleResult = await model.generateContent(titlePrompt);
    const title = titleResult.response.text().trim().replace(/['"]/g, '');

    // Save the translation to database
    const savedNote = await saveNote(translation, 'translation', text, language, title);

    console.log('✅ Text translated and saved successfully');

    res.json({
      success: true,
      data: {
        translation,
        originalText: text,
        language,
        noteId: savedNote.id,
        type: 'translation'
      }
    });

  } catch (error) {
    console.error('❌ Error in translation:', error);
    
    // Handle specific Gemini API errors
    if (error.message && error.message.includes('API key')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Gemini API key. Please check your configuration.'
      });
    }
    
    if (error.message && error.message.includes('quota')) {
      return res.status(402).json({
        success: false,
        error: 'Gemini API quota exceeded. Please check your billing.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to translate text. Please try again.'
    });
  }
});

// Generate revision notes using Gemini
router.post('/revision-notes', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text input is required for revision notes generation'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.'
      });
    }

    console.log('📚 Generating revision notes with Gemini...');

    const prompt = `You are an expert study coach. Create comprehensive revision notes from the given text. Include key concepts, definitions, examples, and study tips. Format the notes in a clear, structured way that's perfect for revision and exam preparation.

CRITICAL INSTRUCTION: You must NOT use asterisks (*) anywhere in your response. Do not use any markdown formatting symbols like asterisks (*), underscores (_), hashtags (#), or other formatting characters. Provide only plain text with simple dashes (-) for bullet points.

Text to create revision notes from:
${text}

Please create detailed, well-organized revision notes that include:
- Key concepts and main ideas
- Important definitions
- Relevant examples
- Study tips and memory aids
- Summary points for quick review

Format the notes in a clear, hierarchical structure that's easy to study from. Use simple dashes (-) for bullet points and avoid ALL asterisks (*) and markdown symbols.`;

    const result = await model.generateContent(prompt);
    let revisionNotes = result.response.text();
    
    // Remove all asterisks and other markdown formatting
    revisionNotes = revisionNotes.split('*').join('').split('_').join('').split('#').join('');
    // Clean up any extra spaces that might be left
    revisionNotes = revisionNotes.replace(/\s+/g, ' ').trim();

    // Generate a title for the revision notes
    const titlePrompt = `Create a concise, descriptive title (max 60 characters) for these revision notes. Focus on the main topic or subject matter. Make it clear and informative for students:

Notes: ${revisionNotes.substring(0, 300)}...

Provide only the title, no quotes or extra text.`;
    const titleResult = await model.generateContent(titlePrompt);
    const title = titleResult.response.text().trim().replace(/['"]/g, '');

    // Save the revision notes to database
    const savedNote = await saveNote(revisionNotes, 'notes', text, null, title);

    console.log('✅ Revision notes generated and saved successfully');

    res.json({
      success: true,
      data: {
        revisionNotes,
        noteId: savedNote.id,
        type: 'notes'
      }
    });

  } catch (error) {
    console.error('❌ Error in revision notes generation:', error);
    
    // Handle specific Gemini API errors
    if (error.message && error.message.includes('API key')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Gemini API key. Please check your configuration.'
      });
    }
    
    if (error.message && error.message.includes('quota')) {
      return res.status(402).json({
        success: false,
        error: 'Gemini API quota exceeded. Please check your billing.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate revision notes. Please try again.'
    });
  }
});

module.exports = router;
