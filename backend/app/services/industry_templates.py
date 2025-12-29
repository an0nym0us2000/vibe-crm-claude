"""
Pre-built industry templates for CRM configuration
Example configurations for common industries
"""
from app.services.ai_config_generator import (
    CRMConfig,
    EntityConfig,
    FieldConfig,
    AutomationSuggestion
)


# ========================================
# Real Estate Agency Template
# ========================================

def get_real_estate_template() -> CRMConfig:
    """
    Complete CRM configuration for real estate agency
    
    Includes: Properties, Listings, Buyers, Sellers, Viewings, Offers
    """
    return CRMConfig(
        workspace_name="Real Estate CRM",
        workspace_description="Manage properties, listings, buyers, sellers, and viewings",
        industry="real_estate",
        entities=[
            EntityConfig(
                entity_name="properties",
                display_name="Properties",
                display_name_singular="Property",
                icon="HomeIcon",
                description="Properties available for sale or rent",
                fields=[
                    FieldConfig(name="address", display_name="Address", type="text", required=True),
                    FieldConfig(name="city", display_name="City", type="text", required=True),
                    FieldConfig(name="state", display_name="State", type="text"),
                    FieldConfig(name="zip_code", display_name="ZIP Code", type="text"),
                    FieldConfig(
                        name="property_type",
                        display_name="Property Type",
                        type="select",
                        required=True,
                        options=["house", "apartment", "condo", "townhouse", "land", "commercial"]
                    ),
                    FieldConfig(
                        name="listing_type",
                        display_name="Listing Type",
                        type="select",
                        required=True,
                        options=["for_sale", "for_rent", "sold", "rented"]
                    ),
                    FieldConfig(name="bedrooms", display_name="Bedrooms", type="number"),
                    FieldConfig(name="bathrooms", display_name="Bathrooms", type="number"),
                    FieldConfig(name="square_feet", display_name="Square Feet", type="number"),
                    FieldConfig(name="price", display_name="Price", type="currency", required=True),
                    FieldConfig(name="year_built", display_name="Year Built", type="number"),
                    FieldConfig(name="description", display_name="Description", type="textarea"),
                    FieldConfig(name="features", display_name="Features", type="textarea"),
                    FieldConfig(
                        name="status",
                        display_name="Status",
                        type="select",
                        required=True,
                        options=["available", "pending", "sold", "off_market"],
                        default_value="available"
                    ),
                ],
                views=["table", "cards", "map"],
                default_view="cards",
                color="#10B981"
            ),
            EntityConfig(
                entity_name="buyers",
                display_name="Buyers",
                display_name_singular="Buyer",
                icon="PersonIcon",
                description="Potential property buyers",
                fields=[
                    FieldConfig(name="full_name", display_name="Full Name", type="text", required=True),
                    FieldConfig(name="email", display_name="Email", type="email", required=True),
                    FieldConfig(name="phone", display_name="Phone", type="phone"),
                    FieldConfig(name="budget_min", display_name="Min Budget", type="currency"),
                    FieldConfig(name="budget_max", display_name="Max Budget", type="currency"),
                    FieldConfig(
                        name="preferred_type",
                        display_name="Preferred Property Type",
                        type="multiselect",
                        options=["house", "apartment", "condo", "townhouse"]
                    ),
                    FieldConfig(name="preferred_location", display_name="Preferred Location", type="text"),
                    FieldConfig(
                        name="status",
                        display_name="Buyer Status",
                        type="select",
                        required=True,
                        options=["lead", "qualified", "viewing", "offer_made", "purchased"],
                        default_value="lead"
                    ),
                    FieldConfig(name="notes", display_name="Notes", type="textarea"),
                ],
                views=["table", "kanban"],
                default_view="kanban",
                color="#3B82F6"
            ),
            EntityConfig(
                entity_name="viewings",
                display_name="Viewings",
                display_name_singular="Viewing",
                icon="CalendarIcon",
                description="Property viewing appointments",
                fields=[
                    FieldConfig(name="property_id", display_name="Property", type="relation", required=True),
                    FieldConfig(name="buyer_id", display_name="Buyer", type="relation", required=True),
                    FieldConfig(name="viewing_date", display_name="Date & Time", type="datetime", required=True),
                    FieldConfig(name="duration_minutes", display_name="Duration (min)", type="number", default_value=30),
                    FieldConfig(
                        name="status",
                        display_name="Status",
                        type="select",
                        required=True,
                        options=["scheduled", "completed", "cancelled", "no_show"],
                        default_value="scheduled"
                    ),
                    FieldConfig(name="agent_notes", display_name="Agent Notes", type="textarea"),
                    FieldConfig(name="buyer_feedback", display_name="Buyer Feedback", type="textarea"),
                ],
                views=["table", "calendar"],
                default_view="calendar",
                color="#8B5CF6"
            ),
        ],
        suggested_automations=[
            AutomationSuggestion(
                name="New Buyer Welcome Email",
                description="Send welcome email when new buyer is added",
                trigger_type="record_created",
                trigger_config={"entity": "buyers"},
                action_type="send_email",
                action_config={"template": "buyer_welcome", "to_field": "email"},
                entity_name="buyers"
            ),
            AutomationSuggestion(
                name="Viewing Reminder",
                description="Send reminder 24 hours before viewing",
                trigger_type="scheduled",
                trigger_config={"entity": "viewings", "before_field": "viewing_date", "hours": 24},
                action_type="send_email",
                action_config={"template": "viewing_reminder"},
                entity_name="viewings"
            ),
        ]
    )


