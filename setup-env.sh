#!/bin/bash
echo "Setting up environment variables for Study Helper..."
echo ""

echo "Creating .env file with your Gemini API key..."
cat > .env << EOF
# Google Gemini API Configuration
GEMINI_API_KEY=AIzaSyCMKNFN_74Tl5IYl27yTeHXcVr9ekYc5mA

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_PATH=./study.db
EOF

echo "✅ Environment file created successfully!"
echo ""
echo "Your Gemini API key has been configured."
echo "You can now start the server with: npm start"
echo ""
