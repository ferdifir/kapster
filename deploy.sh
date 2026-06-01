#!/bin/bash

echo "🚀 Deploying Kapster..."

ssh root@109.111.53.58 -p 38954 << 'EOF'
  cd /var/www/kapster || exit 1
  echo "📥 Pulling latest code..."
  git pull
  echo "📦 Installing dependencies..."
  npm install
  echo "🔨 Building project..."
  npm run build
  echo "🔄 Restarting PM2..."
  pm2 restart kapster
  echo "✅ Deploy complete!"
EOF
