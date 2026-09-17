# ============================================
# GENERA TECH HUB - LOGGING MIDDLEWARE
# ============================================

from flask import request, g
import time
import json
from datetime import datetime


def log_request():
    """Log incoming request details"""
    # Skip logging for health checks
    if request.path == '/health':
        return
    
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'method': request.method,
        'path': request.path,
        'ip': request.remote_addr,
        'user_agent': request.headers.get('User-Agent'),
        'referer': request.headers.get('Referer'),
        'query_params': dict(request.args),
        'headers': dict(request.headers)
    }
    
    # Log to console (structured)
    print(f"📥 {json.dumps(log_data)}")


def log_error(error, context=None):
    """Log error with context"""
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'error': str(error),
        'type': type(error).__name__,
        'path': request.path if request else 'N/A',
        'method': request.method if request else 'N/A',
        'context': context
    }
    
    print(f"❌ {json.dumps(log_data)}")