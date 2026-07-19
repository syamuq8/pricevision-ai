import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { History as HistoryIcon, Trash2, RefreshCw, Clock, ExternalLink } from 'lucide-react';

export default function History({ onReRunSearch }) {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    if (!token) return;
    setLoading(true);
    fetch('http://localhost:8000/api/history', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setRecords(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const deleteItem = (id) => {
    fetch(`http://localhost:8000/api/history/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== id));
      }
    })
    .catch(err => console.error(err));
  };

  const handleReRun = async (record) => {
    // If it's a URL search, we can just send the url
    // If it's an image search, we re-run using the demo search flow for simplicity!
    setLoading(true);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      let res;
      if (record.query_type === 'url') {
        res = await fetch('http://localhost:8000/api/products/search/url', {
          method: 'POST',
          headers,
          body: JSON.stringify({ url: record.query_val })
        });
      } else {
        // Image demo fallback re-run
        // Parse a generic keyword from filename
        const keyword = record.query_val.split('.')[0] || 'iphone';
        const mockFile = new File(["mock_data"], `${keyword}.jpg`, { type: "image/jpeg" });
        const formData = new FormData();
        formData.append('file', mockFile);
        
        res = await fetch('http://localhost:8000/api/products/search/image', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }

      if (res.ok) {
        const data = await res.json();
        onReRunSearch(data);
      }
    } catch (err) {
      console.error("Re-running search failed", err);
    } finally {
      setLoading(false);
    }
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
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <HistoryIcon className="text-violet-400" size={24} />
          Search History ({records.length})
        </h2>
        <p className="text-xs text-slate-400 mt-1">Previous searches and scanned files</p>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-800 border-dashed rounded-3xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 mx-auto">
            <Clock size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-200">No search history</h3>
            <p className="text-xs text-slate-500">Start scanning products or links to save your history here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(record => (
            <div 
              key={record.id}
              className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 hover:border-slate-800 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 shrink-0 text-slate-400">
                  {record.query_type === 'image' ? '🖼️' : '🔗'}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">
                    {record.query_type} SEARCH
                  </span>
                  <h4 className="font-semibold text-slate-200 text-sm truncate mt-0.5" title={record.query_val}>
                    {record.query_val}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Scanned on {new Date(record.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleReRun(record)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/95 hover:bg-violet-600 text-xs font-bold text-white transition shadow shadow-violet-500/10"
                >
                  <RefreshCw size={12} />
                  <span>Compare Again</span>
                </button>
                <button
                  onClick={() => deleteItem(record.id)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 border border-slate-750 transition"
                  title="Delete record"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
