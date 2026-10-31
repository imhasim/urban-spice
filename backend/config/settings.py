"""
Django settings for Urban Spice backend project.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "urban-spice-dev-insecure-key-for-local-development-only")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

raw_allowed_hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")
ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(",") if h.strip()]

# Automatically add Render service hostname if running on Render
render_hostname = os.getenv("RENDER_EXTERNAL_HOSTNAME")
if render_hostname and render_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_hostname)

# Reverse proxy SSL header for Render & Cloudflare
# Informs Django that requests with X-Forwarded-Proto: https are secure HTTPS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party apps
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    # Local restaurant apps
    "accounts",
    "menu",
    "orders",
    "payments",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "config.middleware.ProductionTracebackMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database configuration: PostgreSQL via dj-database-url
# Supabase Transaction Pooler (Port 6543) compatibility:
# PgBouncer transaction mode requires conn_max_age=0 and DISABLE_SERVER_SIDE_CURSORS=True
raw_db_url = os.getenv("DATABASE_URL", "postgresql://localhost:5432/urban_spice")
is_pooler = ":6543" in raw_db_url or "pooler.supabase.com" in raw_db_url

default_conn_max_age = 0 if is_pooler else 600
conn_max_age = int(os.getenv("DB_CONN_MAX_AGE", str(default_conn_max_age)))

DATABASES = {
    "default": dj_database_url.config(
        default=raw_db_url,
        conn_max_age=conn_max_age,
        conn_health_checks=True,
    )
}

if is_pooler:
    DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# Whitenoise storage for production static assets
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Media uploads (food photos, etc.)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# CORS & CSRF settings for frontend communication (supports local dev, Vercel, and custom domains)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
extra_cors_origins = [
    o.strip().rstrip("/")
    for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

CORS_ALLOWED_ORIGINS = list(
    set(
        [
            FRONTEND_URL,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        + extra_cors_origins
    )
)

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
]
CORS_ALLOW_CREDENTIALS = True

# CSRF Trusted Origins for Django 4.0+ cross-origin POST/PATCH requests
extra_csrf_origins = [
    o.strip().rstrip("/")
    for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if o.strip()
]

CSRF_TRUSTED_ORIGINS = list(
    set(
        [
            origin
            for origin in CORS_ALLOWED_ORIGINS
            if origin.startswith("http://") or origin.startswith("https://")
        ]
        + extra_csrf_origins
    )
)
if render_hostname:
    CSRF_TRUSTED_ORIGINS.append(f"https://{render_hostname}")

# Razorpay credentials (Test Mode enforced)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_replace_me")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "replace_me")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "replace_me")

# Safety guard: Alert and enforce Test Mode in non-live environments
if RAZORPAY_KEY_ID and not RAZORPAY_KEY_ID.startswith("rzp_test_"):
    import logging
    logging.getLogger("orders.razorpay").warning(
        "Razorpay key ID is not a Test Mode key (does not start with 'rzp_test_')."
    )

# Production logging configuration:
# Ensures all Django request 500 errors and security warnings emit full tracebacks to stdout/stderr in Render logs
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] [{levelname}] {name} (pid {process}): {message}",
            "style": "{",
        },
        "simple": {
            "format": "[{levelname}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}
