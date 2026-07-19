import os
import uuid
import datetime
import random
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, HttpUrl

from app.config import settings
from app.services.ai_service import AIService
from app.services.provider_service import provider_registry
from app.routes.auth import get_current_user, get_current_user_optional
from app import database

router = APIRouter(prefix="/products", tags=["products"])

class UrlSearchRequest(BaseModel):
    url: str

class TextSearchRequest(BaseModel):
    query: str

@router.post("/search/image")
async def search_by_image(
    file: UploadFile = File(...),
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    # Save the file to upload directory
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded image: {e}"
        )
        
    # 1. Analyze image using AI Service
    ai_details = AIService.analyze_image(file_path, file.filename)
    
    # Base prices for catalog items to keep calculations stable
    base_prices = {
        "prod_iphone15": 129900.0,
        "prod_sony_wh1000xm5": 29990.0,
        "prod_adidas_ultraboost": 17999.0,
        "prod_macbook_m3": 114900.0,
        "prod_samsung_s24": 129999.0,
        "prod_nescafe_gold": 950.0
    }
    
    base_price = base_prices.get(ai_details["product_id"], 5000.0)
    
    # 2. Search all providers concurrently
    results = await provider_registry.search_all(
        product_title=ai_details["product_name"],
        category=ai_details["category"],
        base_price=base_price
    )
    
    # 3. Record price history dynamically for mock data
    for r in results:
        # Record history for chart visualization
        await database.record_price(
            site_name=r["site_name"],
            product_key=f"{ai_details['product_id']}",
            price=r["price"]
        )
        # Ensure we have past data points so history works beautifully
        # Check if history exists, otherwise seed historical prices
        history = await database.get_price_history(r["site_name"], ai_details["product_id"])
        if len(history) < 3:
            for days_ago in [30, 20, 10]:
                historical_date = (datetime.datetime.now() - datetime.timedelta(days=days_ago)).isoformat()
                seed_price = int(r["price"] * random.uniform(0.95, 1.15))
                # Seed into DB
                conn = database.get_sqlite_conn() if database.use_sqlite else None
                if conn:
                    conn.execute(
                        "INSERT INTO price_history (id, site_name, product_key, price, created_at) VALUES (?, ?, ?, ?, ?)",
                        (str(uuid.uuid4()), r["site_name"], ai_details["product_id"], seed_price, historical_date)
                    )
                    conn.commit()
                    conn.close()
                else:
                    await database.mongo_db.price_history.insert_one({
                        "_id": str(uuid.uuid4()),
                        "site_name": r["site_name"],
                        "product_key": ai_details["product_id"],
                        "price": seed_price,
                        "created_at": historical_date
                    })
                    
    # 4. Generate recommendations
    ai_recommendations = AIService.generate_recommendations(results)
    
    # 5. Save search record for user history
    user_id = current_user["id"] if current_user else None
    await database.save_search_record(
        user_id=user_id,
        query_type="image",
        query_val=file.filename,
        results=results
    )
    
    return {
        "product_details": ai_details,
        "results": results,
        "recommendations": ai_recommendations
    }

