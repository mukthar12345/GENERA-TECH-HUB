# ============================================
# GENERA TECH HUB - ADMIN ROUTES
# ============================================

from flask import Blueprint, request, jsonify
from services.supabe_service import get_supabase
from middleware.auth import admin_required
from middleware.rate_limit import admin_rate_limit

admin_bp = Blueprint('admin', __name__)
supabase = get_supabase()


@admin_bp.route('/dashboard/stats', methods=['GET'])
@admin_required
@admin_rate_limit
def get_dashboard_stats():
    """Get dashboard statistics (Admin only)"""
    try:
        result = supabase.get_dashboard_stats()
        
        if result['success']:
            return jsonify({
                'success': True,
                'stats': result['data']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to fetch stats')
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@admin_bp.route('/repairs', methods=['GET'])
@admin_required
def get_all_repairs():
    """Get all repair requests (Admin only)"""
    try:
        result = supabase.get_repair_requests()
        
        if result['success']:
            return jsonify({
                'success': True,
                'repairs': result['data'],
                'count': result['count']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to fetch repairs')
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@admin_bp.route('/reviews/pending', methods=['GET'])
@admin_required
def get_pending_reviews():
    """Get pending reviews (Admin only)"""
    try:
        result = supabase.get_reviews(approved_only=False)
        
        if result['success']:
            # Filter only pending reviews
            pending = [r for r in result['data'] if not r.get('is_approved', False)]
            return jsonify({
                'success': True,
                'reviews': pending,
                'count': len(pending)
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to fetch reviews')
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@admin_bp.route('/reviews/<review_id>/approve', methods=['PUT'])
@admin_required
def approve_review(review_id):
    """Approve a review (Admin only)"""
    try:
        result = supabase.approve_review(review_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'review': result['data'],
                'message': 'Review approved successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Review not found')
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@admin_bp.route('/messages', methods=['GET'])
@admin_required
def get_messages():
    """Get all contact messages (Admin only)"""
    try:
        status = request.args.get('status')
        result = supabase.get_contact_messages(status)
        
        if result['success']:
            return jsonify({
                'success': True,
                'messages': result['data'],
                'count': result['count']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to fetch messages')
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500