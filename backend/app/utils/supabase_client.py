"""
Supabase client utilities and helper functions
Provides typed interfaces for Supabase operations
"""
from typing import Optional, Dict, Any, List, TypeVar, Generic
from supabase import Client
import logging

from supabase_config.config import (
    get_supabase_client,
    get_authenticated_supabase_client,
    SupabaseDatabase
)

logger = logging.getLogger(__name__)

T = TypeVar('T')


# ========================================
# Helper Functions
# ========================================

def get_client(access_token: Optional[str] = None, use_service_role: bool = False) -> Client:
    """
    Get Supabase client
    
    Args:
        access_token: Optional JWT access token for authenticated requests
        use_service_role: If True, use service role key (bypasses RLS)
        
    Returns:
        Configured Supabase client
    """
    if access_token:
        return get_authenticated_supabase_client(access_token)
    return get_supabase_client(use_service_role=use_service_role)


def get_db(client: Optional[Client] = None) -> SupabaseDatabase:
    """
    Get database helper instance
    
    Args:
        client: Optional Supabase client (uses anonymous client if not provided)
        
    Returns:
        SupabaseDatabase helper instance
    """
    from supabase_config.config import get_database
    return get_database(client)


# ========================================
# Query Builder Helpers
# ========================================

class QueryBuilder(Generic[T]):
    """
    Type-safe query builder for Supabase
    
    Example:
        users = await QueryBuilder(client, "users") \\
            .select("*") \\
            .eq("active", True) \\
            .order("created_at", desc=True) \\
            .limit(10) \\
            .execute()
    """
    
    def __init__(self, client: Client, table: str):
        """
        Initialize query builder
        
        Args:
            client: Supabase client
            table: Table name
        """
        self.client = client
        self.table = table
        self._query = client.table(table)
    
    def select(self, columns: str = "*") -> "QueryBuilder[T]":
        """Select columns"""
        self._query = self._query.select(columns)
        return self
    
    def eq(self, column: str, value: Any) -> "QueryBuilder[T]":
        """Filter where column equals value"""
        self._query = self._query.eq(column, value)
        return self
    
    def neq(self, column: str, value: Any) -> "QueryBuilder[T]":
        """Filter where column not equals value"""
        self._query = self._query.neq(column, value)
        return self
    
    def gt(self, column: str, value: Any) -> "QueryBuilder[T]":
        """Filter where column greater than value"""
        self._query = self._query.gt(column, value)
        return self
    
    def gte(self, column: str, value: Any) -> "QueryBuilder[T]":
        """Filter where column greater than or equal to value"""
        self._query = self._query.gte(column, value)
        return self
    
    def lt(self, column: str, value: Any) -> "QueryBuilder[T]":
        """Filter where column less than value"""
        self._query = self._query.lt(column, value)
        return self
    
    def lte(self, column: str, value: Any) -> "QueryBuilder[T]":
        """Filter where column less than or equal to value"""
        self._query = self._query.lte(column, value)
        return self
    
    def like(self, column: str, pattern: str) -> "QueryBuilder[T]":
        """Filter with LIKE pattern"""
        self._query = self._query.like(column, pattern)
        return self
    
    def ilike(self, column: str, pattern: str) -> "QueryBuilder[T]":
        """Filter with case-insensitive LIKE pattern"""
        self._query = self._query.ilike(column, pattern)
        return self
    
    def is_(self, column: str, value: Any) -> "QueryBuilder[T]":
        """Filter where column IS value (for NULL checks)"""
        self._query = self._query.is_(column, value)
        return self
    
    def in_(self, column: str, values: List[Any]) -> "QueryBuilder[T]":
        """Filter where column IN values"""
        self._query = self._query.in_(column, values)
        return self
    
    def order(self, column: str, desc: bool = False) -> "QueryBuilder[T]":
        """Order by column"""
        self._query = self._query.order(column, desc=desc)
        return self
    
    def limit(self, count: int) -> "QueryBuilder[T]":
        """Limit results"""
        self._query = self._query.limit(count)
        return self
    
    def offset(self, count: int) -> "QueryBuilder[T]":
        """Offset results"""
        self._query = self._query.range(count, count + 999999)
        return self
    
    def range(self, start: int, end: int) -> "QueryBuilder[T]":
        """Range of results"""
        self._query = self._query.range(start, end)
        return self
    
    def single(self) -> "QueryBuilder[T]":
        """Expect single result"""
        self._query = self._query.single()
        return self
    
    def maybe_single(self) -> "QueryBuilder[T]":
        """Maybe return single result"""
        self._query = self._query.maybe_single()
        return self
    
    async def execute(self) -> List[Dict[str, Any]]:
        """
        Execute query and return results
        
        Returns:
            List of results
        """
        try:
            result = self._query.execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")
            raise
    
    async def count(self) -> int:
        """
        Get count of matching records
        
        Returns:
            Record count
        """
        try:
            result = self._query.execute(count="exact")
            return result.count if hasattr(result, 'count') else 0
        except Exception as e:
            logger.error(f"Count query failed: {str(e)}")
            raise


