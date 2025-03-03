#!/bin/bash

# FlexiBill Project Setup Script

echo "🚀 Starting FlexiBill project setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version $(node -v) detected"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd flexibill/backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed"

# Install mobile dependencies
echo "📦 Installing mobile dependencies..."
cd ../mobile
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install mobile dependencies"
    exit 1
fi
echo "✅ Mobile dependencies installed"

# Return to project root
cd ../..

# Check if .env file exists in backend
if [ ! -f "flexibill/backend/.env" ]; then
    echo "⚠️ Backend .env file not found. Creating from template..."
    cp flexibill/backend/.env.example flexibill/backend/.env 2>/dev/null || echo "# Server Configuration
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=your-supabase-key

# Plaid Configuration
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox

# AI Configuration
AZURE_OPENAI_ENDPOINT=https://your-azure-openai-endpoint.openai.azure.com
AZURE_OPENAI_KEY=your-azure-openai-key
AZURE_OPENAI_DEPLOYMENT=your-azure-openai-deployment" > flexibill/backend/.env
    echo "✅ Created backend .env file. Please update with your actual credentials."
fi

# Build the backend
echo "🔨 Building backend..."
cd flexibill/backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build backend"
    exit 1
fi
echo "✅ Backend built successfully"

# Return to project root
cd ../..

echo "
🎉 FlexiBill project setup complete! 🎉

To start the backend server:
  cd flexibill/backend
  npm run dev

To start the mobile app:
  cd flexibill/mobile
  npm start

Don't forget to:
1. Update the .env file with your actual credentials
2. Set up your Supabase database using the SQL in flexibill/backend/db/initSchema.sql
3. Configure your Plaid developer account

Happy coding! 🚀
"