# ============================================
# GENERA TECH HUB - ROUTES INIT
# ============================================

from .auth import auth_bp
from .products import products_bp
from .repairs import repairs_bp
from .admin import admin_bp
from .reports import reports_bp
from .ai import ai_bp

__all__ = [
    'auth_bp',
    'products_bp',
    'repairs_bp',
    'admin_bp',
    'reports_bp',
    'ai_bp'
]