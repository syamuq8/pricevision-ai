import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Heart, Trash2, ExternalLink, Share2, AlertCircle, ShoppingBag } from 'lucide-react';

export default function Wishlist() {
  const { token, user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareSuccess, setShareSuccess] = useState(false);

  const fetchWishlist = () => {
    if (!token) return;
    setLoading(true);
    fetch('http://localhost:8000/api/wishlist', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setItems(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchWishlist();
  }, [token]);

  const removeItem = (id) => {
    fetch(`http://localhost:8000/api/wishlist/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
    })
    .catch(err => console.error(err));
  };

  const handleShare = () => {
    const mockUrl = `${window.location.origin}/shared-wishlist/${user?.id || 'guest'}`;
    navigator.clipboard.writeText(mockUrl);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Heart className="text-violet-400 fill-violet-400" size={24} />
            My Wishlist ({items.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">Products you saved for price tracking</p>
        </div>

        {items.length > 0 && (
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 transition"
          >
            <Share2 size={14} />
            <span>{shareSuccess ? "Link Copied!" : "Share Wishlist"}</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-800 border-dashed rounded-3xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 mx-auto">
            <ShoppingBag size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-200">Your wishlist is empty</h3>
            <p className="text-xs text-slate-500">Save products while comparing prices to view them here.</p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map(item => (
            <div 
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/30 border border-slate-850 flex items-center gap-4 hover:border-slate-800 transition"
            >
              <div className="h-20 w-20 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800/80 p-2 shrink-0">
                <img 
                  src={item.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&fit=crop"} 
                  alt={item.title} 
                  className="object-contain mix-blend-screen"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-200 text-sm truncate pr-2">{item.title}</h4>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-500 hover:bg-slate-850 transition"
                    title="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-black text-slate-100">₹{item.price?.toLocaleString()}</span>
                  {item.discount > 0 && (
                    <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                      {item.discount}% OFF
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Tracking on {item.site_name}</span>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-1 text-violet-400 hover:underline font-bold"
                  >
                    <span>Visit Shop</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
