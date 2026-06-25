#!/bin/bash
echo "🌙 Starting Luna Period Tracker..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

echo "🚀 Opening Luna at http://localhost:3000"
echo "   Press Ctrl+C to stop."
echo ""
npm start