@router.post("/search/url")
async def search_by_url(
    req: UrlSearchRequest,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    # Validate url
    if not (req.url.startswith("http://") or req.url.startswith("https://")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL format. Must start with http:// or https://"
        )
        
    # 1. Extract details from URL
    extracted = AIService.extract_url_details(req.url)
    
    # Base prices
    base_prices = {
        "prod_iphone15": 129900.0,
        "prod_sony_wh1000xm5": 29990.0,
        "prod_adidas_ultraboost": 17999.0,
        "prod_macbook_m3": 114900.0,
        "prod_samsung_s24": 129999.0,
        "prod_nescafe_gold": 950.0
    }
    base_price = base_prices.get(extracted["product_id"], 5000.0)
    
    # 2. Search other sites
    results = await provider_registry.search_all(
        product_title=extracted["title"],
        category=extracted["category"],
        base_price=base_price
    )
    
    # 3. Record price history dynamically for mock data
    for r in results:
        await database.record_price(
            site_name=r["site_name"],
            product_key=f"{extracted['product_id']}",
            price=r["price"]
        )
        # Seeding past history
        history = await database.get_price_history(r["site_name"], extracted["product_id"])
        if len(history) < 3:
            for days_ago in [30, 20, 10]:
                historical_date = (datetime.datetime.now() - datetime.timedelta(days=days_ago)).isoformat()
                seed_price = int(r["price"] * random.uniform(0.95, 1.15))
                conn = database.get_sqlite_conn() if database.use_sqlite else None
                if conn:
                    conn.execute(
                        "INSERT INTO price_history (id, site_name, product_key, price, created_at) VALUES (?, ?, ?, ?, ?)",
                        (str(uuid.uuid4()), r["site_name"], extracted["product_id"], seed_price, historical_date)
                    )
                    conn.commit()
                    conn.close()
                else:
                    await database.mongo_db.price_history.insert_one({
                        "_id": str(uuid.uuid4()),
                        "site_name": r["site_name"],
                        "product_key": extracted["product_id"],
                        "price": seed_price,
                        "created_at": historical_date
                    })
                    
    # 4. Generate recommendations
    ai_recommendations = AIService.generate_recommendations(results)
    
    # 5. Save search record
    user_id = current_user["id"] if current_user else None
    await database.save_search_record(
        user_id=user_id,
        query_type="url",
        query_val=req.url,
        results=results
    )
    
    return {
        "product_details": extracted,
        "results": results,
        "recommendations": ai_recommendations
    }

@router.post("/search/text")
async def search_by_text(
    req: TextSearchRequest,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    if not req.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be empty"
        )
        
    # 1. Semantic match against catalog
    matches = AIService.semantic_search(req.query)
    from app.services.ai_service import PRODUCT_CATALOG
    matched_product = matches[0] if matches else PRODUCT_CATALOG[0]
    
    base_prices = {
        "prod_iphone15": 129900.0,
        "prod_sony_wh1000xm5": 29990.0,
        "prod_adidas_ultraboost": 17999.0,
        "prod_macbook_m3": 114900.0,
        "prod_samsung_s24": 129999.0,
        "prod_nescafe_gold": 950.0
    }
    base_price = base_prices.get(matched_product["id"], 5000.0)
    
    # 2. Search other sites
    results = await provider_registry.search_all(
        product_title=req.query,
        category=matched_product["category"],
        base_price=base_price
    )
    
    # 3. Seeding past history
    for r in results:
        await database.record_price(
            site_name=r["site_name"],
            product_key=f"{matched_product['id']}",
            price=r["price"]
        )
        # Seeding past history
        history = await database.get_price_history(r["site_name"], matched_product["id"])
        if len(history) < 3:
            for days_ago in [30, 20, 10]:
                historical_date = (datetime.datetime.now() - datetime.timedelta(days=days_ago)).isoformat()
                seed_price = int(r["price"] * random.uniform(0.95, 1.15))
                conn = database.get_sqlite_conn() if database.use_sqlite else None
                if conn:
                    conn.execute(
                        "INSERT INTO price_history (id, site_name, product_key, price, created_at) VALUES (?, ?, ?, ?, ?)",
                        (str(uuid.uuid4()), r["site_name"], matched_product["id"], seed_price, historical_date)
                    )
                    conn.commit()
                    conn.close()
                else:
                    await database.mongo_db.price_history.insert_one({
                        "_id": str(uuid.uuid4()),
                        "site_name": r["site_name"],
                        "product_key": matched_product["id"],
                        "price": seed_price,
                        "created_at": historical_date
                    })
                    
    # 4. Generate recommendations
    ai_recommendations = AIService.generate_recommendations(results)
    
    # 5. Save search record
    user_id = current_user["id"] if current_user else None
    await database.save_search_record(
        user_id=user_id,
        query_type="text",
        query_val=req.query,
        results=results
    )
    
    return {
        "product_details": {
            "product_name": req.query,
            "brand": matched_product["brand"],
            "category": matched_product["category"],
            "model_number": matched_product["model_number"],
            "color": matched_product["color"],
            "variant": matched_product["variant"],
            "ocr_text": "Text Query Search",
            "confidence_score": 1.0,
            "specifications": matched_product["specs"],
            "product_id": matched_product["id"],
            "image_url": matched_product.get("image_url")
        },
        "results": results,
        "recommendations": ai_recommendations
    }

@router.get("/{product_id}/similar")
async def get_similar_products(product_id: str):
    similar = AIService.recommend_similar_products(product_id)
    return similar

@router.get("/{product_id}/price-history")
async def get_price_history_chart(product_id: str):
    # Fetch price history for each platform for this product
    conn = database.get_sqlite_conn() if database.use_sqlite else None
    history_points = []
    
    if conn:
        rows = conn.execute(
            """SELECT site_name, price, created_at FROM price_history 
               WHERE product_key = ? ORDER BY created_at ASC""",
            (product_id,)
        ).fetchall()
        conn.close()
        for r in rows:
            history_points.append(dict(r))
    else:
        cursor = database.mongo_db.price_history.find({"product_key": product_id}).sort("created_at", 1)
        async for doc in cursor:
            history_points.append({
                "site_name": doc["site_name"],
                "price": doc["price"],
                "created_at": doc["created_at"]
            })
            
    # Group by site_name and format for Recharts
    # Frontend wants: [ { date: "2026-07-01", Amazon: 12000, Flipkart: 11900 }, ... ]
    grouped = {}
    for pt in history_points:
        # Date string formatting to short date
        date_str = pt["created_at"][:10]  # YYYY-MM-DD
        if date_str not in grouped:
            grouped[date_str] = {"date": date_str}
        grouped[date_str][pt["site_name"]] = pt["price"]
        
    sorted_history = sorted(grouped.values(), key=lambda x: x["date"])
    return sorted_history
