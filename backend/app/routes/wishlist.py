from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.routes.auth import get_current_user
from app.models.schemas import WishlistProduct, WishlistItemResponse
from app import database

router = APIRouter(prefix="/wishlist", tags=["wishlist"])

@router.get("", response_model=List[WishlistItemResponse])
async def get_user_wishlist(current_user: Dict = Depends(get_current_user)):
    items = await database.get_wishlist(current_user["id"])
    return items

@router.post("", response_model=WishlistItemResponse)
async def add_item_to_wishlist(
    product: WishlistProduct,
    current_user: Dict = Depends(get_current_user)
):
    # Add item
    item = await database.add_to_wishlist(current_user["id"], product.model_dump())
    
    # Simulate adding an alert notification
    await database.add_notification(
        user_id=current_user["id"],
        n_type="price_drop",
        message=f"Alert set: We'll notify you if price drops for {product.title[:25]}..."
    )
    
    return WishlistItemResponse(**item)

@router.delete("/{wishlist_item_id}")
async def remove_item_from_wishlist(
    wishlist_item_id: str,
    current_user: Dict = Depends(get_current_user)
):
    success = await database.remove_from_wishlist(current_user["id"], wishlist_item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found or unauthorized"
        )
    return {"message": "Item removed from wishlist"}
