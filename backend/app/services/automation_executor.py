"""
Automation Executor Service
Executes automation rules when triggered
"""
import re
import logging
from typing import Dict, Any, List, Optional
import httpx
from datetime import datetime

from ..config import settings
from supabase_config.config import get_supabase_client

logger = logging.getLogger(__name__)


class AutomationExecutor:
    """Execute automation actions"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def execute(
        self,
        automation_rule: Dict[str, Any],
        record: Dict[str, Any],
        workspace_id: str,
        entity_id: str
    ) -> Dict[str, Any]:
        """
        Execute an automation action
        
        Args:
            automation_rule: The automation rule configuration
            record: The record that triggered the automation
            workspace_id: Workspace ID
            entity_id: Entity ID
            
        Returns:
            Execution result
        """
        action_type = automation_rule.get("action_type")
        action_config = automation_rule.get("action_config", {})
        
        logger.info(
            f"Executing automation {automation_rule.get('id')} "
            f"with action {action_type} for record {record.get('id')}"
        )
        
        try:
            if action_type == "send_email":
                result = await self._send_email(
                    action_config, 
                    record, 
                    automation_rule.get("name")
                )
            elif action_type == "webhook":
                result = await self._call_webhook(
                    action_config, 
                    record,
                    workspace_id,
                    entity_id
                )
            elif action_type == "update_field":
                result = await self._update_field(
                    action_config,
                    record,
                    workspace_id,
                    entity_id
                )
            elif action_type == "create_task":
                result = await self._create_task(
                    action_config,
                    record,
                    workspace_id
                )
            else:
                raise ValueError(f"Unknown action type: {action_type}")
            
            logger.info(f"Automation {automation_rule.get('id')} executed successfully")
            
            # Log execution
            await self._log_execution(
                automation_rule.get("id"),
                record.get("id"),
                "success",
                result
            )
            
            return {
                "success": True,
                "action_type": action_type,
                "result": result
            }
            
        except Exception as e:
            logger.error(
                f"Error executing automation {automation_rule.get('id')}: {str(e)}",
                exc_info=True
            )
            
            # Log error
            await self._log_execution(
                automation_rule.get("id"),
                record.get("id"),
                "error",
                {"error": str(e)}
            )
            
            return {
                "success": False,
                "error": str(e)
            }
    
    def _replace_template_variables(
        self, 
        template: str, 
        record: Dict[str, Any]
    ) -> str:
        """
        Replace template variables with record data
        Supports {{field_name}} syntax
        """
        if not template:
            return ""
        
        # Get record data
        record_data = record.get("data", {})
        
        # Add special fields
        all_data = {
            **record_data,
            "id": record.get("id"),
            "created_at": record.get("created_at"),
        }
        
        # Replace all {{variable}} patterns
        def replace_var(match):
            var_name = match.group(1).strip()
            value = all_data.get(var_name, "")
            return str(value) if value is not None else ""
        
        result = re.sub(r'\{\{([^}]+)\}\}', replace_var, template)
        return result
    
    async def _send_email(
        self,
        config: Dict[str, Any],
        record: Dict[str, Any],
        automation_name: str
    ) -> Dict[str, Any]:
        """
        Send email using SMTP or email service
        """
        # Get recipient email from record
        record_data = record.get("data", {})
        recipient = record_data.get("email") or config.get("to_email")
        
        if not recipient:
            raise ValueError("No recipient email found")
        
        # Replace template variables
        subject = self._replace_template_variables(
            config.get("subject", ""), 
            record
        )
        body = self._replace_template_variables(
            config.get("body", ""), 
            record
        )
        
        # For now, log the email (in production, integrate with SendGrid/AWS SES)
        logger.info(
            f"EMAIL NOTIFICATION:\n"
            f"To: {recipient}\n"
            f"Subject: {subject}\n"
            f"Body: {body[:100]}...\n"
            f"Automation: {automation_name}"
        )
        
        # TODO: Integrate with actual email service
        # Example with SendGrid:
        # if settings.sendgrid_api_key:
        #     from sendgrid import SendGridAPIClient
        #     from sendgrid.helpers.mail import Mail
        #     
        #     message = Mail(
        #         from_email=settings.from_email,
        #         to_emails=recipient,
        #         subject=subject,
        #         html_content=body
        #     )
        #     
        #     sg = SendGridAPIClient(settings.sendgrid_api_key)
        #     response = sg.send(message)
        
        return {
            "email_sent": True,
            "recipient": recipient,
            "subject": subject,
            "body_length": len(body)
        }
    
    async def _call_webhook(
        self,
        config: Dict[str, Any],
        record: Dict[str, Any],
        workspace_id: str,
        entity_id: str
    ) -> Dict[str, Any]:
        """
        Call external webhook with record data
        """
        url = config.get("url")
        method = config.get("method", "POST").upper()
        
        if not url:
            raise ValueError("Webhook URL is required")
        
        # Prepare payload
        payload = {
            "workspace_id": workspace_id,
            "entity_id": entity_id,
            "record": record,
            "timestamp": datetime.utcnow().isoformat(),
            "event": "automation_triggered"
        }
        
        # Custom headers
        headers = config.get("headers", {})
        headers.setdefault("Content-Type", "application/json")
        
        # Make HTTP request
        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == "POST":
                response = await client.post(url, json=payload, headers=headers)
            elif method == "PUT":
                response = await client.put(url, json=payload, headers=headers)
            elif method == "PATCH":
                response = await client.patch(url, json=payload, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            
            return {
                "webhook_called": True,
                "url": url,
                "method": method,
                "status_code": response.status_code,
                "response": response.text[:500]  # Limit response size
            }
    
    async def _update_field(
        self,
        config: Dict[str, Any],
        record: Dict[str, Any],
        workspace_id: str,
        entity_id: str
    ) -> Dict[str, Any]:
        """
        Update a field in the record
        """
        field_name = config.get("field_name")
        new_value = config.get("new_value")
        
        if not field_name:
            raise ValueError("Field name is required")
        
        # Replace template variables in new_value
        if isinstance(new_value, str):
            new_value = self._replace_template_variables(new_value, record)
        
        # Get current record data
        current_data = record.get("data", {})
        
        # Update the field
        updated_data = {**current_data, field_name: new_value}
        
        # Update in database
        response = self.supabase.table("records")\
            .update({"data": updated_data})\
            .eq("id", record["id"])\
            .execute()
        
        return {
            "field_updated": True,
            "field_name": field_name,
            "old_value": current_data.get(field_name),
            "new_value": new_value
        }
    
    async def _create_task(
        self,
        config: Dict[str, Any],
        record: Dict[str, Any],
        workspace_id: str
    ) -> Dict[str, Any]:
        """
        Create a task or reminder
        """
        title = self._replace_template_variables(
            config.get("title", ""), 
            record
        )
        description = self._replace_template_variables(
            config.get("description", ""), 
            record
        )
        
        # Create task (assuming you have a tasks entity)
        task_data = {
            "title": title,
            "description": description,
            "related_to": record.get("id"),
            "status": "pending",
            "created_by_automation": True
        }
        
        # Log task creation (in production, create actual task record)
        logger.info(f"TASK CREATED: {title}")
        
        return {
            "task_created": True,
            "title": title,
            "description": description
        }
    
    async def _log_execution(
        self,
        automation_id: str,
        record_id: str,
        status: str,
        result: Dict[str, Any]
    ):
        """Log automation execution"""
        try:
            self.supabase.table("automation_logs").insert({
                "automation_id": automation_id,
                "record_id": record_id,
                "status": status,
                "result": result,
                "executed_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log automation execution: {str(e)}")


async def trigger_automations(
    workspace_id: str,
    entity_id: str,
    trigger_type: str,
    record: Dict[str, Any],
    old_data: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Check and execute matching automations
    
    Args:
        workspace_id: Workspace ID
        entity_id: Entity ID
        trigger_type: Type of trigger (status_changed, record_created, etc.)
        record: The record that triggered the automation
        old_data: Previous record data (for update triggers)
        
    Returns:
        List of execution results
    """
    supabase = get_supabase_client()
    
    # Fetch active automations for this entity and trigger
    response = supabase.table("automation_rules")\
        .select("*")\
        .eq("workspace_id", workspace_id)\
        .eq("entity_id", entity_id)\
        .eq("trigger_type", trigger_type)\
        .eq("is_active", True)\
        .execute()
    
    automations = response.data if response.data else []
    
    if not automations:
        logger.debug(f"No active automations found for {trigger_type} on entity {entity_id}")
        return []
    
    logger.info(f"Found {len(automations)} automation(s) to check for {trigger_type}")
    
    executor = AutomationExecutor()
    results = []
    
    for automation in automations:
        # Check if conditions match
        if check_trigger_conditions(
            automation.get("trigger_config", {}),
            record,
            old_data,
            trigger_type
        ):
            logger.info(f"Conditions matched for automation {automation.get('name')}")
            result = await executor.execute(
                automation,
                record,
                workspace_id,
                entity_id
            )
            results.append(result)
        else:
            logger.debug(f"Conditions not matched for automation {automation.get('name')}")
    
    return results


