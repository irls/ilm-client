#!/bin/sh

# Local Environment Variables
# Copy and modify as appropriate to:
#   env.dev.sh for Development
#   env.prod.sh for Production
# (these files are excluded in .gitignore)

export NODE_ENV=development
export DOCKER=false

export DB_HOST=127.0.0.1:5986
export ILM_SERVER=http://localhost:3000
export CLIENT_PORT=8080

