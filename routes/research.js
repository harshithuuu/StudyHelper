const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { saveNote } = require('../db');
const axios = require('axios');
const cheerio = require('cheerio');

const router = express.Router();

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Research endpoint
router.post('/', async (req, res) => {
    try {
        const { topic, depth } = req.body;

        if (!topic) {
            return res.status(400).json({
                success: false,
                error: 'Research topic is required'
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.'
            });
        }

        console.log(`🔍 Starting ${depth} research on: ${topic}`);

        // Generate research based on depth
        const researchPrompt = generateResearchPrompt(topic, depth);
        const result = await model.generateContent(researchPrompt);
        let research = result.response.text();
        
        // Remove all markdown formatting - comprehensive approach
        research = research
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
            .replace(/\*([^*]+)\*/g, '$1') // Remove italic formatting
            .replace(/##\s*/g, '') // Remove heading markers
            .replace(/#\s*/g, '') // Remove single hash
            .replace(/\*\*/g, '') // Remove double asterisks
            .replace(/\*/g, '') // Remove single asterisks
            .replace(/_/g, '') // Remove underscores
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
            .replace(/\s+/g, ' ') // Clean up extra spaces
            .trim();

        // Generate sources based on depth
        const sources = await generateSources(topic, depth);

        // Generate a title for the research
        const titlePrompt = `Create a concise, descriptive title (max 60 characters) for this research report. Focus on the main topic or subject matter. Make it clear and informative for students:

Topic: ${topic}
Research: ${research.substring(0, 200)}...

Provide only the title, no quotes or extra text.`;
        const titleResult = await model.generateContent(titlePrompt);
        const title = titleResult.response.text().trim().replace(/['"]/g, '');

        // Save research to database
        const savedNote = await saveNote(research, 'notes', topic, null, title);

        console.log('✅ Research completed and saved successfully');

        res.json({
            success: true,
            data: {
                research: research,
                sources: sources,
                noteId: savedNote.id
            }
        });

    } catch (error) {
        console.error('❌ Research error:', error);
        
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
            error: 'Failed to complete research. Please try again.'
        });
    }
});

// YouTube summarization endpoint
router.post('/youtube-summary', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'YouTube URL is required'
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.'
            });
        }

        console.log(`🎥 Summarizing YouTube video: ${url}`);

        // Extract video ID from URL
        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid YouTube URL'
            });
        }

        // Get video transcript (simulated - in real implementation, you'd use YouTube API)
        const transcript = await getVideoTranscript(videoId);
        
        // Generate summary
        const summaryPrompt = `Summarize this educational video transcript in a comprehensive, educational format. Focus on key concepts, main points, and learning outcomes. Make it suitable for students:

CRITICAL INSTRUCTION: You must NOT use asterisks (*) anywhere in your response. Do not use any markdown formatting symbols like asterisks (*), underscores (_), hashtags (#), or other formatting characters. Provide only plain text with simple dashes (-) for bullet points if needed.

${transcript}

Use simple dashes (-) for bullet points and avoid ALL asterisks (*) and markdown symbols.`;

        const result = await model.generateContent(summaryPrompt);
        let summary = result.response.text();
        
        // Remove all markdown formatting - multiple passes approach
        summary = summary
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
            .replace(/\*([^*]+)\*/g, '$1') // Remove italic formatting
            .replace(/##\s*/g, '') // Remove heading markers
            .replace(/#\s*/g, '') // Remove single hash
            .replace(/\*\*/g, '') // Remove double asterisks
            .replace(/\*/g, '') // Remove single asterisks
            .replace(/_/g, '') // Remove underscores
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
            .replace(/\s+/g, ' ') // Clean up extra spaces
            .trim();

        // Generate a title for the YouTube summary
        const titlePrompt = `Create a concise, descriptive title (max 60 characters) for this YouTube video summary. Focus on the main topic or subject matter. Make it clear and informative for students:

Video Summary: ${summary.substring(0, 200)}...

Provide only the title, no quotes or extra text.`;
        const titleResult = await model.generateContent(titlePrompt);
        const title = titleResult.response.text().trim().replace(/['"]/g, '');

        // Save summary to database
        const savedNote = await saveNote(summary, 'notes', url, null, title);

        console.log('✅ YouTube video summarized and saved successfully');

        res.json({
            success: true,
            data: {
                summary: summary,
                videoId: videoId,
                noteId: savedNote.id
            }
        });

    } catch (error) {
        console.error('❌ YouTube summary error:', error);
        
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
            error: 'Failed to summarize video. Please try again.'
        });
    }
});

function generateResearchPrompt(topic, depth) {
    const depthInstructions = {
        light: {
            length: '2-3 pages',
            sources: '3-5 reliable sources',
            detail: 'basic overview with key concepts'
        },
        medium: {
            length: '4-6 pages',
            sources: '8-12 authoritative sources',
            detail: 'detailed analysis with examples and case studies'
        },
        deep: {
            length: '7+ pages',
            sources: '15+ comprehensive sources',
            detail: 'comprehensive study with multiple perspectives, historical context, and future implications'
        }
    };

    const config = depthInstructions[depth] || depthInstructions.medium;

    return `Create a comprehensive educational research report on "${topic}". 

Requirements:
- Length: ${config.length}
- Detail Level: ${config.detail}
- Sources: ${config.sources}
- Format: Academic-style report with clear sections
- Focus: Educational content suitable for students

CRITICAL INSTRUCTION: You must NOT use asterisks (*) anywhere in your response. Do not use any markdown formatting symbols like asterisks (*), underscores (_), hashtags (#), or other formatting characters. Provide only plain text with simple dashes (-) for bullet points if needed.

Structure the report with:
1. Executive Summary
2. Introduction and Background
3. Main Concepts and Key Points
4. Examples and Case Studies
5. Current Applications and Relevance
6. Future Implications and Trends
7. Conclusion and Key Takeaways

Make it engaging, informative, and educational. Use clear language and include practical examples. Focus on helping students understand the topic thoroughly. Use simple dashes (-) for bullet points and avoid ALL asterisks (*) and markdown symbols.`;
}

async function generateSources(topic, depth) {
    const sourceCount = {
        light: 3,
        medium: 8,
        deep: 15
    }[depth] || 8;

    // Simulate web search results (in real implementation, you'd use actual web scraping)
    const sources = [];
    
    for (let i = 0; i < sourceCount; i++) {
        sources.push({
            title: `${topic} - Educational Resource ${i + 1}`,
            url: `https://example-education-site.com/${topic.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
            type: i < 2 ? 'academic' : i < 5 ? 'educational' : 'reference'
        });
    }

    return sources;
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

async function getVideoTranscript(videoId) {
    // Simulate getting video transcript
    // In real implementation, you'd use YouTube API or transcript services
    return `This is a simulated transcript for video ${videoId}. In a real implementation, this would be the actual video transcript obtained from YouTube's API or transcript services. The transcript would contain the spoken content of the video, which would then be processed by AI to create an educational summary.`;
}

module.exports = router;
