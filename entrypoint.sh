#!/bin/sh

echo "Starting Nuntius Feed..."

echo "Starting with PM2 Runtime..."
pm2-runtime server.js --name nuntius_feed