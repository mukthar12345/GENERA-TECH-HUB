# ============================================
# GENERA TECH HUB - CONFIGURATION
# ============================================

import os
from dotenv import load_dotenv
from datetime import timedelta
import logging

# Load environment variables
load_dotenv()


class Config:
    """Base configuration"""
    
    # App
    APP_NAME = "Genera Tech Hub"
    APP_VERSION = "1.0.0"
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # URLs
    APP_URL = os.getenv('APP_URL', 'http://localhost:5000')
    API_URL = os.getenv('API_URL', 'http://localhost:5000/api')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5500')
    
    # Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
    SUPABASE_SERVICE_ROLE = os.getenv('SUPABASE_SERVICE_ROLE')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CEO
    CEO_EMAIL = os.getenv('CEO_EMAIL', '')
    
    # WhatsApp
    WHATSAPP_NUMBER = os.getenv('WHATSAPP_NUMBER', '08081302228')
    
    # Email
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'info@generatechub.com')
    
    # SMS
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
    TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
    
    # AI
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "100 per hour"
    RATELIMIT_STORAGE_URI = "memory://"
    
    # CORS
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5500',
        'https://generatechhub.com',
        'https://www.generatechhub.com',
        'https://*.netlify.app',
        'https://*.vercel.app'
    ]
    
    # File Upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx'}
    
    # Logging
    LOG_LEVEL = logging.INFO
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = 'logs/genera.log'


class DevelopmentConfig(Config):
    """Development configuration"""
    FLASK_ENV = 'development'
    DEBUG = True
    LOG_LEVEL = logging.DEBUG


class ProductionConfig(Config):
    """Production configuration"""
    FLASK_ENV = 'production'
    DEBUG = False
    LOG_LEVEL = logging.WARNING
    RATELIMIT_STORAGE_URI = "redis://localhost:6379"


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    LOG_LEVEL = logging.DEBUG


# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, DevelopmentConfig)