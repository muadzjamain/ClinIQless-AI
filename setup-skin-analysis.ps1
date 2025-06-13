# Setup script for ClinIQless AI Skin Analysis feature
Write-Host "Setting up ClinIQless AI Skin Analysis feature..." -ForegroundColor Green

# Check if .env file exists, if not create it from template
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created .env file. Please edit it to add your API keys." -ForegroundColor Green
    } else {
        Write-Host "Error: .env.example not found!" -ForegroundColor Red
    }
} else {
    Write-Host ".env file already exists." -ForegroundColor Green
}

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
Set-Location -Path "server"
npm install
Set-Location -Path ".."

# Install client dependencies
Write-Host "Installing client dependencies..." -ForegroundColor Yellow
Set-Location -Path "client"
npm install
Set-Location -Path ".."

# Deploy Firebase Storage rules
Write-Host "Deploying Firebase Storage rules..." -ForegroundColor Yellow
firebase deploy --only storage

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "To start the server: cd server; npm run dev" -ForegroundColor Cyan
Write-Host "To start the client: cd client; npm start" -ForegroundColor Cyan
Write-Host "Make sure to update your .env file with your Gemini API key!" -ForegroundColor Yellow
