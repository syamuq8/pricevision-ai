import React, { useState, useEffect, useContext } from 'react';
import { 
  ArrowLeft, Heart, ExternalLink, ShieldCheck, Zap, Award, Percent, 
  TrendingDown, ShoppingCart, Info, Star, Compass, BellRing
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

export default function SearchResults({ searchData, onBack, onUpdateSearch }) {
  const { user, token } = useContext(AuthContext);
  const { product_details: product, results, recommendations } = searchData;
  
  const [sortedResults, setSortedResults] = useState(results);
  const [sortBy, setSortBy] = useState('price-low');
  const [priceHistory, setPriceHistory] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(true);

  // States for query editing
  const [editQuery, setEditQuery] = useState(product.product_name || '');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    setEditQuery(product.product_name || '');
  }, [product.product_name]);

  const handleUpdateSearch = async (e) => {
    e.preventDefault();
    if (!editQuery.trim()) return;
    
    setSearching(true);
    setSearchError('');
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch('http://localhost:8000/api/products/search/text', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: editQuery })
      });
      
      if (!res.ok) throw new Error('Search update failed');
      
      const data = await res.json();
      if (onUpdateSearch) {
        onUpdateSearch(data);
      }
    } catch (err) {
      setSearchError(err.message || 'Error updating query results.');
    } finally {
      setSearching(false);
    }
  };

  // Sorting Handler
  useEffect(() => {
    let sorted = [...results];
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      sorted.sort((a, b) => b.discount - a.discount);
    } else if (sortBy === 'delivery') {
      // Free or cheaper delivery first
      const getDeliveryVal = (item) => {
        if (item.delivery_charge === 'Free') return 0;
        const num = parseInt(item.delivery_charge.replace(/\D/g, ''));
        return isNaN(num) ? 99 : num;
      };
      sorted.sort((a, b) => getDeliveryVal(a) - getDeliveryVal(b));
    }
    setSortedResults(sorted);
  }, [sortBy, results]);

  // Fetch similar products & price history
  useEffect(() => {
    // 1. Fetch Similar
    fetch(`http://localhost:8000/api/products/${product.product_id}/similar`)
      .then(res => res.json())
      .then(data => {
        setSimilarProducts(data);
        setSimilarLoading(false);
      })
      .catch(() => setSimilarLoading(false));

    // 2. Fetch Price History
    fetch(`http://localhost:8000/api/products/${product.product_id}/price-history`)
      .then(res => res.json())
      .then(data => setPriceHistory(data))
      .catch(err => console.error("History fetch error:", err));
      
    // 3. Check if already in Wishlist
    if (user && token) {
      fetch('http://localhost:8000/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        const exists = data.some(item => item.product_id === product.product_id);
        setWishlistAdded(exists);
      })
      .catch(err => console.error(err));
    }
  }, [product.product_id, token, user]);

  // Add to Wishlist
  const handleAddToWishlist = async () => {
    if (!user) {
      alert("Please sign in to save products to your wishlist.");
      return;
    }
    
    setWishlistLoading(true);
    // Find cheapest offer to use as default product details
    const cheapestOffer = results[0];
    
    try {
      const res = await fetch('http://localhost:8000/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product.product_id,
          title: product.product_name,
          price: cheapestOffer.price,
          original_price: cheapestOffer.original_price,
          discount: cheapestOffer.discount,
          rating: cheapestOffer.rating,
          image_url: product.image_url,
          url: cheapestOffer.url,
          site_name: cheapestOffer.site_name
        })
      });

      if (res.ok) {
        setWishlistAdded(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const randomImageSuffix = () => {
    return Math.floor(Math.random() * (1600000 - 1500000) + 1500000);
  };

  // Helper tags generator
  const getBadgeType = (item) => {
    const isCheapest = item.price === Math.min(...results.map(r => r.price));
    const isHighestRated = item.rating === Math.max(...results.map(r => r.rating));
    const isFastestDel = item.delivery_date.toLowerCase().includes("tomorrow");
    const isBestDeal = item.discount === Math.max(...results.map(r => r.discount));
    
    if (isCheapest) return { text: "🟢 Lowest Price", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
    if (isHighestRated) return { text: "⭐ Highest Rated", bg: "bg-amber-500/10 border-amber-500/20 text-amber-400" };
    if (isFastestDel) return { text: "🚚 Fastest Delivery", bg: "bg-blue-500/10 border-blue-500/20 text-blue-400" };
    if (isBestDeal) return { text: "🔥 Best Deal", bg: "bg-rose-500/10 border-rose-500/20 text-rose-400" };
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-10">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>New Search</span>
        </button>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleAddToWishlist}
            disabled={wishlistAdded || wishlistLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${
              wishlistAdded 
                ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Heart size={16} className={wishlistAdded ? "fill-emerald-400" : ""} />
            <span>{wishlistAdded ? "Added to Wishlist" : "Save to Favorites"}</span>
          </button>
        </div>
      </div>

      {/* Query Corrector / Manual Override search field */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800/85 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Matched Product Details</h4>
          <p className="text-xs text-slate-500">Not the correct product? Edit the product title below to compare again.</p>
        </div>
        <form onSubmit={handleUpdateSearch} className="flex gap-2 max-w-lg w-full">
          <input 
            type="text" 
            value={editQuery}
            onChange={e => setEditQuery(e.target.value)}
            placeholder="e.g. Sony WH-1000XM5 Headphones..."
            className="flex-1 bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs outline-none text-slate-200 transition"
          />
          <button 
            type="submit" 
            disabled={searching}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition flex items-center gap-1.5 shrink-0"
          >
            {searching ? (
              <span className="animate-spin rounded-full h-3 w-3 border-t border-slate-100"></span>
            ) : "Compare Again"}
          </button>
        </form>
      </div>

      {/* Main product summary banner */}
      <div className="grid md:grid-cols-3 gap-8 items-center bg-slate-900/30 border border-slate-800 p-8 rounded-3xl">
        <div className="relative aspect-video md:aspect-square w-full rounded-2xl overflow-hidden bg-slate-950/50 flex items-center justify-center border border-slate-800">
          <img 
            src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&fit=crop"} 
            alt={product.product_name}
            className="object-contain max-h-[80%] max-w-[85%] mix-blend-screen"
          />
          <span className="absolute top-3 left-3 bg-violet-600/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
            Vision Match: {Math.round(product.confidence_score * 100)}%
          </span>
        </div>
        <div className="md:col-span-2 space-y-4">
          <span className="text-xs font-bold text-violet-400 tracking-wider uppercase">{product.category}</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">{product.product_name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Brand</p>
              <p className="text-sm font-semibold text-slate-300">{product.brand}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Model</p>
              <p className="text-sm font-semibold text-slate-300">{product.model_number}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Color</p>
              <p className="text-sm font-semibold text-slate-300">{product.color}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Variant</p>
              <p className="text-sm font-semibold text-slate-300">{product.variant}</p>
            </div>
          </div>
          {product.ocr_text && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="text-[10px] font-bold text-slate-500 block mb-1">OCR EXTRACTED LABEL TEXT:</span>
              {product.ocr_text}
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendation Dashboard Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-slate-200 flex items-center gap-2">
          <Award className="text-violet-400" size={20} />
          PriceVision AI Smart Recommendation
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-emerald-950/10 border border-emerald-900/20 space-y-2">
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1">
              <TrendingDown size={12} /> Best Value
            </span>
            <p className="text-xl font-extrabold text-slate-100">₹{recommendations.best_value?.price.toLocaleString()}</p>
            <p className="text-xs text-slate-400">{recommendations.best_value?.site_name}: {recommendations.best_value?.reason}</p>
          </div>
          <div className="p-5 rounded-2xl bg-amber-950/10 border border-amber-900/20 space-y-2">
            <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1">
              <Star size={12} className="fill-amber-400" /> Highest Rated
            </span>
            <p className="text-xl font-extrabold text-slate-100">{recommendations.highest_rated?.rating}★</p>
            <p className="text-xs text-slate-400">{recommendations.highest_rated?.site_name} Offer: {recommendations.highest_rated?.reason}</p>
          </div>
          <div className="p-5 rounded-2xl bg-blue-950/10 border border-blue-900/20 space-y-2">
            <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase flex items-center gap-1">
              <Zap size={12} /> Fastest Delivery
            </span>
            <p className="text-xl font-extrabold text-slate-100">{recommendations.fastest_delivery?.delivery_date}</p>
            <p className="text-xs text-slate-400">Via {recommendations.fastest_delivery?.site_name}: {recommendations.fastest_delivery?.reason}</p>
          </div>
          <div className="p-5 rounded-2xl bg-violet-950/20 border border-violet-900/30 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-violet-400 tracking-wider uppercase">AI Saving Tip</span>
              <p className="text-xs font-semibold text-slate-200 mt-1">{recommendations.savings_recommendation}</p>
            </div>
            {user && (
              <button 
                onClick={() => alert("Alert set! You will receive a drop notification.")}
                className="flex items-center justify-center gap-1.5 mt-2 w-full py-1.5 rounded-lg bg-violet-900/30 hover:bg-violet-950 border border-violet-800 text-[10px] font-bold text-violet-300 transition"
              >
                <BellRing size={12} /> Set Price Alert
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Comparison Section: Filters & Product Cards Grid */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <h3 className="text-lg font-extrabold text-slate-200">Offers & Stores Comparison</h3>
          
          {/* Sorter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'price-low', label: 'Lowest Price' },
              { id: 'rating', label: 'Highest Rated' },
              { id: 'discount', label: 'Highest Discount' },
              { id: 'delivery', label: 'Cheapest Delivery' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setSortBy(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  sortBy === pill.id 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {sortedResults.map((item, idx) => {
            const badge = getBadgeType(item);
            return (
              <motion.div 
                key={item.site_name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[290px] relative overflow-hidden"
              >
                {/* Highlight Tag */}
                {badge && (
                  <span className={`absolute top-3 right-3 text-[9px] font-extrabold px-2.5 py-1 rounded-full border ${badge.bg}`}>
                    {badge.text}
                  </span>
                )}

                {/* Card Top */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black shadow"
                      style={{ backgroundColor: item.logo_color, color: '#fff' }}
                    >
                      {item.site_name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{item.site_name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Verified Seller</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-300 text-xs line-clamp-2">{item.title}</h5>
                  </div>
                </div>

                {/* Card Center: Pricing Details */}
                <div className="my-4 space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-100">₹{item.price.toLocaleString()}</span>
                    {item.discount > 0 && (
                      <>
                        <span className="text-xs text-slate-500 line-through">₹{item.original_price.toLocaleString()}</span>
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {item.discount}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star size={10} className="fill-amber-400" /> {item.rating}
                    </span>
                    <span>({item.reviews_count.toLocaleString()} reviews)</span>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-1 space-y-0.5">
                    <p>Delivery: <span className="text-slate-300 font-medium">{item.delivery_charge}</span> ({item.delivery_date})</p>
                    <p>Stock: <span className={item.stock_status.toLowerCase().includes("out") ? "text-rose-500" : "text-emerald-500"}>{item.stock_status}</span></p>
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-[10px] font-bold text-slate-200 border border-slate-700/50 transition"
                  >
                    <span>View Product</span>
                    <ExternalLink size={10} />
                  </a>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center justify-center gap-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-[10px] font-extrabold text-white transition shadow shadow-violet-500/10"
                  >
                    <span>Buy Now</span>
                    <ShoppingCart size={10} />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-slate-200">Comparison Table</h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/10">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-bold">
                <th className="p-4">Website</th>
                <th className="p-4">Price</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Delivery</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((item) => (
                <tr key={item.site_name} className="border-b border-slate-850 hover:bg-slate-900/30 transition-all">
                  <td className="p-4 font-bold text-slate-200 flex items-center gap-2">
                    <div 
                      className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-black"
                      style={{ backgroundColor: item.logo_color, color: '#fff' }}
                    >
                      {item.site_name[0]}
                    </div>
                    {item.site_name}
                  </td>
                  <td className="p-4 font-black text-slate-100">₹{item.price.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-0.5 text-xs text-amber-400 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                      ★ {item.rating}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-400">{item.discount}% OFF</td>
                  <td className="p-4 text-xs text-slate-400">{item.delivery_charge} ({item.delivery_date})</td>
                  <td className="p-4 text-right">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600/90 hover:bg-violet-600 text-xs font-bold text-white transition shadow shadow-violet-500/5"
                    >
                      Buy Now
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Price History Chart */}
      {priceHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-200 flex items-center gap-2">
            <TrendingDown className="text-violet-400" size={20} />
            Price History Chart (30 Days)
          </h3>
          <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-3xl">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {/* Add gradients for each major site */}
                    <linearGradient id="colorAmazon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF9900" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#FF9900" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorFlipkart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2874F0" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2874F0" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(tick) => `₹${tick/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  {results.slice(0, 3).map((r, i) => (
                    <Area 
                      key={r.site_name}
                      type="monotone" 
                      dataKey={r.site_name} 
                      stroke={r.logo_color} 
                      fillOpacity={1} 
                      fill={`url(#color${r.site_name})`} 
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Similar Products Recommendation */}
      {!similarLoading && similarProducts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-200 flex items-center gap-2">
            <Compass className="text-violet-400" size={20} />
            Similar Product Recommendations
          </h3>
          <div className="grid sm:grid-cols-3 gap-5">
            {similarProducts.map(item => (
              <div 
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/20 border border-slate-800 flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/25">
                    {Math.round(item.match_score * 100)}% AI Match
                  </span>
                  <h4 className="font-bold text-sm text-slate-200 mt-3 line-clamp-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">₹{item.price.toLocaleString()}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Category: {item.category}</span>
                  <span className="text-slate-300 font-medium">{item.brand}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
