# DYNEMITE Study Helper - Deployment Guide

## Render Deployment

### Prerequisites
1. GitHub repository: https://github.com/harshithuuu/StudyHelper.git
2. Render account (free tier available)
3. Google Gemini API key

### Deployment Steps

#### 1. Connect to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select the `harshithuuu/StudyHelper` repository

#### 2. Configure Service
- **Name**: `dynemite-study-helper`
- **Environment**: `Node`
- **Plan**: `Free`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

#### 3. Environment Variables
Set these environment variables in Render dashboard:

```
NODE_ENV=production
PORT=10000
DB_PATH=/opt/render/project/src/study.db
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

#### 4. Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Wait for deployment to complete (5-10 minutes)

### Post-Deployment

#### 1. Test the Application
- Visit your Render URL (e.g., `https://dynemite-study-helper.onrender.com`)
- Test all features:
  - Summarization with note memory
  - Mind map generation
  - Translation
  - Research functionality
  - Notes management

#### 2. Monitor Logs
- Check Render dashboard for any errors
- Monitor application logs for debugging

#### 3. Custom Domain (Optional)
- Add custom domain in Render dashboard
- Configure DNS settings

### Features Available After Deployment

✅ **AI-Powered Summarization** with note memory system
✅ **Interactive Mind Maps** with dark theme
✅ **Multi-language Translation**
✅ **Web Research** with depth control
✅ **YouTube Video Summarization**
✅ **Note Management** with smart organization
✅ **Text Size Controls** for accessibility
✅ **Responsive Design** for all devices

### Troubleshooting

#### Common Issues:
1. **API Key Error**: Ensure GEMINI_API_KEY is set correctly
2. **Database Error**: Check DB_PATH configuration
3. **Build Failures**: Verify all dependencies in package.json
4. **Health Check Failures**: Ensure /api/health endpoint is working

#### Support:
- Check Render logs for detailed error messages
- Verify environment variables are set correctly
- Ensure all dependencies are installed

### Cost
- **Free Tier**: 750 hours/month
- **Sleep Mode**: App sleeps after 15 minutes of inactivity
- **Wake Time**: ~30 seconds to wake from sleep

### Security Notes
- Never commit API keys to repository
- Use environment variables for sensitive data
- Enable HTTPS (automatic with Render)
- Regular security updates recommended