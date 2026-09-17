# ============================================
# GENERA TECH HUB - PRODUCT ROUTES
# ============================================

from flask import Blueprint, request, jsonify
from services.supabe_service import get_supabase
from middleware.auth import admin_required
from middleware.rate_limit import public_rate_limit

products_bp = Blueprint('products', __name__)
supabase = get_supabase()


@products_bp.route('/', methods=['GET'])
@public_rate_limit
def get_products():
    """Get all products"""
    try:
        # Parse query parameters
        filters = {
            'category': request.args.get('category'),
            'brand': request.args.get('brand'),
            'min_price': request.args.get('min_price'),
            'max_price': request.args.get('max_price'),
            'search': request.args.get('search'),
            'is_available': request.args.get('is_available'),
            'is_featured': request.args.get('is_featured')
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        result = supabase.get_products(filters)
        
        if result['success']:
            return jsonify({
                'success': True,
                'products': result['data'],
                'count': result['count']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to fetch products')
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@products_bp.route('/<product_id>', methods=['GET'])
@public_rate_limit
def get_product(product_id):
    """Get single product by ID"""
    try:
        result = supabase.get_product(product_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'product': result['data']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Product not found')
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@products_bp.route('/', methods=['POST'])
@admin_required
def create_product():
    """Create new product (Admin only)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        required = ['name', 'price']
        missing = [field for field in required if not data.get(field)]
        
        if missing:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing)}'
            }), 400
        
        result = supabase.create_product(data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'product': result['data'],
                'message': 'Product created successfully'
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to create product')
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@products_bp.route('/<product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    """Update product (Admin only)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        result = supabase.update_product(product_id, data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'product': result['data'],
                'message': 'Product updated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Product not found')
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@products_bp.route('/<product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    """Delete product (Admin only)"""
    try:
        result = supabase.delete_product(product_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Product deleted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Product not found')
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500