# ========================================
# Recruitment Agency Template
# ========================================

def get_recruitment_template() -> CRMConfig:
    """
    Complete CRM configuration for recruitment agency
    
    Includes: Candidates, Jobs, Applications, Interviews, Clients
    """
    return CRMConfig(
        workspace_name="Recruitment CRM",
        workspace_description="Manage candidates, job openings, applications, and interviews",
        industry="recruitment",
        entities=[
            EntityConfig(
                entity_name="candidates",
                display_name="Candidates",
                display_name_singular="Candidate",
                icon="PersonIcon",
                description="Job seekers and potential hires",
                fields=[
                    FieldConfig(name="full_name", display_name="Full Name", type="text", required=True),
                    FieldConfig(name="email", display_name="Email", type="email", required=True),
                    FieldConfig(name="phone", display_name="Phone", type="phone"),
                    FieldConfig(name="current_title", display_name="Current Title", type="text"),
                    FieldConfig(name="current_company", display_name="Current Company", type="text"),
                    FieldConfig(name="years_experience", display_name="Years of Experience", type="number"),
                    FieldConfig(
                        name="skills",
                        display_name="Skills",
                        type="multiselect",
                        options=["Python", "JavaScript", "React", "Node.js", "SQL", "AWS", "Docker", "Leadership"]
                    ),
                    FieldConfig(name="linkedin_url", display_name="LinkedIn", type="url"),
                    FieldConfig(name="resume_url", display_name="Resume", type="file"),
                    FieldConfig(name="expected_salary", display_name="Expected Salary", type="currency"),
                    FieldConfig(
                        name="status",
                        display_name="Status",
                        type="select",
                        required=True,
                        options=["sourced", "contacted", "screening", "interviewing", "offer", "placed", "rejected"],
                        default_value="sourced"
                    ),
                    FieldConfig(name="notes", display_name="Notes", type="textarea"),
                ],
                views=["table", "kanban"],
                default_view="kanban",
                color="#F59E0B"
            ),
            EntityConfig(
                entity_name="jobs",
                display_name="Jobs",
                display_name_singular="Job",
                icon="BriefcaseIcon",
                description="Open job positions",
                fields=[
                    FieldConfig(name="title", display_name="Job Title", type="text", required=True),
                    FieldConfig(name="company", display_name="Company", type="text", required=True),
                    FieldConfig(name="location", display_name="Location", type="text"),
                    FieldConfig(
                        name="job_type",
                        display_name="Job Type",
                        type="select",
                        options=["full_time", "part_time", "contract", "temporary", "remote"]
                    ),
                    FieldConfig(name="salary_min", display_name="Salary Min", type="currency"),
                    FieldConfig(name="salary_max", display_name="Salary Max", type="currency"),
                    FieldConfig(name="description", display_name="Description", type="textarea"),
                    FieldConfig(name="requirements", display_name="Requirements", type="textarea"),
                    FieldConfig(
                        name="status",
                        display_name="Status",
                        type="select",
                        required=True,
                        options=["open", "on_hold", "filled", "cancelled"],
                        default_value="open"
                    ),
                    FieldConfig(name="posted_date", display_name="Posted Date", type="date"),
                    FieldConfig(name="deadline", display_name="Application Deadline", type="date"),
                ],
                views=["table", "cards"],
                default_view="table",
                color="#EF4444"
            ),
            EntityConfig(
                entity_name="interviews",
                display_name="Interviews",
                display_name_singular="Interview",
                icon="CalendarIcon",
                description="Scheduled interviews",
                fields=[
                    FieldConfig(name="candidate_id", display_name="Candidate", type="relation", required=True),
                    FieldConfig(name="job_id", display_name="Job", type="relation", required=True),
                    FieldConfig(name="interview_date", display_name="Date & Time", type="datetime", required=True),
                    FieldConfig(
                        name="type",
                        display_name="Interview Type",
                        type="select",
                        options=["phone_screen", "video", "in_person", "technical", "final"]
                    ),
                    FieldConfig(name="interviewer", display_name="Interviewer", type="text"),
                    FieldConfig(
                        name="status",
                        display_name="Status",
                        type="select",
                        options=["scheduled", "completed", "cancelled", "no_show"],
                        default_value="scheduled"
                    ),
                    FieldConfig(name="feedback", display_name="Feedback", type="textarea"),
                    FieldConfig(
                        name="rating",
                        display_name="Rating",
                        type="select",
                        options=["poor", "fair", "good", "excellent"]
                    ),
                ],
                views=["table", "calendar"],
                default_view="calendar",
                color="#8B5CF6"
            ),
        ],
        suggested_automations=[
            AutomationSuggestion(
                name="New Candidate Welcome",
                description="Send welcome email to new candidates",
                trigger_type="record_created",
                trigger_config={"entity": "candidates"},
                action_type="send_email",
                action_config={"template": "candidate_welcome", "to_field": "email"},
                entity_name="candidates"
            ),
            AutomationSuggestion(
                name="Interview Reminder",
                description="Send reminder 2 hours before interview",
                trigger_type="scheduled",
                trigger_config={"entity": "interviews", "before_field": "interview_date", "hours": 2},
                action_type="send_email",
                action_config={"template": "interview_reminder"},
                entity_name="interviews"
            ),
        ]
    )


