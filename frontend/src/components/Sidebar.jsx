import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { 
  Search, Heart, History, ShieldAlert, LogOut, Sun, Moon, Bell, Menu, X, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout, token } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('http://localhost:8000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error("Error fetching notifications", err));
    }
  }, [token, activeTab]);

  const markAsRead = (id) => {
    fetch(`http://localhost:8000/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    })
    .catch(err => console.error(err));
  };

  const navItems = [
    { id: 'search', label: 'AI Search', icon: Search },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, authRequired: true },
    { id: 'history', label: 'Search History', icon: History, authRequired: true },
    { id: 'admin', label: 'Admin Panel', icon: ShieldAlert, adminRequired: true },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.authRequired && !user) return false;
    if (item.adminRequired && (!user || !user.is_admin)) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 transition"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Main Sidebar Wrapper */}
      <AnimatePresence>
        {(isOpen || true) && (
          <motion.div 
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 20 }}
            className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-slate-800/80 flex flex-col justify-between py-6 px-4 ${
              isOpen ? 'translate-x-0' : 'hidden lg:flex'
            }`}
          >
            {/* Logo Section */}
            <div>
              <div className="flex items-center gap-3 px-2 mb-8 mt-10 lg:mt-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <span className="text-white font-extrabold text-xl">PV</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">PriceVision AI</h1>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">AI Shopping Hub</span>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1.5">
                {filteredItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive 
                          ? 'bg-violet-600/90 text-white shadow-lg shadow-violet-600/15 border border-violet-500/30' 
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 hover:border hover:border-slate-200/50'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions Section */}
            <div className="space-y-4">
              {/* Notification Toggler */}
              {user && (
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <Bell size={18} />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown list of notifications */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-14 left-0 w-60 max-h-56 overflow-y-auto glass-panel p-2.5 rounded-xl border border-slate-250 shadow-2xl z-50 text-xs space-y-2"
                      >
                        <h4 className="font-bold border-b border-slate-200 pb-1.5 mb-1 px-1 flex justify-between">
                          <span>Alerts</span>
                          <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-slate-900">✕</button>
                        </h4>
                        {notifications.length === 0 ? (
                          <p className="text-slate-500 text-center py-2">No alerts yet</p>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => !n.read && markAsRead(n.id)}
                              className={`p-2 rounded-lg cursor-pointer transition ${
                                n.read ? 'bg-slate-900/30 text-slate-400' : 'bg-violet-950/20 border border-violet-900/30 text-slate-200 hover:bg-violet-950/30'
                              }`}
                            >
                              <p className="font-medium mb-0.5">{n.message}</p>
                              <span className="text-[9px] text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Theme Settings & Profile details */}
              <div className="border-t border-slate-800/80 pt-4 space-y-3.5">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition"
                >
                  <div className="flex items-center gap-3.5">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                </button>

                {user ? (
                  <div className="flex items-center justify-between bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 font-bold border border-slate-300">
                        {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{user.full_name || 'Guest User'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={logout}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-200/40 transition"
                      title="Logout"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab('auth')}
                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition shadow-lg shadow-violet-500/10"
                  >
                    <User size={18} />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
