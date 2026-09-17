# ============================================
# GENERA TECH HUB - SUPABASE SERVICE
# ============================================
# This handles all database operations
# ============================================

import os
from supabase import create_client, Client
from datetime import datetime
from typing import Dict, List, Any, Optional
import json


class SupabaseService:
    """Service for interacting with Supabase database"""
    
    def __init__(self):
        """Initialize Supabase client with credentials"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        self.supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not configured!")
        
        # Use service role for full access
        key = self.supabase_service_key or self.supabase_key
        self.client: Client = create_client(self.supabase_url, key)
        
        print(f"✅ Supabase connected: {self.supabase_url}")
    
    # ============================================
    # PRODUCT OPERATIONS
    # ============================================
    
    def get_products(self, filters: Dict = None) -> Dict:
        """Get all products with optional filters"""
        try:
            query = self.client.table('products').select('*')
            
            if filters:
                if filters.get('category'):
                    query = query.eq('category', filters['category'])
                if filters.get('brand'):
                    query = query.eq('brand', filters['brand'])
                if filters.get('min_price'):
                    query = query.gte('price', float(filters['min_price']))
                if filters.get('max_price'):
                    query = query.lte('price', float(filters['max_price']))
                if filters.get('search'):
                    query = query.ilike('name', f"%{filters['search']}%")
                if filters.get('is_available') is not None:
                    query = query.eq('is_available', filters['is_available'])
                if filters.get('is_featured') is not None:
                    query = query.eq('is_featured', filters['is_featured'])
            
            query = query.order('created_at', desc=True)
            response = query.execute()
            
            return {
                'success': True,
                'data': response.data,
                'count': len(response.data)
            }
        except Exception as e:
            print(f"❌ Get products error: {e}")
            return {'success': False, 'error': str(e), 'data': []}
    
    def get_product(self, product_id: str) -> Dict:
        """Get single product by ID"""
        try:
            response = self.client.table('products')\
                .select('*')\
                .eq('id', product_id)\
                .execute()
            
            if response.data:
                return {'success': True, 'data': response.data[0]}
            return {'success': False, 'error': 'Product not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_product(self, data: Dict) -> Dict:
        """Create new product"""
        try:
            data['created_at'] = datetime.now().isoformat()
            data['updated_at'] = datetime.now().isoformat()
            
            response = self.client.table('products')\
                .insert(data)\
                .execute()
            
            if response.data:
                return {'success': True, 'data': response.data[0]}
            return {'success': False, 'error': 'Failed to create product'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def update_product(self, product_id: str, data: Dict) -> Dict:
        """Update product by ID"""
        try:
            data['updated_at'] = datetime.now().isoformat()
            
            response = self.client.table('products')\
                .update(data)\
                .eq('id', product_id)\
                .execute()
            
            if response.data:
                return {'success': True, 'data': response.data[0]}
            return {'success': False, 'error': 'Product not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def delete_product(self, product_id: str) -> Dict:
        """Delete product by ID"""
        try:
            response = self.client.table('products')\
                .delete()\
                .eq('id', product_id)\
                .execute()
            
            if response.data:
                return {'success': True, 'data': response.data[0]}
            return {'success': False, 'error': 'Product not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    # ============================================
    # REPAIR OPERATIONS
    # ============================================
    
    def create_repair_request(self, data: Dict) -> Dict:
        """Create repair request"""
        try:
            data['created_at'] = datetime.now().isoformat()
            data['status'] = 'pending'
            
            response = self.client.table('repair_requests')\
                .insert(data)\
                .execute()
            
            if response.data:
                return {'success': True, 'data': response.data[0]}
            return {'success': False, 'error': 'Failed to create repair request'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_repair_requests(self, status: str = None) -> Dict:
        """Get all repair requests"""
        try:
            query = self.client.table('repair_requests').select('*')
            
            if status:
                query = query.eq('status', status)
            
            query = query.order('created_at', desc=True)
            response = query.execute()
            
            return {
                'success': True,
                'data': response.data,
                'count': len(response.data)
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'data': []}
    
    def update_repair_status(self, repair_id: str, status: str) -> Dict:
        """Update repair request status"""
        try:
            response = self.client.table('repair_requests')\
                .update({
                    'status': status,
                    'updated_at': datetime.now().isoformat()
                })\
                .eq('id', repair_id)\
                .execute()
            
            if response.data:
                return {'success': True, 'data': response.data[0]}
            return {'success': False, 'error': 'Repair request not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    # ============================================
    # REVIEW OPERATIONS
    # ============================================
    
    def create_review(self, data: Dict) -> Dict:
        """Create review"""
        try:
            data['created_at'] = datetime.now().isoformat()
            data['is_approved'] = False
            
            response = self.client.table('reviews')\
                .insert(data)\
                .execute()
            
            if response.data:
                return {'success': True, 'data': response.data[0]}
            return {'success': False, 'error': 'Failed to create review'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_reviews(self, approved_only: bool = True) -> Dict:
        """Get reviews"""
        try:
            query = self.client.table('reviews').select('*')
            
            if approved_only:
                query = query.eq('is_approved', True)
            
            query = query.order('created_at', desc=True)
            response = query.execute()
            
            return {
                'success': True,
                'data': response.data,
                'count': len(response.data)
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'data': []}
    
    def approve_review(self, review_id: str) -> Dict:
        """Approve a review"""
        try:
            response = self.client.table('reviews')\
                .update({
                    'is_approved': True,
                    'updated_at': datetime.now().isoformat()
                })\
                .eq('id', review_id)\
                .execute()
            
            if response.data:
                return {'success': True, 'data': response.data[0]}
            return {'success': False, 'error': 'Review not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    # ============================================
    # CONTACT OPERATIONS
    # ============================================
    
    def create_contact_message(self, data: Dict) -> Dict:
        """Create contact message"""
        try:
            data['created_at'] = datetime.now().isoformat()
            data['status'] = 'unread'
            
            response = self.client.table('contact_messages')\
                .insert(data)\
                .execute()
            
            if response.data:
                return {'success': True, 'data': response.data[0]}
            return {'success': False, 'error': 'Failed to send message'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_contact_messages(self, status: str = None) -> Dict:
        """Get contact messages"""
        try:
            query = self.client.table('contact_messages').select('*')
            
            if status:
                query = query.eq('status', status)
            
            query = query.order('created_at', desc=True)
            response = query.execute()
            
            return {
                'success': True,
                'data': response.data,
                'count': len(response.data)
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'data': []}
    
    # ============================================
    # DASHBOARD STATS (Admin)
    # ============================================
    
    def get_dashboard_stats(self) -> Dict:
        """Get dashboard statistics"""
        try:
            # Count products
            products = self.client.table('products').select('*', count='exact').execute()
            
            # Count repairs
            repairs = self.client.table('repair_requests').select('*', count='exact').execute()
            pending_repairs = self.client.table('repair_requests')\
                .select('*', count='exact')\
                .eq('status', 'pending')\
                .execute()
            
            # Count pending reviews
            pending_reviews = self.client.table('reviews')\
                .select('*', count='exact')\
                .eq('is_approved', False)\
                .execute()
            
            # Count unread messages
            unread_messages = self.client.table('contact_messages')\
                .select('*', count='exact')\
                .eq('status', 'unread')\
                .execute()
            
            return {
                'success': True,
                'data': {
                    'total_products': products.count or 0,
                    'total_repairs': repairs.count or 0,
                    'pending_repairs': pending_repairs.count or 0,
                    'pending_reviews': pending_reviews.count or 0,
                    'unread_messages': unread_messages.count or 0
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}


# Singleton instance
supabase_service = SupabaseService()

def get_supabase():
    """Get Supabase service instance"""
    return supabase_service