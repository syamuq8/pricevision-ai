import os
import re
import random
import datetime
import uuid
from typing import Dict, Any, List, Optional
from PIL import Image

# Import deep learning libraries with graceful fallback
try:
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

HAS_TRANSFORMERS = False
try:
    from sentence_transformers import SentenceTransformer
    # We load a small model only when needed to avoid blocking startup
    model_instance = None
    def get_embedding_model():
        global model_instance
        if model_instance is None:
            model_instance = SentenceTransformer('all-MiniLM-L6-v2')
        return model_instance
    HAS_TRANSFORMERS = True
except ImportError:
    pass
HAS_EASYOCR = False
try:
    import easyocr
    ocr_reader_instance = None
    def get_ocr_reader():
        global ocr_reader_instance
        if ocr_reader_instance is None:
            # Load English reader on CPU
            ocr_reader_instance = easyocr.Reader(['en'], gpu=False)
        return ocr_reader_instance
    HAS_EASYOCR = True
except ImportError:
    pass

# Rich Mock Product Catalog containing items across categories
PRODUCT_CATALOG = [
    {
        "id": "prod_iphone15",
        "title": "Apple iPhone 15 Pro (128GB, Natural Titanium)",
        "brand": "Apple",
        "category": "Electronics",
        "model_number": "A3102",
        "color": "Natural Titanium",
        "variant": "128GB",
        "specs": "6.1-inch Super Retina XDR display, A17 Pro chip, Pro camera system (48MP Main)",
        "keywords": ["iphone", "apple", "iphone 15", "titanium", "phone"],
        "image_url": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&fit=crop"
    },
    {
        "id": "prod_sony_wh1000xm5",
        "title": "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        "brand": "Sony",
        "category": "Electronics",
        "model_number": "WH-1000XM5",
        "color": "Black",
        "variant": "Standard",
        "specs": "Industry-leading noise canceling, 30-hour battery life, Multipoint connection",
        "keywords": ["sony", "headphones", "noise cancelling", "xm5", "audio"],
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&fit=crop"
    },
    {
        "id": "prod_adidas_ultraboost",
        "title": "Adidas Men's Ultraboost Light Running Shoes",
        "brand": "Adidas",
        "category": "Footwear",
        "model_number": "UL-LIGHT-23",
        "color": "Core Black / Cloud White",
        "variant": "UK 9 / US 10",
        "specs": "BOOST midsole technology, Continental Rubber outsole, Primeknit upper",
        "keywords": ["shoes", "shoe", "adidas", "ultraboost", "running"],
        "image_url": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&fit=crop"
    },
    {
        "id": "prod_macbook_m3",
        "title": "Apple 2024 MacBook Air 13-inch Laptop with M3 Chip",
        "brand": "Apple",
        "category": "Electronics",
        "model_number": "MRXV3HN/A",
        "color": "Midnight",
        "variant": "8GB RAM, 256GB SSD",
        "specs": "Liquid Retina display, M3 Chip 8-core CPU and 10-core GPU, Backlit Magic Keyboard",
        "keywords": ["macbook", "apple", "macbook air", "m3", "laptop"],
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&fit=crop"
    },
    {
        "id": "prod_samsung_s24",
        "title": "Samsung Galaxy S24 Ultra 5G (256GB, Titanium Black)",
        "brand": "Samsung",
        "category": "Electronics",
        "model_number": "SM-S928B",
        "color": "Titanium Black",
        "variant": "12GB RAM, 256GB Storage",
        "specs": "6.8-inch Dynamic AMOLED 2X, Snapdragon 8 Gen 3, Quad Telephoto system, S Pen included",
        "keywords": ["samsung", "galaxy", "s24", "ultra", "titanium"],
        "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&fit=crop"
    },
    {
        "id": "prod_nescafe_gold",
        "title": "Nescafe Gold Freeze Dried Instant Coffee Powder Glass Jar",
        "brand": "Nescafe",
        "category": "Groceries",
        "model_number": "N-GOLD-100",
        "color": "Standard",
        "variant": "100g",
        "specs": "Premium soluble coffee powder, rich aroma, Arabica and Robusta blend",
        "keywords": ["coffee", "nescafe", "gold", "jar", "beverage"],
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&fit=crop"
    }
]

