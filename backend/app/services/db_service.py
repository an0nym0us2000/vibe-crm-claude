"""
Supabase database service - DEPRECATED
Use backend.supabase module instead for better functionality

This file is kept for backward compatibility
"""
import sys
import os

# Add parent directory to path to import from supabase module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from supabase_config.config import (
    get_supabase_client,
    get_database,
    SupabaseDatabase
)

# For backward compatibility
class DatabaseService:
    """
    DEPRECATED: Use backend.supabase.get_database() instead
    
    This class is kept for backward compatibility with existing code
    """
    
    def __init__(self):
        self.client = get_supabase_client(use_service_role=True)
        self._db = get_database(self.client)
    
    async def get_table(self, table_name: str):
        """Get table reference"""
        return self.client.table(table_name)
    
    # Forward all database operations to the new implementation
    async def create_workspace(self, *args, **kwargs):
        return await self._db.create_workspace(*args, **kwargs)
    
    async def get_user_workspaces(self, *args, **kwargs):
        return await self._db.get_user_workspaces(*args, **kwargs)
    
    async def create_entity(self, *args, **kwargs):
        return await self._db.create_entity(*args, **kwargs)
    
    async def create_record(self, *args, **kwargs):
        return await self._db.create_record(*args, **kwargs)
    
    async def get_records(self, *args, **kwargs):
        return await self._db.get_records(*args, **kwargs)
    
    async def create_activity(self, *args, **kwargs):
        return await self._db.create_activity(*args, **kwargs)


# Singleton instance (for backward compatibility)
db_service = DatabaseService()


# Recommended: Use the new imports
__all__ = [
    'DatabaseService',
    'db_service',
    'get_supabase_client',
    'get_database',
    'SupabaseDatabase'
]
