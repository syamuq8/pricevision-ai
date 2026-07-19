from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.routes.auth import get_current_admin_user
from app import database

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
async def get_all_users(admin_user: Dict = Depends(get_current_admin_user)):
    users = await database.get_admin_users()
    return users

@router.get("/searches")
async def get_all_searches(admin_user: Dict = Depends(get_current_admin_user)):
    searches = await database.get_admin_searches()
    return searches

@router.get("/analytics")
async def get_analytics(admin_user: Dict = Depends(get_current_admin_user)):
    analytics = await database.get_admin_analytics()
    return analytics

from pydantic import BaseModel

class AffiliateConfig(BaseModel):
    site_name: str
    affiliate_tag: str


@router.post("/affiliate")
async def update_affiliate_tag(
    config: AffiliateConfig,
    admin_user: Dict = Depends(get_current_admin_user)
):
    # Simulated affiliate setting store
    # In a real app we'd save this to DB/config
    return {"message": f"Affiliate tag for {config.site_name} updated successfully to {config.affiliate_tag}"}