# ========================================
# Consulting Firm Template
# ========================================

def get_consulting_template() -> CRMConfig:
    """
    Complete CRM configuration for consulting firm
    
    Includes: Clients, Projects, Proposals, Contracts, Deliverables
    """
    return CRMConfig(
        workspace_name="Consulting CRM",
        workspace_description="Manage clients, projects, proposals, and deliverables",
        industry="consulting",
        entities=[
            EntityConfig(
                entity_name="clients",
                display_name="Clients",
                display_name_singular="Client",
                icon="BuildingIcon",
                description="Client companies and organizations",
                fields=[
                    FieldConfig(name="company_name", display_name="Company Name", type="text", required=True),
                    FieldConfig(name="contact_name", display_name="Primary Contact", type="text", required=True),
                    FieldConfig(name="email", display_name="Email", type="email", required=True),
                    FieldConfig(name="phone", display_name="Phone", type="phone"),
                    FieldConfig(name="industry", display_name="Industry", type="text"),
                    FieldConfig(name="company_size", display_name="Company Size", type="select", 
                               options=["1-10", "11-50", "51-200", "201-500", "500+"]),
                    FieldConfig(name="website", display_name="Website", type="url"),
                    FieldConfig(
                        name="status",
                        display_name="Status",
                        type="select",
                        required=True,
                        options=["prospect", "active", "inactive", "churned"],
                        default_value="prospect"
                    ),
                    FieldConfig(name="notes", display_name="Notes", type="textarea"),
                ],
                views=["table", "cards"],
                default_view="table",
                color="#06B6D4"
            ),
            EntityConfig(
                entity_name="projects",
                display_name="Projects",
                display_name_singular="Project",
                icon="FolderIcon",
                description="Client projects and engagements",
                fields=[
                    FieldConfig(name="project_name", display_name="Project Name", type="text", required=True),
                    FieldConfig(name="client_id", display_name="Client", type="relation", required=True),
                    FieldConfig(name="description", display_name="Description", type="textarea"),
                    FieldConfig(name="start_date", display_name="Start Date", type="date", required=True),
                    FieldConfig(name="end_date", display_name="End Date", type="date"),
                    FieldConfig(name="budget", display_name="Budget", type="currency", required=True),
                    FieldConfig(
                        name="status",
                        display_name="Status",
                        type="select",
                        required=True,
                        options=["proposal", "approved", "in_progress", "on_hold", "completed", "cancelled"],
                        default_value="proposal"
                    ),
                    FieldConfig(name="project_manager", display_name="Project Manager", type="user"),
                    FieldConfig(name="team_members", display_name="Team Members", type="multiselect", 
                               options=["Consultant A", "Consultant B", "Analyst C"]),
                ],
                views=["table", "kanban", "timeline"],
                default_view="kanban",
                color="#10B981"
            ),
        ],
        suggested_automations=[
            AutomationSuggestion(
                name="Project Kickoff Email",
                description="Send kickoff email when project is approved",
                trigger_type="field_changed",
                trigger_config={"entity": "projects", "field": "status", "to_value": "approved"},
                action_type="send_email",
                action_config={"template": "project_kickoff"},
                entity_name="projects"
            ),
        ]
    )


