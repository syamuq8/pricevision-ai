from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.routes.auth import get_current_user
from app import database

router = APIRouter(prefix="/history", tags=["history"])

@router.get("")
async def get_history(current_user: Dict = Depends(get_current_user)):
    records = await database.get_search_records(current_user["id"])
    return records

@router.delete("/{search_id}")
async def delete_history_item(search_id: str, current_user: Dict = Depends(get_current_user)):
    success = await database.delete_search_record(current_user["id"], search_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search record not found or unauthorized"
        )
    return {"message": "History item deleted successfully"}
