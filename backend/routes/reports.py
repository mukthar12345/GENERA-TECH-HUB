# ============================================
# GENERA TECH HUB - REPORT ROUTES
# ============================================

from flask import Blueprint, request, jsonify, send_file
from services.supabase_service import get_supabase
from middleware.auth import admin_required
from middleware.rate_limit import admin_rate_limit
import pandas as pd
from datetime import datetime, timedelta
import io
import os

reports_bp = Blueprint('reports', __name__)
supabase = get_supabase()


@reports_bp.route('/sales', methods=['GET'])
@admin_required
@admin_rate_limit
def get_sales_report():
    """Generate sales report (Admin only)"""
    try:
        # Get date range
        days = request.args.get('days', default=30, type=int)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get products
        products_result = supabase.get_products()
        
        if not products_result['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch product data'
            }), 500
        
        products = products_result['data']
        
        # Get repair requests (as a proxy for sales)
        repairs_result = supabase.get_repair_requests()
        
        if not repairs_result['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch repair data'
            }), 500
        
        repairs = repairs_result['data']
        
        # Create report data
        report = {
            'generated_at': datetime.now().isoformat(),
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': days
            },
            'summary': {
                'total_products': len(products),
                'total_repairs': len(repairs),
                'pending_repairs': len([r for r in repairs if r.get('status') == 'pending']),
                'completed_repairs': len([r for r in repairs if r.get('status') == 'completed'])
            },
            'products': products[:10],  # Top 10 products
            'repairs': repairs[:10]     # Top 10 repairs
        }
        
        # Format for export
        if request.args.get('format') == 'excel':
            return export_to_excel(report, 'sales_report')
        
        return jsonify({
            'success': True,
            'report': report
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@reports_bp.route('/inventory', methods=['GET'])
@admin_required
@admin_rate_limit
def get_inventory_report():
    """Generate inventory report (Admin only)"""
    try:
        products_result = supabase.get_products()
        
        if not products_result['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch inventory data'
            }), 500
        
        products = products_result['data']
        
        # Calculate inventory stats
        total_value = sum(p.get('price', 0) * p.get('stock_quantity', 0) for p in products)
        low_stock = [p for p in products if p.get('stock_quantity', 0) < 5]
        out_of_stock = [p for p in products if p.get('stock_quantity', 0) == 0]
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_products': len(products),
                'total_inventory_value': total_value,
                'low_stock_items': len(low_stock),
                'out_of_stock_items': len(out_of_stock)
            },
            'low_stock': low_stock,
            'out_of_stock': out_of_stock,
            'all_products': products
        }
        
        # Format for export
        if request.args.get('format') == 'excel':
            return export_to_excel(report, 'inventory_report')
        
        return jsonify({
            'success': True,
            'report': report
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@reports_bp.route('/customers', methods=['GET'])
@admin_required
@admin_rate_limit
def get_customer_report():
    """Generate customer report (Admin only)"""
    try:
        # Get all reviews (as customer data proxy)
        reviews_result = supabase.get_reviews(approved_only=True)
        
        if not reviews_result['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch customer data'
            }), 500
        
        reviews = reviews_result['data']
        
        # Get all repair requests
        repairs_result = supabase.get_repair_requests()
        
        if not repairs_result['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch repair data'
            }), 500
        
        repairs = repairs_result['data']
        
        # Calculate customer metrics
        unique_customers = set()
        for repair in repairs:
            if repair.get('customer_phone'):
                unique_customers.add(repair['customer_phone'])
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_customers': len(unique_customers),
                'total_reviews': len(reviews),
                'average_rating': sum(r.get('rating', 0) for r in reviews) / len(reviews) if reviews else 0,
                'total_repairs': len(repairs)
            },
            'reviews': reviews[:20],
            'repairs': repairs[:20]
        }
        
        return jsonify({
            'success': True,
            'report': report
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def export_to_excel(report, filename):
    """Export report to Excel format"""
    try:
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Summary sheet
            if 'summary' in report:
                summary_df = pd.DataFrame([report['summary']])
                summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Products sheet
            if 'products' in report:
                products_df = pd.DataFrame(report['products'])
                products_df.to_excel(writer, sheet_name='Products', index=False)
            
            # Repairs sheet
            if 'repairs' in report:
                repairs_df = pd.DataFrame(report['repairs'])
                repairs_df.to_excel(writer, sheet_name='Repairs', index=False)
            
            # Low stock sheet
            if 'low_stock' in report:
                low_stock_df = pd.DataFrame(report['low_stock'])
                low_stock_df.to_excel(writer, sheet_name='Low Stock', index=False)
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'{filename}_{datetime.now().strftime("%Y%m%d")}.xlsx'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500