# ========================================
# Sales Organization Template
# ========================================

def get_sales_template() -> CRMConfig:
    """
    Complete CRM configuration for sales organization
    
    Includes: Leads, Contacts, Deals, Companies, Tasks
    """
    return CRMConfig(
        workspace_name="Sales CRM",
        workspace_description="Manage leads, contacts, deals, and sales pipeline",
        industry="sales",
        entities=[
            EntityConfig(
                entity_name="leads",
                display_name="Leads",
                display_name_singular="Lead",
                icon="UserPlusIcon",
                description="Potential customers",
                fields=[
                    FieldConfig(name="full_name", display_name="Full Name", type="text", required=True),
                    FieldConfig(name="company", display_name="Company", type="text"),
                    FieldConfig(name="title", display_name="Job Title", type="text"),
                    FieldConfig(name="email", display_name="Email", type="email", required=True),
                    FieldConfig(name="phone", display_name="Phone", type="phone"),
                    FieldConfig(
                        name="source",
                        display_name="Lead Source",
                        type="select",
                        options=["website", "referral", "cold_call", "social_media", "event", "advertisement"]
                    ),
                    FieldConfig(
                        name="status",
                        display_name="Status",
                        type="select",
                        required=True,
                        options=["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"],
                        default_value="new"
                    ),
                    FieldConfig(name="estimated_value", display_name="Estimated Value", type="currency"),
                    FieldConfig(name="notes", display_name="Notes", type="textarea"),
                ],
                views=["table", "kanban"],
                default_view="kanban",
                color="#4F46E5"
            ),
            EntityConfig(
                entity_name="deals",
                display_name="Deals",
                display_name_singular="Deal",
                icon="CurrencyDollarIcon",
                description="Sales opportunities and deals",
                fields=[
                    FieldConfig(name="deal_name", display_name="Deal Name", type="text", required=True),
                    FieldConfig(name="contact_id", display_name="Contact", type="relation", required=True),
                    FieldConfig(name="company_id", display_name="Company", type="relation"),
                    FieldConfig(name="amount", display_name="Deal Amount", type="currency", required=True),
                    FieldConfig(
                        name="stage",
                        display_name="Stage",
                        type="select",
                        required=True,
                        options=["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"],
                        default_value="prospecting"
                    ),
                    FieldConfig(name="probability", display_name="Win Probability %", type="number"),
                    FieldConfig(name="expected_close_date", display_name="Expected Close Date", type="date"),
                    FieldConfig(name="owner", display_name="Sales Rep", type="user"),
                    FieldConfig(name="notes", display_name="Notes", type="textarea"),
                ],
                views=["table", "kanban"],
                default_view="kanban",
                color="#059669"
            ),
        ],
        suggested_automations=[
            AutomationSuggestion(
                name="Welcome New Leads",
                description="Send welcome email to new leads",
                trigger_type="record_created",
                trigger_config={"entity": "leads"},
                action_type="send_email",
                action_config={"template": "lead_welcome", "to_field": "email"},
                entity_name="leads"
            ),
            AutomationSuggestion(
                name="Deal Won Notification",
                description="Notify team when deal is won",
                trigger_type="field_changed",
                trigger_config={"entity": "deals", "field": "stage", "to_value": "closed_won"},
                action_type="send_notification",
                action_config={"message": "Deal won!", "notify_team": True},
                entity_name="deals"
            ),
        ]
    )


# ========================================
# Template Registry
# ========================================

INDUSTRY_TEMPLATES = {
    "real_estate": get_real_estate_template,
    "recruitment": get_recruitment_template,
    "consulting": get_consulting_template,
    "sales": get_sales_template,
}


def get_industry_template(industry: str) -> CRMConfig:
    """
    Get template for specific industry
    
    Args:
        industry: Industry name (real_estate, recruitment, consulting, sales)
        
    Returns:
        CRMConfig for the industry
        
    Raises:
        ValueError: If industry template not found
    """
    if industry.lower() not in INDUSTRY_TEMPLATES:
        raise ValueError(
            f"Industry template '{industry}' not found. "
            f"Available: {', '.join(INDUSTRY_TEMPLATES.keys())}"
        )
    
    return INDUSTRY_TEMPLATES[industry.lower()]()


def list_available_templates() -> list[str]:
    """
    List all available industry templates
    
    Returns:
        List of industry names
    """
    return list(INDUSTRY_TEMPLATES.keys())
