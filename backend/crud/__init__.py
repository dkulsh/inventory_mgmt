# Define all available functions
__all__ = [
    # Tenant functions
    'get_tenant',
    'get_tenants',
    'create_tenant',
    'update_tenant',
    'delete_tenant',
    
    # Business functions
    'get_business',
    'get_businesses',
    'create_business',
    'update_business',
    'delete_business',
    
    # User functions
    'get_user',
    'get_users',
    'create_user',
    'update_user',
    'delete_user',
    'get_user_by_username',
    'get_available_businesses_for_user_creation',
    
    # Product functions
    'get_product',
    'get_products',
    'create_product',
    'update_product',
    'delete_product',
    
    # Order functions
    'get_order',
    'get_orders',
    'create_order',
    'update_order',
    'delete_order',
    
    # OrderedProduct functions
    'get_ordered_product',
    'get_ordered_products',
    'create_ordered_product',
    'update_ordered_product',
    'delete_ordered_product'
]

# Lazy imports to avoid circular dependencies
def __getattr__(name):
    if name in __all__:
        if name.startswith(('get_tenant', 'create_tenant', 'update_tenant', 'delete_tenant')):
            from .tenant import get_tenant, get_tenants, create_tenant, update_tenant, delete_tenant
            return locals()[name]
        elif name.startswith(('get_business', 'create_business', 'update_business', 'delete_business')):
            from .business import get_business, get_businesses, create_business, update_business, delete_business
            return locals()[name]
        elif name.startswith(('get_user', 'create_user', 'update_user', 'delete_user', 'get_available_businesses_for_user_creation')):
            from .user import get_user, get_users, create_user, update_user, delete_user, get_user_by_username, get_available_businesses_for_user_creation
            return locals()[name]
        elif name.startswith(('get_product', 'create_product', 'update_product', 'delete_product')):
            from .product import get_product, get_products, create_product, update_product, delete_product
            return locals()[name]
        elif name.startswith(('get_order', 'create_order', 'update_order', 'delete_order')):
            from .order import get_order, get_orders, create_order, update_order, delete_order
            return locals()[name]
        elif name.startswith(('get_ordered_product', 'create_ordered_product', 'update_ordered_product', 'delete_ordered_product')):
            from .ordered_product import get_ordered_product, get_ordered_products, create_ordered_product, update_ordered_product, delete_ordered_product
            return locals()[name]
    raise AttributeError(f"module 'backend.crud' has no attribute '{name}'") 