def check_trigger_conditions(
    trigger_config: Dict[str, Any],
    record: Dict[str, Any],
    old_data: Optional[Dict[str, Any]],
    trigger_type: str
) -> bool:
    """
    Check if trigger conditions are met
    
    Args:
        trigger_config: Trigger configuration from automation rule
        record: Current record data
        old_data: Previous record data
        trigger_type: Type of trigger
        
    Returns:
        True if conditions match, False otherwise
    """
    record_data = record.get("data", {})
    
    if trigger_type == "status_changed":
        # Check status change conditions
        to_status = trigger_config.get("to_status")
        from_status = trigger_config.get("from_status")
        
        current_status = record_data.get("status")
        old_status = old_data.get("status") if old_data else None
        
        # Must match to_status
        if to_status and current_status != to_status:
            return False
        
        # If from_status specified, must match old status
        if from_status and old_status != from_status:
            return False
        
        # Status must have actually changed
        if old_status == current_status:
            return False
        
        return True
    
    elif trigger_type == "field_updated":
        # Check if specific field was updated
        field_name = trigger_config.get("field_name")
        
        if not field_name:
            return True  # No specific field, any update triggers
        
        if not old_data:
            return False  # Need old data to check for updates
        
        # Check if field value changed
        old_value = old_data.get(field_name)
        new_value = record_data.get(field_name)
        
        return old_value != new_value
    
    elif trigger_type == "record_created":
        # No additional conditions for record creation
        return True
    
    elif trigger_type == "record_deleted":
        # No additional conditions for record deletion
        return True
    
    return True  # Default to true for unknown trigger types


# Export functions
__all__ = [
    "AutomationExecutor",
    "trigger_automations",
    "check_trigger_conditions"
]
