"""
OpenAI service for AI-powered features
"""
from openai import AsyncOpenAI
from app.config import settings


class AIService:
    """Service for interacting with OpenAI API"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
    
    async def generate_text(
        self,
        prompt: str,
        system_message: str = "You are a helpful CRM assistant.",
        max_tokens: int = None,
    ) -> str:
        """
        Generate text using OpenAI GPT-4
        
        Args:
            prompt: User prompt
            system_message: System message to set context
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=max_tokens or self.max_tokens,
                temperature=0.7,
            )
            
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"AI generation failed: {str(e)}")
    
    async def generate_email_template(
        self,
        context: dict,
    ) -> str:
        """
        Generate email template based on context
        
        Args:
            context: Context information for email generation
            
        Returns:
            Generated email template
        """
        prompt = f"""
        Generate a professional email template with the following context:
        
        Contact Name: {context.get('contact_name', 'N/A')}
        Purpose: {context.get('purpose', 'N/A')}
        Additional Info: {context.get('additional_info', 'N/A')}
        
        Please create a professional, friendly email.
        """
        
        return await self.generate_text(
            prompt=prompt,
            system_message="You are an expert email copywriter for business communications.",
        )


# Singleton instance
ai_service = AIService()
