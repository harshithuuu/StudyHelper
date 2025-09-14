# Deployment Guide

This guide will help you deploy the Study Helper application to various platforms.

## Prerequisites

- Node.js (version 16 or higher)
- OpenAI API key
- Git repository (GitHub, GitLab, etc.)

## Environment Variables

Before deploying, make sure to set up the following environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=10000  # or the port assigned by your hosting platform
DB_PATH=/opt/render/project/src/study.db  # adjust path as needed
```

## Backend Deployment

### Option 1: Render (Recommended)

1. **Create a Render account** at [render.com](https://render.com)

2. **Connect your repository**
   - Click "New" → "Web Service"
   - Connect your GitHub/GitLab repository
   - Select the repository containing this project

3. **Configure the service**
   ```
   Name: study-helper-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set environment variables**
   - Go to the "Environment" tab
   - Add the following variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `NODE_ENV`: production
     - `PORT`: 10000
     - `DB_PATH`: /opt/render/project/src/study.db

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the URL (e.g., `https://study-helper-backend.onrender.com`)

### Option 2: Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Set environment variables**
   ```bash
   railway variables set OPENAI_API_KEY=your_api_key
   railway variables set NODE_ENV=production
   ```

4. **Get your deployment URL**
   ```bash
   railway domain
   ```

### Option 3: Heroku

1. **Install Heroku CLI** from [heroku.com](https://heroku.com)

2. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables**
   ```bash
   heroku config:set OPENAI_API_KEY=your_api_key
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## Frontend Deployment

### Option 1: Netlify (Recommended)

1. **Create a Netlify account** at [netlify.com](https://netlify.com)

2. **Deploy from Git**
   - Click "New site from Git"
   - Connect your repository
   - Set build settings:
     ```
     Build command: echo "Frontend is already built"
     Publish directory: frontend
     ```

3. **Set environment variables** (if needed)
   - Go to Site settings → Environment variables
   - Add any frontend-specific variables

4. **Update API URL**
   - Edit `frontend/script.js`
   - Change `this.apiBaseUrl` to point to your backend URL:
     ```javascript
     this.apiBaseUrl = 'https://your-backend-url.com/api';
     ```

### Option 2: Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy frontend**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Update API URL** in `frontend/script.js` as mentioned above

### Option 3: GitHub Pages

1. **Enable GitHub Pages** in your repository settings

2. **Set source** to "Deploy from a branch" and select "main" branch

3. **Set folder** to "frontend"

4. **Update API URL** in `frontend/script.js`

## Full-Stack Deployment

### Option 1: Vercel (Full-Stack)

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Set environment variables** in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `NODE_ENV=production`

3. **Configure build settings**:
   ```
   Build Command: npm install
   Output Directory: .
   Install Command: npm install
   ```

### Option 2: Netlify Functions

1. **Create `netlify/functions/` directory**

2. **Move API routes** to Netlify functions format

3. **Deploy** with Netlify CLI:
   ```bash
   netlify deploy --prod
   ```

## Domain Configuration

### Custom Domain Setup

1. **Purchase a domain** from any registrar

2. **Configure DNS**
   - Point your domain to your hosting platform
   - Follow platform-specific instructions

3. **SSL Certificate**
   - Most platforms provide free SSL certificates
   - Enable HTTPS in your platform settings

## Monitoring and Maintenance

### Health Checks

The application includes a health check endpoint at `/api/health`. Configure your hosting platform to use this for monitoring.

### Database Backups

For SQLite databases:
- Regular backups are recommended
- Most platforms handle this automatically
- Consider migrating to PostgreSQL for production use

### Logs and Monitoring

- Monitor application logs in your hosting platform
- Set up error tracking (e.g., Sentry)
- Monitor API usage and costs

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

2. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names for typos
   - Verify API keys are valid

3. **CORS Issues**
   - Update frontend API URL to match backend
   - Check CORS configuration in server.js

4. **Database Issues**
   - Verify database file permissions
   - Check database path configuration
   - Ensure database directory exists

### Getting Help

- Check platform-specific documentation
- Review application logs
- Test locally first
- Use platform support channels

## Cost Optimization

### Free Tier Limits

- **Render**: 750 hours/month free
- **Railway**: $5 credit monthly
- **Netlify**: 100GB bandwidth free
- **Vercel**: 100GB bandwidth free

### Optimization Tips

- Use efficient AI prompts to reduce token usage
- Implement caching for repeated requests
- Optimize frontend assets
- Monitor API usage and costs

## Security Considerations

- Never commit API keys to version control
- Use environment variables for all secrets
- Enable HTTPS in production
- Implement rate limiting for API endpoints
- Regular security updates for dependencies

---

For more detailed platform-specific instructions, refer to the official documentation of your chosen hosting platform.
