"""
Supabase Database Configuration and Client Setup
Provides configured Supabase client instances for different use cases
"""
from supabase import create_client, Client
from app.config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class SupabaseConfig:
    """
    Supabase configuration and client management
    Provides both anonymous and service role clients
    """
    
    def __init__(self):
        self._anon_client: Optional[Client] = None
        self._service_client: Optional[Client] = None
    
    @property
    def anon_client(self) -> Client:
        """
        Get Supabase client with anonymous key
        Use this for user-facing operations (respects RLS)
        """
        if self._anon_client is None:
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")

            self._anon_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
            logger.info("Supabase anonymous client initialized")

        return self._anon_client
    
    @property
    def service_client(self) -> Client:
        """
        Get Supabase client with service role key
        Use this for admin operations (bypasses RLS)
        WARNING: Only use server-side, never expose to client
        """
        if self._service_client is None:
            if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

            self._service_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY
            )
            logger.info("Supabase service client initialized")

        return self._service_client
    
    def get_authenticated_client(self, access_token: str) -> Client:
        """
        Get Supabase client authenticated with user token
        Use this for operations on behalf of a specific user (respects RLS)

        Args:
            access_token: JWT access token from authenticated user

        Returns:
            Authenticated Supabase client
        """
        # Create a new client and set the session manually
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
        # Set the access token in the postgrest client
        client.postgrest.auth(access_token)
        return client
    
    async def test_connection(self) -> bool:
        """
        Test database connection
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            # Try a simple query to test connection
            result = self.anon_client.table('user_profiles').select('id').limit(1).execute()
            logger.info("Supabase connection test successful")
            return True
        except Exception as e:
            logger.error(f"Supabase connection test failed: {str(e)}")
            return False


# Singleton instance
supabase_config = SupabaseConfig()


# Convenience accessors
def get_supabase_client(use_service_role: bool = False) -> Client:
    """
    Get Supabase client
    
    Args:
        use_service_role: If True, returns service role client (bypasses RLS)
                         If False, returns anonymous client (respects RLS)
    
    Returns:
        Configured Supabase client
    """
    if use_service_role:
        return supabase_config.service_client
    return supabase_config.anon_client


def get_authenticated_supabase_client(access_token: str) -> Client:
    """
    Get Supabase client authenticated with user token
    
    Args:
        access_token: JWT access token from authenticated user
        
    Returns:
        Authenticated Supabase client
    """
    return supabase_config.get_authenticated_client(access_token)


# Database helper functions
class SupabaseDatabase:
    """Helper class for common database operations"""
    
    def __init__(self, client: Client):
        self.client = client
    
    async def create_workspace(
        self,
        name: str,
        slug: str,
        owner_id: str,
        config: dict = None
    ) -> dict:
        """
        Create a new workspace
        
        Args:
            name: Workspace name
            slug: URL-friendly unique identifier
            owner_id: Owner user ID
            config: Optional workspace configuration
            
        Returns:
            Created workspace data
        """
        data = {
            "name": name,
            "slug": slug,
            "owner_id": owner_id,
            "config": config or {}
        }
        
        result = self.client.table('workspaces').insert(data).execute()
        return result.data[0] if result.data else None
    
    async def get_user_workspaces(self, user_id: str) -> list:
        """
        Get all workspaces for a user
        
        Args:
            user_id: User ID
            
        Returns:
            List of workspaces
        """
        result = self.client.table('workspace_members')\
            .select('workspace_id, role, workspaces(*)')\
            .eq('user_id', user_id)\
            .execute()
        
        return result.data if result.data else []
    
    async def create_entity(
        self,
        workspace_id: str,
        entity_name: str,
        display_name: str,
        display_name_singular: str,
        fields: list,
        **kwargs
    ) -> dict:
        """
        Create a new CRM entity
        
        Args:
            workspace_id: Workspace ID
            entity_name: Internal entity name (e.g., 'contacts')
            display_name: Display name plural (e.g., 'Contacts')
            display_name_singular: Display name singular (e.g., 'Contact')
            fields: List of field definitions
            **kwargs: Additional entity properties (icon, color, etc.)
            
        Returns:
            Created entity data
        """
        data = {
            "workspace_id": workspace_id,
            "entity_name": entity_name,
            "display_name": display_name,
            "display_name_singular": display_name_singular,
            "fields": fields,
            **kwargs
        }
        
        result = self.client.table('crm_entities').insert(data).execute()
        return result.data[0] if result.data else None
    
    async def create_record(
        self,
        workspace_id: str,
        entity_id: str,
        data: dict,
        created_by: str,
        tags: list = None
    ) -> dict:
        """
        Create a new CRM record
        
        Args:
            workspace_id: Workspace ID
            entity_id: Entity ID
            data: Record data (JSONB)
            created_by: User ID creating the record
            tags: Optional list of tags
            
        Returns:
            Created record data
        """
        record_data = {
            "workspace_id": workspace_id,
            "entity_id": entity_id,
            "data": data,
            "created_by": created_by,
            "tags": tags or []
        }
        
        result = self.client.table('crm_records').insert(record_data).execute()
        return result.data[0] if result.data else None
    
    async def get_records(
        self,
        workspace_id: str,
        entity_id: str,
        limit: int = 100,
        offset: int = 0,
        archived: bool = False
    ) -> list:
        """
        Get CRM records for an entity
        
        Args:
            workspace_id: Workspace ID
            entity_id: Entity ID
            limit: Maximum number of records to return
            offset: Offset for pagination
            archived: Include archived records
            
        Returns:
            List of records
        """
        query = self.client.table('crm_records')\
            .select('*')\
            .eq('workspace_id', workspace_id)\
            .eq('entity_id', entity_id)\
            .eq('is_archived', archived)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .offset(offset)
        
        result = query.execute()
        return result.data if result.data else []
    
    async def create_activity(
        self,
        workspace_id: str,
        record_id: str,
        activity_type: str,
        title: str,
        created_by: str,
        **kwargs
    ) -> dict:
        """
        Create an activity for a CRM record
        
        Args:
            workspace_id: Workspace ID
            record_id: CRM record ID
            activity_type: Type of activity (call, email, meeting, etc.)
            title: Activity title
            created_by: User ID creating the activity
            **kwargs: Additional activity properties
            
        Returns:
            Created activity data
        """
        activity_data = {
            "workspace_id": workspace_id,
            "record_id": record_id,
            "activity_type": activity_type,
            "title": title,
            "created_by": created_by,
            **kwargs
        }
        
        result = self.client.table('activities').insert(activity_data).execute()
        return result.data[0] if result.data else None


# Helper to get database instance
def get_database(client: Client = None) -> SupabaseDatabase:
    """
    Get database helper instance
    
    Args:
        client: Optional Supabase client (uses anonymous client if not provided)
        
    Returns:
        SupabaseDatabase instance
    """
    if client is None:
        client = get_supabase_client()
    return SupabaseDatabase(client)
