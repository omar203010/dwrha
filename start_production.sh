#!/bin/bash

# Gunicorn configuration for Dawerha project
# Run this script to start the production server

# Set environment variables
export DJANGO_SETTINGS_MODULE=dawerha.production_settings

# Start Gunicorn
exec gunicorn \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --worker-class gthread \
    --threads 2 \
    --worker-connections 1000 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --timeout 30 \
    --keep-alive 2 \
    --preload \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    dawerha.wsgi:application

