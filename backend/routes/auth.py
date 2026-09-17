# ============================================
# GENERA TECH HUB - AUTHENTICATION ROUTES
# ============================================

from flask import Blueprint, request, jsonify
from services.supabase_service import get_supabase
from middleware.auth import generate_token, token_required
from middleware.rate_limit import public_rate_limit
import os

auth_bp = Blueprint('auth', __name__)
supabase = get_supabase()


@auth_bp.route('/register', methods=['POST'])
@public_rate_limit
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        required = ['email', 'password', 'full_name', 'phone']
        missing = [field for field in required if not data.get(field)]
        
        if missing:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing)}'
            }), 400
        
        # Check if user exists
        existing = supabase.client.table('users')\
            .select('*')\
            .eq('email', data['email'])\
            .execute()
        
        if existing.data:
            return jsonify({
                'success': False,
                'error': 'User already exists with this email'
            }), 409
        
        # Create user in Supabase Auth
        from supabase import create_client
        client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_ANON_KEY')
        )
        
        auth_response = client.auth.sign_up({
            'email': data['email'],
            'password': data['password'],
            'options': {
                'data': {
                    'full_name': data['full_name'],
                    'phone': data['phone'],
                    'role': 'customer'
                }
            }
        })
        
        if auth_response.user:
            # Generate JWT token
            token = generate_token(
                auth_response.user.id,
                data['email'],
                'customer'
            )
            
            return jsonify({
                'success': True,
                'user': {
                    'id': auth_response.user.id,
                    'email': auth_response.user.email,
                    'full_name': data['full_name'],
                    'role': 'customer'
                },
                'token': token,
                'message': 'Registration successful! Please verify your email.'
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Registration failed. Please try again.'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@auth_bp.route('/login', methods=['POST'])
@public_rate_limit
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        # Login with Supabase Auth
        from supabase import create_client
        client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_ANON_KEY')
        )
        
        auth_response = client.auth.sign_in_with_password({
            'email': data['email'],
            'password': data['password']
        })
        
        if auth_response.user:
            # Get user metadata
            user_metadata = auth_response.user.user_metadata or {}
            
            # Preserve the trusted Supabase admin role, with email fallback for local JWTs.
            app_metadata = getattr(auth_response.user, 'app_metadata', None) or {}
            ceo_email = os.getenv('CEO_EMAIL', '').lower()
            role = 'admin' if app_metadata.get('role') == 'admin' or data['email'].lower() == ceo_email else 'customer'
            
            # Generate JWT token
            token = generate_token(
                auth_response.user.id,
                data['email'],
                role
            )
            
            return jsonify({
                'success': True,
                'user': {
                    'id': auth_response.user.id,
                    'email': auth_response.user.email,
                    'full_name': user_metadata.get('full_name', 'User'),
                    'role': role
                },
                'token': token,
                'message': 'Login successful!'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@auth_bp.route('/verify', methods=['GET'])
@token_required
def verify():
    """Verify current user token"""
    try:
        from middleware.auth import get_current_user
        user = get_current_user()
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.get('user_id'),
                'email': user.get('email'),
                'role': user.get('role', 'customer')
            },
            'message': 'Token is valid'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Logout user (client-side token removal)"""
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
@public_rate_limit
def reset_password():
    """Request password reset"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email'):
            return jsonify({
                'success': False,
                'error': 'Email is required'
            }), 400
        
        from supabase import create_client
        client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_ANON_KEY')
        )
        
        # Send password reset email via Supabase
        client.auth.reset_password_for_email(data['email'])
        
        return jsonify({
            'success': True,
            'message': 'Password reset link sent to your email'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@auth_bp.route('/change-password', methods=['PUT'])
@token_required
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({
                'success': False,
                'error': 'Current password and new password are required'
            }), 400
        
        if len(data['new_password']) < 6:
            return jsonify({
                'success': False,
                'error': 'New password must be at least 6 characters'
            }), 400
        
        from supabase import create_client
        client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_ANON_KEY')
        )
        
        # Update password
        client.auth.update_user({
            'password': data['new_password']
        })
        
        return jsonify({
            'success': True,
            'message': 'Password updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500