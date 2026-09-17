# ============================================
# GENERA TECH HUB - RATE LIMIT MIDDLEWARE
# ============================================

from functools import wraps
from flask import request, jsonify, g
import time
from collections import defaultdict

# In-memory rate limit store (replace with Redis in production)
rate_limits = defaultdict(list)

class RateLimiter:
    """Rate limiting implementation"""
    
    def __init__(self, limit=100, window=3600):
        """
        Args:
            limit: Maximum requests allowed in window
            window: Time window in seconds
        """
        self.limit = limit
        self.window = window
    
    def is_allowed(self, key: str) -> bool:
        """Check if request is allowed"""
        now = time.time()
        window_start = now - self.window
        
        # Clean old requests
        rate_limits[key] = [t for t in rate_limits[key] if t > window_start]
        
        # Check limit
        if len(rate_limits[key]) >= self.limit:
            return False
        
        # Add current request
        rate_limits[key].append(now)
        return True
    
    def get_remaining(self, key: str) -> int:
        """Get remaining requests in current window"""
        now = time.time()
        window_start = now - self.window
        
        # Clean old requests
        rate_limits[key] = [t for t in rate_limits[key] if t > window_start]
        
        return max(0, self.limit - len(rate_limits[key]))


def rate_limit(limit=100, window=3600):
    """Decorator: Apply rate limiting"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Get client identifier (IP or user ID)
            key = request.remote_addr
            
            # Check if authenticated user, use their ID
            user = g.get('user')
            if user:
                key = f"user_{user.get('user_id')}"
            
            limiter = RateLimiter(limit=limit, window=window)
            
            if not limiter.is_allowed(key):
                return jsonify({
                    'success': False,
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Please try again later.',
                    'retry_after': window,
                    'remaining': 0
                }), 429
            
            # Add rate limit headers
            response = f(*args, **kwargs)
            
            if isinstance(response, tuple):
                response_data, status_code = response
                if isinstance(response_data, dict):
                    response_data['rate_limit'] = {
                        'remaining': limiter.get_remaining(key),
                        'limit': limit,
                        'window': window
                    }
                    return response_data, status_code
            
            return response
        
        return decorated
    return decorator


def admin_rate_limit(f):
    """Admin-specific rate limit (stricter)"""
    return rate_limit(limit=50, window=3600)(f)


def public_rate_limit(f):
    """Public endpoint rate limit"""
    return rate_limit(limit=100, window=3600)(f)