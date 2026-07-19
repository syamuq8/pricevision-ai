from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.routes.auth import get_current_user
from app.models.schemas import NotificationResponse
from app import database

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[NotificationResponse])
async def get_user_notifications(current_user: Dict = Depends(get_current_user)):
    notifications = await database.get_notifications(current_user["id"])
    return notifications

@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user: Dict = Depends(get_current_user)
):
    success = await database.mark_notification_read(current_user["id"], notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or unauthorized"
        )
    return {"message": "Notification marked as read"}
