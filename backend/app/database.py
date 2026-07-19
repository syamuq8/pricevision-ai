import os
import sqlite3
import json
import uuid
import datetime
from typing import List, Dict, Any, Optional
from app.config import settings

# Initialize database connections
# We try to connect to MongoDB if MONGODB_URL is provided, else fallback to SQLite
db_client = None
mongo_db = None
use_sqlite = True

if settings.MONGODB_URL:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        db_client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        # Verify connection
        # We run this in a try-except, if it fails, we fall back to SQLite
        mongo_db = db_client[settings.DATABASE_NAME]
        use_sqlite = False
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"MongoDB connection failed: {e}. Falling back to SQLite...")
        use_sqlite = True
else:
    print("No MongoDB URL configured. Using SQLite...")
    use_sqlite = True

# --- SQLite Setup & Connection ---
def get_sqlite_conn():
    conn = sqlite3.connect(settings.FALLBACK_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_sqlite_db():
    conn = get_sqlite_conn()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        hashed_password TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT
    )
    """)
    
    # Searches table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS searches (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        query_type TEXT, -- 'image' or 'url'
        query_val TEXT,
        results TEXT, -- JSON string
        created_at TEXT
    )
    """)
    
    # Wishlist table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wishlist (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        title TEXT NOT NULL,
        price REAL,
        original_price REAL,
        discount REAL,
        rating REAL,
        image_url TEXT,
        url TEXT,
        site_name TEXT,
        created_at TEXT
    )
    """)
    
    # Notifications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL, -- 'price_drop', 'restock', 'discount'
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        created_at TEXT
    )
    """)
    
    # Price History table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS price_history (
        id TEXT PRIMARY KEY,
        site_name TEXT NOT NULL,
        product_key TEXT NOT NULL, -- e.g. Amazon:B08L5T315Q
        price REAL NOT NULL,
        created_at TEXT NOT NULL
    )
    """)
    
    # Create a default admin user if it doesn't exist
    cursor.execute("SELECT * FROM users WHERE email = 'admin@pricevision.ai'")
    if not cursor.fetchone():
        from passlib.hash import bcrypt
        admin_id = str(uuid.uuid4())
        hashed_pwd = bcrypt.hash("admin123")
        cursor.execute(
            "INSERT INTO users (id, email, full_name, hashed_password, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (admin_id, "admin@pricevision.ai", "System Admin", hashed_pwd, 1, datetime.datetime.now().isoformat())
        )
        print("Default admin created: admin@pricevision.ai / admin123")
        
    conn.commit()
    conn.close()

if use_sqlite:
    init_sqlite_db()

# --- Unified Database Helper Functions ---

# User Operations
async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    if use_sqlite:
        conn = get_sqlite_conn()
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        conn.close()
        if row:
            d = dict(row)
            d["is_admin"] = bool(d["is_admin"])
            return d
        return None
    else:
        user = await mongo_db.users.find_one({"email": email})
        if user:
            user["id"] = str(user.pop("_id"))
        return user

async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    if use_sqlite:
        conn = get_sqlite_conn()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        conn.close()
        if row:
            d = dict(row)
            d["is_admin"] = bool(d["is_admin"])
            return d
        return None
    else:
        from bson import ObjectId
        try:
            user = await mongo_db.users.find_one({"_id": ObjectId(user_id)})
        except:
            user = await mongo_db.users.find_one({"id": user_id})
        if user:
            user["id"] = str(user.pop("_id")) if "_id" in user else user.get("id")
            return user
        return None

async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    user_id = user_data.get("id") or str(uuid.uuid4())
    user_data["id"] = user_id
    user_data["created_at"] = user_data.get("created_at") or datetime.datetime.now().isoformat()
    
    if use_sqlite:
        conn = get_sqlite_conn()
        conn.execute(
            "INSERT INTO users (id, email, full_name, hashed_password, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, user_data["email"], user_data.get("full_name", ""), user_data["hashed_password"], 1 if user_data.get("is_admin") else 0, user_data["created_at"])
        )
        conn.commit()
        conn.close()
        return user_data
    else:
        doc = dict(user_data)
        doc["_id"] = user_id
        await mongo_db.users.insert_one(doc)
        return user_data

# Search Operations
async def save_search_record(user_id: Optional[str], query_type: str, query_val: str, results: List[Dict[str, Any]]) -> Dict[str, Any]:
    search_id = str(uuid.uuid4())
    created_at = datetime.datetime.now().isoformat()
    
    record = {
        "id": search_id,
        "user_id": user_id,
        "query_type": query_type,
        "query_val": query_val,
        "results": results,
        "created_at": created_at
    }
    
    if use_sqlite:
        conn = get_sqlite_conn()
        conn.execute(
            "INSERT INTO searches (id, user_id, query_type, query_val, results, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (search_id, user_id, query_type, query_val, json.dumps(results), created_at)
        )
        conn.commit()
        conn.close()
    else:
        doc = dict(record)
        doc["_id"] = search_id
        await mongo_db.searches.insert_one(doc)
        
    return record

async def get_search_records(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    if use_sqlite:
        conn = get_sqlite_conn()
        rows = conn.execute(
            "SELECT * FROM searches WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", 
            (user_id, limit)
        ).fetchall()
        conn.close()
        records = []
        for r in rows:
            d = dict(r)
            d["results"] = json.loads(d["results"])
            records.append(d)
        return records
    else:
        cursor = mongo_db.searches.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        records = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            records.append(doc)
        return records

async def delete_search_record(user_id: str, search_id: str) -> bool:
    if use_sqlite:
        conn = get_sqlite_conn()
        cursor = conn.execute("DELETE FROM searches WHERE user_id = ? AND id = ?", (user_id, search_id))
        conn.commit()
        rowcount = cursor.rowcount
        conn.close()
        return rowcount > 0
    else:
        res = await mongo_db.searches.delete_one({"_id": search_id, "user_id": user_id})
        return res.deleted_count > 0

# Wishlist Operations
async def get_wishlist(user_id: str) -> List[Dict[str, Any]]:
    if use_sqlite:
        conn = get_sqlite_conn()
        rows = conn.execute("SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    else:
        cursor = mongo_db.wishlist.find({"user_id": user_id}).sort("created_at", -1)
        items = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            items.append(doc)
        return items

async def add_to_wishlist(user_id: str, product: Dict[str, Any]) -> Dict[str, Any]:
    wish_id = str(uuid.uuid4())
    created_at = datetime.datetime.now().isoformat()
    
    item = {
        "id": wish_id,
        "user_id": user_id,
        "product_id": product["product_id"],
        "title": product["title"],
        "price": product.get("price"),
        "original_price": product.get("original_price"),
        "discount": product.get("discount"),
        "rating": product.get("rating"),
        "image_url": product.get("image_url"),
        "url": product.get("url"),
        "site_name": product.get("site_name"),
        "created_at": created_at
    }
    
    if use_sqlite:
        conn = get_sqlite_conn()
        conn.execute(
            """INSERT INTO wishlist 
               (id, user_id, product_id, title, price, original_price, discount, rating, image_url, url, site_name, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (wish_id, user_id, item["product_id"], item["title"], item["price"], item["original_price"],
             item["discount"], item["rating"], item["image_url"], item["url"], item["site_name"], created_at)
        )
        conn.commit()
        conn.close()
    else:
        doc = dict(item)
        doc["_id"] = wish_id
        await mongo_db.wishlist.insert_one(doc)
    return item

