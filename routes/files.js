const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { saveNote } = require('../db');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed!'));
    }
  }
});

// Upload and process files
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    let extractedText = '';

    console.log(`📁 Processing uploaded file: ${req.file.originalname}`);

    if (fileType === 'application/pdf') {
      // Process PDF
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
      
      if (!extractedText.trim()) {
        return res.status(400).json({
          success: false,
          error: 'No text could be extracted from the PDF. The PDF might be image-based or corrupted.'
        });
      }

    } else if (fileType.startsWith('image/')) {
      // Image processing not available without OCR dependencies
      return res.status(501).json({
        success: false,
        error: 'Image text extraction is not available in this version. Please install OCR dependencies or use PDF files instead.'
      });
    }

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    console.log('✅ File processed successfully');

    res.json({
      success: true,
      data: {
        extractedText,
        originalFilename: req.file.originalname,
        fileType,
        textLength: extractedText.length
      }
    });

  } catch (error) {
    console.error('❌ File processing error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process file. Please try again.'
    });
  }
});

// Generate mind map from text
router.post('/mindmap', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text input is required for mind map generation'
      });
    }

    console.log('🧠 Generating mind map structure...');

    // Use Gemini to generate mind map structure
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Create a comprehensive, educational mind map from the following text. The mind map should help students understand the topic structure and relationships clearly. Return ONLY a valid JSON object with this exact structure:

{
  "nodes": [
    {"id": "central", "label": "Main Topic", "type": "central", "level": 0, "description": "Brief description"},
    {"id": "node1", "label": "Primary Concept 1", "type": "primary", "level": 1, "description": "Key details"},
    {"id": "node2", "label": "Primary Concept 2", "type": "primary", "level": 1, "description": "Key details"},
    {"id": "sub1", "label": "Sub-concept 1.1", "type": "secondary", "level": 2, "description": "Specific details"},
    {"id": "sub2", "label": "Sub-concept 1.2", "type": "secondary", "level": 2, "description": "Specific details"},
    {"id": "example1", "label": "Example/Application", "type": "example", "level": 3, "description": "Real-world example"}
  ],
  "edges": [
    {"source": "central", "target": "node1", "relationship": "main_topic"},
    {"source": "central", "target": "node2", "relationship": "main_topic"},
    {"source": "node1", "target": "sub1", "relationship": "includes"},
    {"source": "node1", "target": "sub2", "relationship": "includes"},
    {"source": "sub1", "target": "example1", "relationship": "example_of"}
  ]
}

GUIDELINES:
1. Create 3-5 primary concepts (level 1) branching from the central topic
2. Add 2-3 secondary concepts (level 2) under each primary concept
3. Include specific examples, applications, or details (level 3) where relevant
4. Use clear, educational labels that help students understand the topic
5. Add brief descriptions that explain what each concept means
6. Show relationships between concepts with meaningful edge labels
7. Make it hierarchical and logical for easy learning
8. Focus on the most important concepts that students need to understand

Text to create mind map from:
${text}

Create a mind map that would help a student understand this topic thoroughly. Extract key concepts, their relationships, and organize them in a logical learning structure. Return only the JSON object without any additional formatting or explanation.`;

    const result = await model.generateContent(prompt);
    let mindMapData = result.response.text();
    
    // Clean the response
    mindMapData = mindMapData.split('*').join('').split('_').join('').split('#').join('');
    mindMapData = mindMapData.replace(/\s+/g, ' ').trim();

    // Try to parse as JSON
    try {
      // Clean the response - remove markdown code blocks and extra formatting
      let cleanJson = mindMapData.trim();
      
      // Remove markdown code blocks if present
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any extra text before/after JSON
      const jsonStart = cleanJson.indexOf('{');
      const jsonEnd = cleanJson.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
      }
      
      const mindMap = JSON.parse(cleanJson);
      
      console.log('Parsed mind map:', mindMap);
      console.log('Nodes count:', mindMap.nodes ? mindMap.nodes.length : 0);
      console.log('Edges count:', mindMap.edges ? mindMap.edges.length : 0);
      
      // Validate the mind map structure
      if (!mindMap.nodes || !mindMap.edges || !Array.isArray(mindMap.nodes) || !Array.isArray(mindMap.edges)) {
        throw new Error('Invalid mind map structure received');
      }
      
      // Validate that nodes have labels
      const nodesWithoutLabels = mindMap.nodes.filter(node => !node.label && !node.name);
      if (nodesWithoutLabels.length > 0) {
        console.warn('Some nodes missing labels:', nodesWithoutLabels);
        // Add fallback labels
        mindMap.nodes.forEach((node, index) => {
          if (!node.label && !node.name) {
            node.label = `Concept ${index + 1}`;
          }
        });
      }
      
      // Generate a title for the mind map
      const titlePrompt = `Create a concise, descriptive title (max 60 characters) for this mind map. Focus on the main topic or subject matter. Make it clear and informative for students:

Topic: ${text.substring(0, 200)}...

Provide only the title, no quotes or extra text.`;
      const titleResult = await model.generateContent(titlePrompt);
      const title = titleResult.response.text().trim().replace(/['"]/g, '');

      // Save the mind map to database
      const savedNote = await saveNote(JSON.stringify(mindMap), 'mindmap', text, null, title);

      console.log('✅ Mind map generated and saved successfully');

      res.json({
        success: true,
        data: {
          mindMap,
          noteId: savedNote.id,
          type: 'mindmap'
        }
      });

    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', mindMapData);
      
      // If parsing fails, create a simple fallback mind map
      const fallbackMindMap = {
        nodes: [
          { id: "central", label: "Main Topic", type: "central" },
          { id: "node1", label: "Key Point 1", type: "branch" },
          { id: "node2", label: "Key Point 2", type: "branch" }
        ],
        edges: [
          { source: "central", target: "node1" },
          { source: "central", target: "node2" }
        ]
      };
      
      const savedNote = await saveNote(JSON.stringify(fallbackMindMap), 'mindmap', text, null, 'Mind Map - ' + text.substring(0, 30) + '...');
      
      res.json({
        success: true,
        data: {
          mindMap: fallbackMindMap,
          noteId: savedNote.id,
          type: 'mindmap'
        }
      });
    }

  } catch (error) {
    console.error('❌ Mind map generation error:', error);
    
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
      error: 'Failed to generate mind map. Please try again.'
    });
  }
});

module.exports = router;
