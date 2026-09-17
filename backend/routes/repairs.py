# ============================================
# GENERA TECH HUB - REPAIR ROUTES
# ============================================

from flask import Blueprint, request, jsonify
from services.supabe_service import get_supabase
from middleware.auth import admin_required
from middleware.rate_limit import public_rate_limit

repairs_bp = Blueprint('repairs', __name__)
supabase = get_supabase()


@repairs_bp.route('/', methods=['POST'])
@public_rate_limit
def create_repair_request():
    """Submit repair request"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        required = ['device_type', 'issue_description', 'customer_name', 'customer_phone']
        missing = [field for field in required if not data.get(field)]
        
        if missing:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing)}'
            }), 400
        
        result = supabase.create_repair_request(data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'repair': result['data'],
                'message': 'Repair request submitted successfully'
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to submit repair request')
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@repairs_bp.route('/', methods=['GET'])
@admin_required
def get_repairs():
    """Get all repair requests (Admin only)"""
    try:
        status = request.args.get('status')
        result = supabase.get_repair_requests(status)
        
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


@repairs_bp.route('/<repair_id>/status', methods=['PUT'])
@admin_required
def update_repair_status(repair_id):
    """Update repair status (Admin only)"""
    try:
        data = request.get_json()
        
        if not data or not data.get('status'):
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        valid_statuses = ['pending', 'in-progress', 'completed', 'cancelled']
        if data['status'] not in valid_statuses:
            return jsonify({
                'success': False,
                'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }), 400
        
        result = supabase.update_repair_status(repair_id, data['status'])
        
        if result['success']:
            return jsonify({
                'success': True,
                'repair': result['data'],
                'message': f'Repair status updated to {data["status"]}'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Repair request not found')
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500