async def remove_from_wishlist(user_id: str, wishlist_item_id: str) -> bool:
    if use_sqlite:
        conn = get_sqlite_conn()
        cursor = conn.execute("DELETE FROM wishlist WHERE user_id = ? AND id = ?", (user_id, wishlist_item_id))
        conn.commit()
        rowcount = cursor.rowcount
        conn.close()
        return rowcount > 0
    else:
        res = await mongo_db.wishlist.delete_one({"_id": wishlist_item_id, "user_id": user_id})
        return res.deleted_count > 0

# Notification Operations
async def get_notifications(user_id: str) -> List[Dict[str, Any]]:
    if use_sqlite:
        conn = get_sqlite_conn()
        rows = conn.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    else:
        cursor = mongo_db.notifications.find({"user_id": user_id}).sort("created_at", -1)
        items = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            items.append(doc)
        return items

async def add_notification(user_id: str, n_type: str, message: str) -> Dict[str, Any]:
    n_id = str(uuid.uuid4())
    created_at = datetime.datetime.now().isoformat()
    
    item = {
        "id": n_id,
        "user_id": user_id,
        "type": n_type,
        "message": message,
        "read": 0,
        "created_at": created_at
    }
    
    if use_sqlite:
        conn = get_sqlite_conn()
        conn.execute(
            "INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES (?, ?, ?, ?, 0, ?)",
            (n_id, user_id, n_type, message, created_at)
        )
        conn.commit()
        conn.close()
    else:
        doc = dict(item)
        doc["_id"] = n_id
        await mongo_db.notifications.insert_one(doc)
    return item

