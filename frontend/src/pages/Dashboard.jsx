import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Camera, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard({ onSearchComplete }) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const loadingSteps = [
    "Initializing Vision AI engine...",
    "Scanning image boundaries...",
    "Executing EasyOCR text analysis...",
    "Extracting brand, model, and serials...",
    "Querying 13 e-commerce providers...",
    "Generating AI smart recommendation...",
    "Rendering comparison dashboard..."
  ];

  const runImageSearch = async (file) => {
    setLoading(true);
    setLoadingStep(0);
    setError('');

    // Animate loader text
    const timer = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < loadingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 900);

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('pv_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('http://localhost:8000/api/products/search/image', {
        method: 'POST',
        headers,
        body: formData
      });

      if (!res.ok) throw new Error('Search failed. Please try again.');

      const data = await res.json();
      clearInterval(timer);
      onSearchComplete(data);
    } catch (err) {
      clearInterval(timer);
      setError(err.message || 'An error occurred during search.');
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setLoadingStep(4); // Start later for url search since it doesn't need OCR/Vision
    setError('');

    const timer = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < loadingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 700);

    const token = localStorage.getItem('pv_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('http://localhost:8000/api/products/search/url', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: urlInput })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to parse URL.');
      }

      const data = await res.json();
      clearInterval(timer);
      onSearchComplete(data);
    } catch (err) {
      clearInterval(timer);
      setError(err.message || 'An error occurred during url search.');
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      runImageSearch(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      runImageSearch(e.target.files[0]);
    }
  };

  // Run demo search helper
  const runDemoSearch = async (titleKeyword) => {
    // We create a mock file with filename like "iphone.jpg" or "sony.jpg" to trigger correct AI mapping
    const mockFile = new File(["mock_data"], `${titleKeyword}.jpg`, { type: "image/jpeg" });
    runImageSearch(mockFile);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[85vh]">
      <AnimatePresence mode="wait">
        {!loading ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full text-center space-y-10"
          >
            {/* Header Text */}
            <div className="space-y-4">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 px-3.5 py-1.5 rounded-full text-xs font-semibold"
              >
                <Sparkles size={14} />
                Now Powered by Gemini Vision
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Compare Prices Using <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                  Image Vision & URLs
                </span>
              </h1>
              <p className="text-slate-400 max-w-xl mx-auto text-base">
                Upload a product photo, drop an image, or paste an e-commerce product link to find the lowest price across 13 major platforms.
              </p>
            </div>

            {/* Split Search Panel */}
            <div className="grid md:grid-cols-2 gap-6 text-left">
              {/* Image Drag & Drop Card */}
              <div 
                onDragEnter={handleDrag} 
                onDragOver={handleDrag} 
                onDragLeave={handleDrag} 
                onDrop={handleDrop}
                className={`relative group rounded-3xl border p-8 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 min-h-[300px] ${
                  dragActive 
                    ? 'border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-500/10' 
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <input 
                  type="file" 
                  id="image-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label htmlFor="image-upload" className="w-full h-full flex flex-col justify-between items-center cursor-pointer">
                  <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/50 group-hover:scale-110 group-hover:bg-violet-900/20 group-hover:border-violet-500/30 transition-all duration-300">
                    <Camera size={32} className="text-slate-400 group-hover:text-violet-400 transition" />
                  </div>
                  <div className="space-y-2 mt-4">
                    <h3 className="font-bold text-lg text-slate-100">Scan Product Image</h3>
                    <p className="text-sm text-slate-400 px-4">
                      Drag and drop your image here, or <span className="text-violet-400 font-semibold group-hover:underline">browse files</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-6">Supports JPG, PNG, WEBP</span>
                </label>
              </div>

              {/* URL Input Card */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col justify-between min-h-[300px]">
                <div className="flex flex-col items-center text-center">
                  <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/50">
                    <LinkIcon size={32} className="text-slate-400" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-100 mt-4">Paste Product Link</h3>
                  <p className="text-sm text-slate-400 mt-2 px-2">
                    Paste product links from Amazon, Flipkart, Myntra, Ajio, Meesho, Croma, JioMart, etc.
                  </p>
                </div>

                <form onSubmit={handleUrlSubmit} className="space-y-3 mt-6">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://www.amazon.in/dp/..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3.5 pr-12 text-sm text-slate-200 placeholder-slate-600 outline-none transition"
                    />
                    <button 
                      type="submit"
                      className="absolute right-2.5 top-2.5 p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-600/10"
                    >
                      <Search size={16} />
                    </button>
                  </div>
                  {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
                </form>
              </div>
            </div>

            {/* Quick Demo Search section */}
            <div className="space-y-4 pt-6">
              <h4 className="text-xs font-semibold text-slate-500 tracking-widest uppercase">Quick Demo Searches</h4>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { name: "iPhone 15 Pro", keyword: "iphone", color: "from-slate-700 to-slate-900" },
                  { name: "Sony WH-1000XM5", keyword: "sony", color: "from-blue-900 to-slate-900" },
                  { name: "Adidas Running Shoes", keyword: "adidas", color: "from-emerald-950 to-slate-900" },
                  { name: "Nescafe Gold Coffee", keyword: "coffee", color: "from-amber-950 to-slate-900" }
                ].map(demo => (
                  <button
                    key={demo.name}
                    onClick={() => runDemoSearch(demo.keyword)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-slate-300 shadow-sm`}
                  >
                    <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-tr ${demo.color}`} />
                    {demo.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Premium Vision scanning animation */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center space-y-8 py-10"
          >
            {/* Spinning scanner orb */}
            <div className="relative h-28 w-28 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/30"
              />
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="h-20 w-20 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-500/40 relative z-10"
              >
                <Upload className="text-white h-8 w-8 animate-pulse" />
              </motion.div>
              <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-xl animate-pulse" />
            </div>

            {/* Step text animation */}
            <div className="text-center space-y-2 max-w-sm">
              <h3 className="text-lg font-bold text-slate-100">Analyzing Product</h3>
              <div className="h-6 overflow-hidden relative">
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={loadingStep}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs text-violet-400 font-semibold"
                  >
                    {loadingSteps[loadingStep]}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto mt-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
