# ============================================
# GENERA TECH HUB - AUTHENTICATION MIDDLEWARE
# ============================================

import jwt
import os
from functools import wraps
from flask import request, jsonify, g
from datetime import datetime, timedelta, timezone


def generate_token(user_id: str, email: str, role: str = 'customer'):
    """Generate JWT token for user"""
    secret = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=7),
        'iat': datetime.now(timezone.utc)
    }
    
    token = jwt.encode(payload, secret, algorithm='HS256')
    return token


def verify_token(token: str):
    """Verify JWT token"""
    secret = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return {'success': True, 'payload': payload}
    except jwt.ExpiredSignatureError:
        return {'success': False, 'error': 'Token expired'}
    except jwt.InvalidTokenError:
        return {'success': False, 'error': 'Invalid token'}


def token_required(f):
    """Decorator: Require valid token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'success': False,
                'error': 'Authentication required',
                'message': 'No token provided'
            }), 401
        
        # Verify token
        result = verify_token(token)
        if not result['success']:
            return jsonify({
                'success': False,
                'error': 'Authentication failed',
                'message': result.get('error', 'Invalid token')
            }), 401
        
        # Store user info in request context
        g.user = result['payload']
        return f(*args, **kwargs)
    
    return decorated


def admin_required(f):
    """Decorator: Require admin access"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        user = g.get('user')
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Authentication required'
            }), 401
        
        # Check if user is admin
        if user.get('role') != 'admin':
            # Check if email matches CEO email
            ceo_email = os.getenv('CEO_EMAIL', '').lower()
            if user.get('email', '').lower() != ceo_email:
                return jsonify({
                    'success': False,
                    'error': 'Access denied',
                    'message': 'Admin privileges required'
                }), 403
        
        return f(*args, **kwargs)
    
    return decorated


def get_current_user():
    """Get current authenticated user"""
    return g.get('user')


def get_user_from_token(token: str):
    """Get user from token without decorator"""
    result = verify_token(token)
    if result['success']:
        return result['payload']
    return None