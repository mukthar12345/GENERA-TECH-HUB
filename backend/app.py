# ============================================
# GENERA TECH HUB - MAIN FLASK APPLICATION
# ============================================

import os
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
import time

# Load environment variables
load_dotenv()

# Import configuration
from config import get_config

# Import routes
from routes.auth import auth_bp
from routes.products import products_bp
from routes.repairs import repairs_bp
from routes.admin import admin_bp
from routes.reports import reports_bp
from routes.ai import ai_bp

# Import middleware
from middleware.auth import token_required
from middleware.rate_limit import rate_limit
from middleware.logging import log_request

# Import services
from services.supabase_service import get_supabase

# Initialize Flask app
app = Flask(__name__)

# Load configuration
config = get_config()
app.config.from_object(config)

# Initialize CORS
CORS(app, origins=config.CORS_ORIGINS, supports_credentials=True)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[config.RATELIMIT_DEFAULT],
    storage_uri=config.RATELIMIT_STORAGE_URI
)

# Initialize Supabase
supabase = get_supabase()

# ============================================
# LOGGING SETUP
# ============================================

def setup_logging():
    """Setup application logging"""
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # File handler
    file_handler = RotatingFileHandler(
        'logs/genera.log',
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(
        '%(levelname)s - %(message)s'
    ))
    
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(config.LOG_LEVEL)
    
    app.logger.info(f"🚀 {config.APP_NAME} v{config.APP_VERSION} starting...")
    app.logger.info(f"📁 Environment: {config.FLASK_ENV}")
    app.logger.info(f"🔗 Supabase: {config.SUPABASE_URL}")

setup_logging()

# ============================================
# REQUEST MIDDLEWARE
# ============================================

@app.before_request
def before_request():
    """Execute before each request"""
    # Store request start time
    g.start_time = time.time()
    
    # Log request
    app.logger.info(f"📥 {request.method} {request.path} from {request.remote_addr}")


@app.after_request
def after_request(response):
    """Execute after each request"""
    # Log response time
    if hasattr(g, 'start_time'):
        elapsed = time.time() - g.start_time
        app.logger.info(f"📤 {request.method} {request.path} → {response.status_code} ({elapsed:.3f}s)")
    
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    
    return response


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Resource not found',
        'message': 'The requested endpoint does not exist',
        'path': request.path
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    app.logger.error(f'❌ Internal error: {error}')
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'Something went wrong. Please try again later.'
    }), 500


@app.errorhandler(429)
def rate_limit_error(error):
    """Handle rate limit errors"""
    return jsonify({
        'success': False,
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please try again later.',
        'retry_after': 3600
    }), 429

# ============================================
# REGISTER BLUEPRINTS
# ============================================

# Public routes
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(products_bp, url_prefix='/api/products')
app.register_blueprint(repairs_bp, url_prefix='/api/repairs')
app.register_blueprint(ai_bp, url_prefix='/api/ai')

# Protected routes (admin only)
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(reports_bp, url_prefix='/api/reports')

app.logger.info("✅ All blueprints registered")

# ============================================
# HEALTH CHECK ENDPOINT
# ============================================

@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'app': app.config['APP_NAME'],
        'version': app.config['APP_VERSION'],
        'environment': app.config.get('FLASK_ENV', 'development'),
        'timestamp': datetime.now().isoformat(),
        'uptime': 'running'
    })


@app.route('/')
def index():
    """Root endpoint with API information"""
    return jsonify({
        'name': app.config['APP_NAME'],
        'version': app.config['APP_VERSION'],
        'status': 'operational',
        'endpoints': {
            'auth': {
                'login': '/api/auth/login',
                'register': '/api/auth/register',
                'verify': '/api/auth/verify'
            },
            'products': {
                'list': '/api/products/',
                'detail': '/api/products/{id}',
                'create': '/api/products/ (POST)',
                'update': '/api/products/{id} (PUT)',
                'delete': '/api/products/{id} (DELETE)'
            },
            'repairs': {
                'create': '/api/repairs/ (POST)',
                'list': '/api/repairs/ (GET)',
                'status': '/api/repairs/{id}/status (PUT)'
            },
            'admin': {
                'dashboard': '/api/admin/dashboard/stats',
                'repairs': '/api/admin/repairs',
                'reviews': '/api/admin/reviews/pending',
                'messages': '/api/admin/messages'
            },
            'reports': {
                'sales': '/api/reports/sales',
                'inventory': '/api/reports/inventory'
            },
            'health': '/health'
        },
        'documentation': 'https://generatechhub.com/api/docs'
    })


# ============================================
# RUN APPLICATION
# ============================================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = app.config.get('DEBUG', False)
    
    app.logger.info(f"🌐 Starting server on port {port}")
    app.logger.info(f"🔧 Debug mode: {debug}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )