@echo off
echo Setting up environment variables for Study Helper...
echo.

echo Creating .env file with your Gemini API key...
echo # Google Gemini API Configuration > .env
echo GEMINI_API_KEY=AIzaSyCMKNFN_74Tl5IYl27yTeHXcVr9ekYc5mA >> .env
echo. >> .env
echo # Server Configuration >> .env
echo PORT=3000 >> .env
echo NODE_ENV=development >> .env
echo. >> .env
echo # Database Configuration >> .env
echo DB_PATH=./study.db >> .env

echo ✅ Environment file created successfully!
echo.
echo Your Gemini API key has been configured.
echo You can now start the server with: npm start
echo.
pause
