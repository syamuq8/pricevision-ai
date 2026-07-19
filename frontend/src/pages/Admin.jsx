import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, Users, Search, Heart, Landmark, BarChart, Settings } from 'lucide-react';

export default function Admin() {
  const { token } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [affsite, setAffsite] = useState('Amazon');
  const [afftag, setAfftag] = useState('pricevision-21');
  const [configMsg, setConfigMsg] = useState('');

  const fetchAdminData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [analyticsRes, usersRes, searchesRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/analytics', { headers }),
        fetch('http://localhost:8000/api/admin/users', { headers }),
        fetch('http://localhost:8000/api/admin/searches', { headers })
      ]);
      
      const analyticsData = await analyticsRes.json();
      const usersData = await usersRes.json();
      const searchesData = await searchesRes.json();
      
      setAnalytics(analyticsData);
      setUsers(usersData);
      setSearches(searchesData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token]);

  const handleUpdateAffiliate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/admin/affiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ site_name: affsite, affiliate_tag: afftag })
      });
      if (res.ok) {
        setConfigMsg("Affiliate settings saved!");
        setTimeout(() => setConfigMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
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
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <ShieldAlert className="text-violet-400" size={24} />
          Admin Control Center
        </h2>
        <p className="text-xs text-slate-400 mt-1">Platform analytics, users, and affiliate tag management</p>
      </div>

      {/* Analytics Cards Grid */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-850 space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Total Users</span>
              <Users size={16} />
            </div>
            <p className="text-2xl font-extrabold text-slate-100">{analytics.total_users}</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-850 space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Searches Run</span>
              <Search size={16} />
            </div>
            <p className="text-2xl font-extrabold text-slate-100">{analytics.total_searches}</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-850 space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Wishlists</span>
              <Heart size={16} />
            </div>
            <p className="text-2xl font-extrabold text-slate-100">{analytics.total_wishlist_items}</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-850 space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Image/URL Split</span>
              <BarChart size={16} />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              🖼️ {analytics.searches_by_type?.image || 0} / 🔗 {analytics.searches_by_type?.url || 0}
            </p>
          </div>
        </div>
      )}

      {/* Main Admin Config Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Users list (span 2) */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-extrabold text-slate-200 text-sm tracking-wider uppercase flex items-center gap-2">
            <Users size={16} className="text-violet-400" /> Platform Registered Users
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-500 font-bold uppercase">
                  <th className="p-3">User Details</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Privileges</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-850 hover:bg-slate-900/20">
                    <td className="p-3">
                      <p className="font-bold text-slate-200">{u.full_name || 'No Name'}</p>
                      <p className="text-slate-500 mt-0.5">{u.email}</p>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        u.is_admin ? 'bg-violet-900/40 text-violet-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {u.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Affiliate Links Management */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-200 text-sm tracking-wider uppercase flex items-center gap-2">
            <Settings size={16} className="text-violet-400" /> Affiliate Configs
          </h3>
          <form onSubmit={handleUpdateAffiliate} className="p-5 rounded-2xl bg-slate-900/30 border border-slate-850 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">E-commerce Store</label>
              <select 
                value={affsite}
                onChange={e => setAffsite(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs outline-none text-slate-200"
              >
                <option value="Amazon">Amazon</option>
                <option value="Flipkart">Flipkart</option>
                <option value="Myntra">Myntra</option>
                <option value="Ajio">Ajio</option>
                <option value="Croma">Croma</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Affiliate Tag ID</label>
              <input 
                type="text" 
                value={afftag}
                onChange={e => setAfftag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs outline-none text-slate-200"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition shadow shadow-violet-600/10"
            >
              Update Settings
            </button>
            {configMsg && <p className="text-[10px] text-emerald-400 font-bold text-center mt-2">{configMsg}</p>}
          </form>
        </div>
      </div>

      {/* Recent Searches */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-200 text-sm tracking-wider uppercase flex items-center gap-2">
          <Search size={16} className="text-violet-400" /> Recent Search Queries
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/10">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-500 font-bold uppercase">
                <th className="p-3">Type</th>
                <th className="p-3">Query Value</th>
                <th className="p-3">User ID</th>
                <th className="p-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {searches.slice(0, 10).map(s => (
                <tr key={s.id} className="border-b border-slate-850 hover:bg-slate-900/20">
                  <td className="p-3 font-bold text-slate-300">{s.query_type.toUpperCase()}</td>
                  <td className="p-3 text-slate-400 truncate max-w-xs">{s.query_val}</td>
                  <td className="p-3 text-slate-500">{s.user_id || 'Guest Session'}</td>
                  <td className="p-3 text-slate-500 text-right">{new Date(s.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
