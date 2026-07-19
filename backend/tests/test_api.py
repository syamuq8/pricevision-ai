import os
import sys
import unittest
import uuid
import datetime

# Monkeypatch bcrypt for passlib compatibility on newer bcrypt versions
import bcrypt
if not hasattr(bcrypt, "__about__"):
    class About:
        __version__ = bcrypt.__version__
    bcrypt.__about__ = About

# Add app directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.services.ai_service import AIService
from app.services.provider_service import provider_registry
from app.utils.security import get_password_hash, verify_password, create_access_token
from app import database

class TestPriceVisionAIBackend(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        # Force SQLite for test verification consistency
        database.use_sqlite = True
        database.init_sqlite_db()
        self.test_email = f"test_{uuid.uuid4().hex[:6]}@gmail.com"
        self.test_password = "password123"

    def test_security_helpers(self):
        """Test hashing and JWT tokens"""
        hashed = get_password_hash(self.test_password)
        self.assertTrue(verify_password(self.test_password, hashed))
        self.assertFalse(verify_password("wrongpassword", hashed))

        token = create_access_token("user_123")
        self.assertIsNotNone(token)

    def test_ai_vision_analysis(self):
        """Test AI vision image search mapping"""
        details = AIService.analyze_image("test_iphone.jpg")
        self.assertEqual(details["brand"], "Apple")
        self.assertEqual(details["product_id"], "prod_iphone15")
        self.assertTrue(0.0 <= details["confidence_score"] <= 1.0)

        details_rand = AIService.analyze_image("random_gadget.png")
        self.assertIn("product_name", details_rand)
        self.assertIn("confidence_score", details_rand)

    def test_ai_semantic_search(self):
        """Test semantic sorting fallback algorithms"""
        matches = AIService.semantic_search("headphones")
        self.assertTrue(len(matches) > 0)
        # Should match Sony WH-1000XM5
        self.assertEqual(matches[0]["brand"], "Sony")

    async def test_provider_registry(self):
        """Test concurrent mock provider searching and price differences"""
        results = await provider_registry.search_all("Apple iPhone 15 Pro", "Electronics", 120000.0)
        self.assertTrue(len(results) > 0)
        # Results should be sorted by price
        self.assertTrue(results[0]["price"] <= results[-1]["price"])
        
        # Verify provider structures
        for r in results:
            self.assertIn("site_name", r)
            self.assertIn("price", r)
            self.assertIn("discount", r)
            self.assertIn("rating", r)

    async def test_database_crud(self):
        """Test user database registration, profile, wishlist, alerts, history"""
        # 1. Create User
        hashed_pwd = get_password_hash(self.test_password)
        user_dict = {
            "email": self.test_email,
            "full_name": "Test User",
            "hashed_password": hashed_pwd,
            "is_admin": False
        }
        user = await database.create_user(user_dict)
        self.assertEqual(user["email"], self.test_email)
        
        # 2. Get User
        fetched = await database.get_user_by_email(self.test_email)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["full_name"], "Test User")

        # 3. Add to Wishlist
        prod = {
            "product_id": "prod_iphone15",
            "title": "iPhone 15 Pro",
            "price": 125000,
            "url": "https://amazon.in/dp/mock",
            "site_name": "Amazon"
        }
        wish = await database.add_to_wishlist(user["id"], prod)
        self.assertEqual(wish["product_id"], "prod_iphone15")

        # 4. Get Wishlist
        wishlist_items = await database.get_wishlist(user["id"])
        self.assertEqual(len(wishlist_items), 1)
        self.assertEqual(wishlist_items[0]["title"], "iPhone 15 Pro")

        # 5. Remove Wishlist
        removed = await database.remove_from_wishlist(user["id"], wish["id"])
        self.assertTrue(removed)

if __name__ == '__main__':
    unittest.main()
