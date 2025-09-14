# Study & Preparation Helper

A comprehensive web application that helps students and learners by providing AI-powered summarization, translation, and revision note generation capabilities.

## Features

- **AI-Powered Summarization**: Convert long texts into concise, easy-to-understand summaries
- **Smart Translation**: Translate text into multiple languages using advanced AI
- **Revision Notes Generation**: Create comprehensive study notes from any text
- **Note Management**: Save, organize, and manage all your generated notes
- **Light/Dark Mode**: Toggle between light and dark themes for comfortable studying
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Keyboard Shortcuts**: Quick access to features with keyboard shortcuts

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite with automatic table creation
- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **AI Integration**: Google Gemini Pro API
- **Deployment**: Ready for Render/Railway (backend) and Netlify/Vercel (frontend)

## Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd study-preparation-helper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file and add your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   NODE_ENV=development
   DB_PATH=./study.db
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## API Endpoints

### AI Operations
- `POST /api/ai/summarize` - Summarize text
- `POST /api/ai/translate` - Translate text to specified language
- `POST /api/ai/revision-notes` - Generate revision notes

### Notes Management
- `GET /api/notes` - Get all saved notes
- `GET /api/notes/:id` - Get specific note by ID
- `POST /api/notes` - Save a manual note
- `DELETE /api/notes/:id` - Delete a note
- `GET /api/notes/type/:type` - Get notes by type (summary/translation/notes)

### Health Check
- `GET /api/health` - Check API status

## Usage

### Summarization
1. Paste your text in the input area
2. Click "Summarize" button
3. View the generated summary in the results area
4. The summary is automatically saved to your notes

### Translation
1. Paste your text in the input area
2. Select target language from the dropdown
3. Click "Translate" button
4. View the translation in the results area
5. The translation is automatically saved to your notes

### Revision Notes
1. Paste your study material in the input area
2. Click "Revision Notes" button
3. View the comprehensive revision notes
4. The notes are automatically saved to your notes

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter`: Summarize text
- `Ctrl/Cmd + T`: Translate text
- `Ctrl/Cmd + R`: Generate revision notes

## Database Schema

The application uses SQLite with the following table structure:

```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('summary', 'translation', 'notes')),
    original_text TEXT,
    language TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment

### Backend Deployment (Render/Railway)

1. **Prepare for deployment**
   - Ensure your `.env` file contains production environment variables
   - The database file will be created automatically

2. **Deploy to Render**
   ```bash
   # Connect your repository to Render
   # Set environment variables in Render dashboard
   OPENAI_API_KEY=your_openai_api_key
   NODE_ENV=production
   PORT=10000
   ```

3. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway deploy
   ```

### Frontend Deployment (Netlify/Vercel)

1. **Build the frontend**
   ```bash
   # The frontend is already built and ready
   # Just upload the frontend folder contents
   ```

2. **Deploy to Netlify**
   - Drag and drop the `frontend` folder to Netlify
   - Or connect your repository and set build directory to `frontend`

3. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy frontend folder
   cd frontend
   vercel --prod
   ```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI operations | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `DB_PATH` | SQLite database file path | No | ./study.db |

## Development

### Project Structure
```
study-preparation-helper/
├── server.js              # Main server file
├── db.js                  # Database configuration and operations
├── routes/
│   ├── ai.js             # AI-related API routes
│   └── notes.js          # Notes management API routes
├── frontend/
│   ├── index.html        # Main HTML file
│   └── script.js         # Frontend JavaScript
├── package.json          # Dependencies and scripts
├── env.example           # Environment variables template
└── README.md            # This file
```

### Adding New Features

1. **Backend**: Add new routes in the `routes/` directory
2. **Frontend**: Extend the `StudyHelper` class in `script.js`
3. **Database**: Modify `db.js` for new database operations

### Testing

```bash
# Start the development server
npm run dev

# Test API endpoints
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text here"}'
```

## Troubleshooting

### Common Issues

1. **OpenAI API Key Error**
   - Ensure your API key is correctly set in the `.env` file
   - Check that you have sufficient API credits

2. **Database Connection Error**
   - Ensure the application has write permissions in the project directory
   - Check that SQLite is properly installed

3. **CORS Issues**
   - The application includes CORS middleware
   - Ensure your frontend and backend are on the same domain or properly configured

### Support

For issues and questions:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed properly

## License

MIT License - feel free to use this project for educational and personal purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ for students everywhere. Happy studying! 📚
