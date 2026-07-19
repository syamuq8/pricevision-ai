from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = ""
    is_admin: bool
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class SearchResponse(BaseModel):
    id: str
    user_id: Optional[str]
    query_type: str
    query_val: str
    results: List[Dict[str, Any]]
    created_at: str

class WishlistProduct(BaseModel):
    product_id: str
    title: str
    price: float
    original_price: Optional[float] = None
    discount: Optional[float] = None
    rating: Optional[float] = None
    image_url: Optional[str] = None
    url: str
    site_name: str

class WishlistItemResponse(BaseModel):
    id: str
    user_id: str
    product_id: str
    title: str
    price: Optional[float] = None
    original_price: Optional[float] = None
    discount: Optional[float] = None
    rating: Optional[float] = None
    image_url: Optional[str] = None
    url: str
    site_name: str
    created_at: str

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    message: str
    read: bool
    created_at: str

class PriceHistoryPoint(BaseModel):
    price: float
    created_at: str

class PriceHistoryResponse(BaseModel):
    site_name: str
    product_key: str
    history: List[PriceHistoryPoint]
