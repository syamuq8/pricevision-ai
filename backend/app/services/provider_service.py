import asyncio
import random
from typing import List, Dict, Any
from app.config import settings

# Supported websites config
WEBSITES_METADATA = {
    "Amazon": {
        "logo_color": "#FF9900",
        "url_pattern": "amazon.in",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"
    },
    "Flipkart": {
        "logo_color": "#2874F0",
        "url_pattern": "flipkart.com",
        "logo_url": "https://img1a.flixcart.com/www/linchpin/fk-cp-zion/img/flipkart-plus_8d85f4.png"
    },
    "Myntra": {
        "logo_color": "#E6005C",
        "url_pattern": "myntra.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png"
    },
    "Ajio": {
        "logo_color": "#1A1A1A",
        "url_pattern": "ajio.com",
        "logo_url": "https://assets.ajio.com/static/img/Ajio-Logo.svg"
    },
    "Meesho": {
        "logo_color": "#F43397",
        "url_pattern": "meesho.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Meesho_Logo.svg"
    },
    "Croma": {
        "logo_color": "#00E5D7",
        "url_pattern": "croma.com",
        "logo_url": "https://media-assets-us.imgix.net/croma-logo.png"
    },
    "Reliance Digital": {
        "logo_color": "#E30A17",
        "url_pattern": "reliancedigital.in",
        "logo_url": "https://www.reliancedigital.in/build/client/images/rd_logo.svg"
    },
    "Tata Cliq": {
        "logo_color": "#000000",
        "url_pattern": "tatacliq.com",
        "logo_url": "https://www.tatacliq.com/images/tatacliq-logo.svg"
    },
    "Vijay Sales": {
        "logo_color": "#C8102E",
        "url_pattern": "vijaysales.com",
        "logo_url": "https://www.vijaysales.com/images/vs-logo.png"
    },
    "Snapdeal": {
        "logo_color": "#E40046",
        "url_pattern": "snapdeal.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/ed/Snapdeal_Logo.svg"
    },
    "Nykaa": {
        "logo_color": "#FC2779",
        "url_pattern": "nykaa.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/a/ae/Nykaa_Logo.svg"
    },
    "FirstCry": {
        "logo_color": "#FF7C00",
        "url_pattern": "firstcry.com",
        "logo_url": "https://cdn.firstcry.com/images/firstcry_logo.svg"
    },
    "JioMart": {
        "logo_color": "#0C529C",
        "url_pattern": "jiomart.com",
        "logo_url": "https://www.jiomart.com/assets/ds2web/images/jiomart_logo_v2.svg"
    }
}