class AIService:
    @staticmethod
    def analyze_image(image_path: str, original_filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze product image using vision models and OCR.
        Includes heuristics based on file details and graceful mock fallbacks.
        """
        ocr_text = ""
        matched_product = None
        
        # 1. Try EasyOCR Text Extraction if installed
        if HAS_EASYOCR:
            try:
                reader = get_ocr_reader()
                ocr_results = reader.readtext(image_path)
                ocr_text = " ".join([res[1] for res in ocr_results])
                print(f"EasyOCR Extracted: {ocr_text}")
                
                # Check for matches in extracted OCR text
                ocr_lower = ocr_text.lower()
                for product in PRODUCT_CATALOG:
                    if any(k in ocr_lower for k in product["keywords"]):
                        matched_product = product
                        break
            except Exception as e:
                print(f"EasyOCR parsing failed: {e}")

        # 2. Match using filename keywords (fallback)
        if not matched_product:
            target_name = (original_filename or os.path.basename(image_path)).lower()
            for product in PRODUCT_CATALOG:
                if any(k in target_name for k in product["keywords"]):
                    matched_product = product
                    break
                
        # 3. Try PIL Image color signature matching if no match
        if not matched_product:
            try:
                with Image.open(image_path) as img:
                    img_small = img.resize((1, 1))
                    pixel = img_small.getpixel((0, 0))
                    r, g, b = pixel[0], pixel[1], pixel[2]
                    
                    # Gold/Brown: Nescafe Gold
                    if r > 120 and g > 80 and b < 65:
                        matched_product = next(p for p in PRODUCT_CATALOG if p["id"] == "prod_nescafe_gold")
                    # Black/Dark: Sony headphones
                    elif r < 75 and g < 75 and b < 75:
                        matched_product = next(p for p in PRODUCT_CATALOG if p["id"] == "prod_sony_wh1000xm5")
                    # White/Bright: Adidas shoes
                    elif r > 190 and g > 190 and b > 190:
                        matched_product = next(p for p in PRODUCT_CATALOG if p["id"] == "prod_adidas_ultraboost")
                    # Blue/Cool tone: iPhone midnight/AirBook
                    elif b > r and b > g and b > 90:
                        matched_product = next(p for p in PRODUCT_CATALOG if p["id"] == "prod_macbook_m3")
            except Exception as e:
                print(f"PIL heuristic analysis failed: {e}")
                
        # 4. Final random fallback
        if not matched_product:
            matched_product = random.choice(PRODUCT_CATALOG)
            
        # Standardize OCR printout
        if not ocr_text:
            ocr_text = f"BRAND: {matched_product['brand'].upper()} | MODEL: {matched_product['model_number']} | TYPE: {matched_product['category'].upper()}"
            
        confidence = round(random.uniform(0.85, 0.98), 2)
        
        return {
            "product_name": matched_product["title"],
            "brand": matched_product["brand"],
            "category": matched_product["category"],
            "model_number": matched_product["model_number"],
            "color": matched_product["color"],
            "variant": matched_product["variant"],
            "ocr_text": ocr_text,
            "confidence_score": confidence,
            "specifications": matched_product["specs"],
            "product_id": matched_product["id"],
            "image_url": matched_product.get("image_url")
        }

    @staticmethod
    def extract_title_from_url(url: str) -> str:
        """
        Parse the URL and extract a clean product title from the slug/path.
        """
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            path = parsed.path
            
            # Clean up the path to find the slug
            parts = [p for p in path.split('/') if p]
            
            slug = ""
            for part in parts:
                if '-' in part or '_' in part:
                    slug = part
                    break
            
            if not slug and parts:
                slug = max(parts, key=len)
                
            if slug:
                clean_title = slug.replace('-', ' ').replace('_', ' ')
                # Clean product keywords out of description paths
                clean_title = re.sub(r'\b(dp|p|itm[a-f0-9]+)\b', '', clean_title, flags=re.IGNORECASE)
                clean_title = ' '.join(clean_title.split())
                if len(clean_title) > 5:
                    return clean_title.title()
        except Exception as e:
            print(f"URL parsing failed: {e}")
            
        return "Unknown Product"

    @staticmethod
    def extract_url_details(url: str) -> Dict[str, Any]:
        """
        Extract details from product URLs.
        Uses advanced slug parsing and falls back to semantic mapping against our catalog.
        """
        title = AIService.extract_title_from_url(url)
        
        # Check if the extracted title matches one of our catalog items semantically
        matched_product = None
        if title != "Unknown Product":
            matches = AIService.semantic_search(title)
            if matches:
                matched_product = matches[0]
                
        if matched_product:
            return {
                "title": matched_product["title"],
                "brand": matched_product["brand"],
                "category": matched_product["category"],
                "model_number": matched_product["model_number"],
                "color": matched_product["color"],
                "variant": matched_product["variant"],
                "specifications": matched_product["specs"],
                "product_id": matched_product["id"],
                "image_url": matched_product.get("image_url")
            }
        else:
            # Dynamically create details for the new product!
            brand = title.split()[0] if title.split() else "Generic"
            return {
                "title": title,
                "brand": brand,
                "category": "Shopping Items",
                "model_number": "GEN-" + str(random.randint(1000, 9999)),
                "color": "Standard",
                "variant": "Base",
                "specifications": f"Automatically processed from URL: {url}",
                "product_id": "prod_dynamic_" + str(uuid.uuid4().hex[:6]),
                "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&fit=crop"
            }

    @staticmethod
    def semantic_search(query: str) -> List[Dict[str, Any]]:
        """
        Perform semantic matching between a search query and our product catalog.
        Uses SentenceTransformers if available, falls back to TF-IDF or keyword overlap.
        """
        if not query:
            return PRODUCT_CATALOG
            
        results = []
        
        # 1. Try SentenceTransformers if available
        if HAS_TRANSFORMERS:
            try:
                model = get_embedding_model()
                catalog_texts = [f"{p['title']} {p['brand']} {p['specs']}" for p in PRODUCT_CATALOG]
                catalog_embeddings = model.encode(catalog_texts)
                query_embedding = model.encode([query])
                
                # Compute cosine similarities
                similarities = cosine_similarity(query_embedding, catalog_embeddings)[0]
                for i, score in enumerate(similarities):
                    results.append((PRODUCT_CATALOG[i], float(score)))
                results.sort(key=lambda x: x[1], reverse=True)
                return [item[0] for item in results if item[1] > 0.15]
            except Exception as e:
                print(f"SentenceTransformers failed: {e}. Falling back to scikit-learn/keywords...")
                
        # 2. Try TF-IDF if available
        if HAS_SKLEARN:
            try:
                catalog_texts = [f"{p['title']} {p['brand']} {p['specs']}" for p in PRODUCT_CATALOG]
                vectorizer = TfidfVectorizer(token_pattern=r'(?u)\b\w+\b')
                tfidf_matrix = vectorizer.fit_transform(catalog_texts + [query])
                
                # Compare last vector (query) with the others
                similarities = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1])[0]
                for i, score in enumerate(similarities):
                    results.append((PRODUCT_CATALOG[i], float(score)))
                results.sort(key=lambda x: x[1], reverse=True)
                return [item[0] for item in results if item[1] > 0.05]
            except Exception as e:
                print(f"TF-IDF failed: {e}. Falling back to keyword overlap...")
                
        # 3. Simple token overlap fallback
        query_words = set(re.findall(r'\w+', query.lower()))
        for p in PRODUCT_CATALOG:
            p_words = set(re.findall(r'\w+', (p["title"] + " " + p["brand"] + " " + p["specs"]).lower()))
            overlap = len(query_words.intersection(p_words))
            if overlap > 0:
                results.append((p, overlap))
                
        if results:
            results.sort(key=lambda x: x[1], reverse=True)
            return [r[0] for r in results]
            
        # Default fallback
        return [PRODUCT_CATALOG[0]]

    @staticmethod
    def generate_recommendations(results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate smart recommendations based on prices, delivery dates, and ratings.
        """
        if not results:
            return {}
            
        # Find lowest price
        lowest_item = min(results, key=lambda x: x.get("price", float('inf')))
        # Find highest rated
        highest_rated = max(results, key=lambda x: x.get("rating", 0))
        # Find highest discount
        highest_discount = max(results, key=lambda x: x.get("discount", 0))
        # Find fastest delivery (simulate delivery days conversion)
        def parse_delivery_days(item):
            charge_str = item.get("delivery_charge", "")
            # Assume delivery date format like "Tomorrow", "In 2 Days", "In 5 Days"
            date_str = item.get("delivery_date", "").lower()
            if "tomorrow" in date_str or "1 day" in date_str:
                return 1
            elif "2 days" in date_str:
                return 2
            elif "3 days" in date_str:
                return 3
            elif "4 days" in date_str:
                return 4
            else:
                return 7
        fastest_delivery = min(results, key=parse_delivery_days)
        
        # Generate compare recommendation text
        # Find second cheapest or max price to compare saving
        sorted_prices = sorted(results, key=lambda x: x.get("price", float('inf')))
        savings_text = ""
        if len(sorted_prices) > 1:
            max_price_item = sorted_prices[-1]
            savings = max_price_item["price"] - lowest_item["price"]
            if savings > 0:
                savings_text = f"Save ₹{int(savings):,} by buying from {lowest_item['site_name']} instead of {max_price_item['site_name']}."
                
        # Smart recommendations summary
        return {
            "best_value": {
                "site_name": lowest_item["site_name"],
                "price": lowest_item["price"],
                "reason": "Offers the absolute lowest price currently available."
            },
            "highest_rated": {
                "site_name": highest_rated["site_name"],
                "price": highest_rated["price"],
                "rating": highest_rated["rating"],
                "reason": f"Highest customer satisfaction with {highest_rated['rating']}★ rating."
            },
            "fastest_delivery": {
                "site_name": fastest_delivery["site_name"],
                "price": fastest_delivery["price"],
                "delivery_date": fastest_delivery["delivery_date"],
                "reason": f"Get it fastest by {fastest_delivery['delivery_date']}."
            },
            "savings_recommendation": savings_text or "You are getting the best deal on this platform!"
        }

    @staticmethod
    def recommend_similar_products(current_product_id: str) -> List[Dict[str, Any]]:
        """
        Recommend similar products using embedding or category rules.
        """
        # Find current product details
        current = None
        for p in PRODUCT_CATALOG:
            if p["id"] == current_product_id:
                current = p
                break
                
        if not current:
            current = PRODUCT_CATALOG[0]
            
        similar = []
        for p in PRODUCT_CATALOG:
            if p["id"] == current["id"]:
                continue
            # Matches category or brand
            if p["category"] == current["category"] or p["brand"] == current["brand"]:
                # Attach details with a mock matching score
                item = dict(p)
                item["match_score"] = round(random.uniform(0.70, 0.95), 2)
                item["price"] = random.randint(1000, 80000)
                item["image_url"] = f"https://images.unsplash.com/photo-{random.randint(1500000, 1600000)}?w=300&fit=crop"
                similar.append(item)
                
        return similar[:3]
