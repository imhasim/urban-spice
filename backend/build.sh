#!/usr/bin/env bash
# Exit immediately on error
set -o errexit

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Running Django database migrations..."
python manage.py migrate --no-input

echo "==> Collecting static assets for Whitenoise..."
python manage.py collectstatic --no-input

echo "==> Build completed successfully!"