class BaseProvider:
    def __init__(self, name: str, logo_color: str, logo_url: str):
        self.name = name
        self.logo_color = logo_color
        self.logo_url = logo_url

    async def search(self, product_title: str, category: str, base_price: float) -> Dict[str, Any]:
        """
        Simulate search request. In a real-world scenario, this triggers official API or scrapers.
        """
        # Apply simulated latency
        await asyncio.sleep(settings.MOCK_PROVIDER_DELAY)
        
        # Calculate random variations around the base price
        price_variation = random.uniform(-0.15, 0.15)
        price = int(base_price * (1 + price_variation))
        
        # Original price calculation (always higher or equal)
        orig_multiplier = random.choice([1.0, 1.10, 1.20, 1.25, 1.35])
        original_price = int(price * orig_multiplier)
        discount = round(((original_price - price) / original_price) * 100) if original_price > price else 0
        
        # Rating & Reviews
        rating = round(random.uniform(3.8, 4.9), 1)
        reviews = random.randint(10, 8500)
        
        # Delivery charges and times
        delivery_charge = random.choice(["Free", "₹40", "Free", "₹99", "Free"])
        delivery_days = random.choice([1, 2, 3, 5, 6])
        if delivery_days == 1:
            delivery_date = "Tomorrow"
        else:
            delivery_date = f"In {delivery_days} Days"
            
        # Stock
        in_stock = random.choice(["In Stock", "In Stock", "In Stock", "In Stock", "Out of Stock", "Only 2 left"])
        
        # Affiliate links pointing to real search results pages
        query_encoded = product_title.replace(' ', '+')
        if self.name == "Amazon":
            affiliate_url = f"https://www.amazon.in/s?k={query_encoded}&tag=pricevision_ai-21"
        elif self.name == "Flipkart":
            affiliate_url = f"https://www.flipkart.com/search?q={query_encoded}"
        elif self.name == "Myntra":
            affiliate_url = f"https://www.myntra.com/search?q={query_encoded}"
        elif self.name == "Ajio":
            affiliate_url = f"https://www.ajio.com/search/?text={query_encoded}"
        elif self.name == "Croma":
            affiliate_url = f"https://www.croma.com/search/?text={query_encoded}"
        elif self.name == "Reliance Digital":
            affiliate_url = f"https://www.reliancedigital.in/search?q={query_encoded}:relevance"
        elif self.name == "Tata Cliq":
            affiliate_url = f"https://www.tatacliq.com/search/?text={query_encoded}"
        elif self.name == "Vijay Sales":
            affiliate_url = f"https://www.vijaysales.com/search/{query_encoded}"
        elif self.name == "Snapdeal":
            affiliate_url = f"https://www.snapdeal.com/search?keyword={query_encoded}"
        elif self.name == "Nykaa":
            affiliate_url = f"https://www.nykaa.com/search/result/?q={query_encoded}"
        elif self.name == "FirstCry":
            affiliate_url = f"https://www.firstcry.com/searchv2?q={query_encoded}"
        elif self.name == "JioMart":
            affiliate_url = f"https://www.jiomart.com/search/{query_encoded.replace('+', '%20')}"
        elif self.name == "Meesho":
            affiliate_url = f"https://www.meesho.com/search?q={query_encoded}"
        else:
            affiliate_url = f"https://www.google.com/search?q={self.name}+{query_encoded}"

        return {
            "site_name": self.name,
            "logo_color": self.logo_color,
            "logo_url": self.logo_url,
            "price": price,
            "original_price": original_price,
            "discount": discount,
            "rating": rating,
            "reviews_count": reviews,
            "delivery_charge": delivery_charge,
            "delivery_date": delivery_date,
            "stock_status": in_stock,
            "url": affiliate_url,
            "title": f"{product_title} ({self.name} Edition)"
        }

class ProviderRegistry:
    def __init__(self):
        self.providers = {}
        for name, meta in WEBSITES_METADATA.items():
            self.providers[name] = BaseProvider(name, meta["logo_color"], meta["logo_url"])

    def get_providers_for_category(self, category: str) -> List[BaseProvider]:
        """
        Dynamically filter providers appropriate for a specific product category.
        e.g. Myntra/Ajio/Nykaa for Fashion/Beauty, Croma/Reliance/Vijay for Electronics.
        """
        cat_lower = category.lower()
        active = []
        
        for name, provider in self.providers.items():
            if "groceries" in cat_lower:
                if name in ["JioMart", "Amazon", "Flipkart", "Snapdeal"]:
                    active.append(provider)
            elif "footwear" in cat_lower or "fashion" in cat_lower or "clothing" in cat_lower:
                if name in ["Amazon", "Flipkart", "Myntra", "Ajio", "Meesho", "Snapdeal"]:
                    active.append(provider)
            elif "electronics" in cat_lower:
                if name in ["Amazon", "Flipkart", "Croma", "Reliance Digital", "Vijay Sales", "Tata Cliq", "Snapdeal", "JioMart"]:
                    active.append(provider)
            elif "baby" in cat_lower:
                if name in ["FirstCry", "Amazon", "Flipkart", "Meesho"]:
                    active.append(provider)
            elif "beauty" in cat_lower or "cosmetics" in cat_lower:
                if name in ["Nykaa", "Myntra", "Amazon", "Flipkart"]:
                    active.append(provider)
            else:
                # Fallback: include generic retailers
                if name in ["Amazon", "Flipkart", "Tata Cliq", "Snapdeal", "JioMart", "Meesho"]:
                    active.append(provider)
                    
        # Return at least Amazon & Flipkart for everything
        if not active:
            active = [self.providers["Amazon"], self.providers["Flipkart"]]
            
        return active

    async def search_all(self, product_title: str, category: str, base_price: float = 5000) -> List[Dict[str, Any]]:
        """
        Search across all matching providers concurrently.
        """
        active_providers = self.get_providers_for_category(category)
        
        # Run searches concurrently
        tasks = [provider.search(product_title, category, base_price) for provider in active_providers]
        results = await asyncio.gather(*tasks)
        
        # Sort by price initially
        results = sorted(results, key=lambda x: x["price"])
        return results

provider_registry = ProviderRegistry()