# ========================================
# CRUD Helper Functions
# ========================================

async def get_by_id(
    client: Client,
    table: str,
    record_id: str,
    columns: str = "*"
) -> Optional[Dict[str, Any]]:
    """
    Get record by ID
    
    Args:
        client: Supabase client
        table: Table name
        record_id: Record ID
        columns: Columns to select
        
    Returns:
        Record dict or None if not found
    """
    try:
        result = await QueryBuilder(client, table) \
            .select(columns) \
            .eq("id", record_id) \
            .maybe_single() \
            .execute()
        
        return result[0] if result else None
    except Exception as e:
        logger.error(f"Get by ID failed for {table}/{record_id}: {str(e)}")
        raise


async def create_record(
    client: Client,
    table: str,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Create new record
    
    Args:
        client: Supabase client
        table: Table name
        data: Record data
        
    Returns:
        Created record
    """
    try:
        result = client.table(table).insert(data).execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        logger.error(f"Create record failed for {table}: {str(e)}")
        raise


async def update_record(
    client: Client,
    table: str,
    record_id: str,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update record
    
    Args:
        client: Supabase client
        table: Table name
        record_id: Record ID
        data: Update data
        
    Returns:
        Updated record
    """
    try:
        result = client.table(table) \
            .update(data) \
            .eq("id", record_id) \
            .execute()
        
        return result.data[0] if result.data else {}
    except Exception as e:
        logger.error(f"Update record failed for {table}/{record_id}: {str(e)}")
        raise


async def delete_record(
    client: Client,
    table: str,
    record_id: str
) -> bool:
    """
    Delete record
    
    Args:
        client: Supabase client
        table: Table name
        record_id: Record ID
        
    Returns:
        True if deleted successfully
    """
    try:
        client.table(table).delete().eq("id", record_id).execute()
        return True
    except Exception as e:
        logger.error(f"Delete record failed for {table}/{record_id}: {str(e)}")
        raise


async def list_records(
    client: Client,
    table: str,
    filters: Optional[Dict[str, Any]] = None,
    order_by: Optional[str] = None,
    desc: bool = False,
    limit: int = 50,
    offset: int = 0,
    columns: str = "*"
) -> List[Dict[str, Any]]:
    """
    List records with filtering and pagination
    
    Args:
        client: Supabase client
        table: Table name
        filters: Filter conditions as dict
        order_by: Column to order by
        desc: Order descending
        limit: Max records to return
        offset: Number of records to skip
        columns: Columns to select
        
    Returns:
        List of records
    """
    try:
        query = QueryBuilder(client, table).select(columns)
        
        # Apply filters
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        # Apply ordering
        if order_by:
            query = query.order(order_by, desc=desc)
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        return await query.execute()
    except Exception as e:
        logger.error(f"List records failed for {table}: {str(e)}")
        raise


# ========================================
# Workspace Helper Functions
# ========================================

async def get_user_workspaces(
    client: Client,
    user_id: str
) -> List[Dict[str, Any]]:
    """
    Get all workspaces for a user
    
    Args:
        client: Supabase client
        user_id: User ID
        
    Returns:
        List of workspaces with role info
    """
    try:
        result = await QueryBuilder(client, "workspace_members") \
            .select("workspace_id, role, workspaces(*)") \
            .eq("user_id", user_id) \
            .execute()
        
        return result
    except Exception as e:
        logger.error(f"Get user workspaces failed for {user_id}: {str(e)}")
        raise


async def check_workspace_access(
    client: Client,
    user_id: str,
    workspace_id: str,
    required_role: Optional[str] = None
) -> bool:
    """
    Check if user has access to workspace
    
    Args:
        client: Supabase client
        user_id: User ID
        workspace_id: Workspace ID
        required_role: Optional required role (owner, admin, member)
        
    Returns:
        True if user has access
    """
    try:
        query = QueryBuilder(client, "workspace_members") \
            .select("role") \
            .eq("user_id", user_id) \
            .eq("workspace_id", workspace_id)
        
        result = await query.execute()
        
        if not result:
            return False
        
        if required_role:
            user_role = result[0].get("role")
            role_hierarchy = {"owner": 3, "admin": 2, "member": 1}
            return role_hierarchy.get(user_role, 0) >= role_hierarchy.get(required_role, 0)
        
        return True
    except Exception as e:
        logger.error(f"Check workspace access failed: {str(e)}")
        return False


# ========================================
# Export all helpers
# ========================================

__all__ = [
    "get_client",
    "get_db",
    "QueryBuilder",
    "get_by_id",
    "create_record",
    "update_record",
    "delete_record",
    "list_records",
    "get_user_workspaces",
    "check_workspace_access",
]