async def mark_notification_read(user_id: str, n_id: str) -> bool:
    if use_sqlite:
        conn = get_sqlite_conn()
        cursor = conn.execute("UPDATE notifications SET read = 1 WHERE user_id = ? AND id = ?", (user_id, n_id))
        conn.commit()
        rowcount = cursor.rowcount
        conn.close()
        return rowcount > 0
    else:
        res = await mongo_db.notifications.update_one({"_id": n_id, "user_id": user_id}, {"$set": {"read": 1}})
        return res.modified_count > 0

# Price History Operations
async def record_price(site_name: str, product_key: str, price: float):
    created_at = datetime.datetime.now().isoformat()
    p_id = str(uuid.uuid4())
    
    if use_sqlite:
        conn = get_sqlite_conn()
        conn.execute(
            "INSERT INTO price_history (id, site_name, product_key, price, created_at) VALUES (?, ?, ?, ?, ?)",
            (p_id, site_name, product_key, price, created_at)
        )
        conn.commit()
        conn.close()
    else:
        await mongo_db.price_history.insert_one({
            "_id": p_id,
            "site_name": site_name,
            "product_key": product_key,
            "price": price,
            "created_at": created_at
        })

async def get_price_history(site_name: str, product_key: str) -> List[Dict[str, Any]]:
    if use_sqlite:
        conn = get_sqlite_conn()
        rows = conn.execute(
            "SELECT price, created_at FROM price_history WHERE site_name = ? AND product_key = ? ORDER BY created_at ASC",
            (site_name, product_key)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    else:
        cursor = mongo_db.price_history.find(
            {"site_name": site_name, "product_key": product_key}
        ).sort("created_at", 1)
        history = []
        async for doc in cursor:
            history.append({
                "price": doc["price"],
                "created_at": doc["created_at"]
            })
        return history

# Admin Operations
async def get_admin_users() -> List[Dict[str, Any]]:
    if use_sqlite:
        conn = get_sqlite_conn()
        rows = conn.execute("SELECT id, email, full_name, is_admin, created_at FROM users").fetchall()
        conn.close()
        return [dict(r) for r in rows]
    else:
        cursor = mongo_db.users.find({}, {"hashed_password": 0})
        users = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            users.append(doc)
        return users

async def get_admin_searches() -> List[Dict[str, Any]]:
    if use_sqlite:
        conn = get_sqlite_conn()
        rows = conn.execute("SELECT id, user_id, query_type, query_val, created_at FROM searches ORDER BY created_at DESC").fetchall()
        conn.close()
        return [dict(r) for r in rows]
    else:
        cursor = mongo_db.searches.find({}, {"results": 0}).sort("created_at", -1)
        searches = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            searches.append(doc)
        return searches

async def get_admin_analytics() -> Dict[str, Any]:
    if use_sqlite:
        conn = get_sqlite_conn()
        total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        total_searches = conn.execute("SELECT COUNT(*) FROM searches").fetchone()[0]
        total_wishlist = conn.execute("SELECT COUNT(*) FROM wishlist").fetchone()[0]
        
        # Searches by type
        searches_by_type = {}
        rows = conn.execute("SELECT query_type, COUNT(*) FROM searches GROUP BY query_type").fetchall()
        for r in rows:
            searches_by_type[r[0]] = r[1]
            
        conn.close()
    else:
        total_users = await mongo_db.users.count_documents({})
        total_searches = await mongo_db.searches.count_documents({})
        total_wishlist = await mongo_db.wishlist.count_documents({})
        
        image_searches = await mongo_db.searches.count_documents({"query_type": "image"})
        url_searches = await mongo_db.searches.count_documents({"query_type": "url"})
        searches_by_type = {"image": image_searches, "url": url_searches}
        
    return {
        "total_users": total_users,
        "total_searches": total_searches,
        "total_wishlist_items": total_wishlist,
        "searches_by_type": searches_by_type,
        "timestamp": datetime.datetime.now().isoformat()
    }
