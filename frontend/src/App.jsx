import React, { useState, useContext } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SearchResults from './pages/SearchResults';
import Wishlist from './pages/Wishlist';
import History from './pages/History';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';

function AppContent() {
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('search');
  const [currentSearch, setCurrentSearch] = useState(null);

  const handleSearchComplete = (data) => {
    setCurrentSearch(data);
    setActiveTab('results');
  };

  const handleBackToSearch = () => {
    setCurrentSearch(null);
    setActiveTab('search');
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Pane */}
      <main className="flex-1 lg:pl-64 min-h-screen overflow-x-hidden pt-16 lg:pt-0">
        <div className="gradient-bg min-h-screen py-6 px-4 sm:px-6 md:px-8">
          {activeTab === 'search' && (
            <Dashboard onSearchComplete={handleSearchComplete} />
          )}
          {activeTab === 'results' && currentSearch && (
            <SearchResults searchData={currentSearch} onBack={handleBackToSearch} onUpdateSearch={setCurrentSearch} />
          )}
          {activeTab === 'wishlist' && (
            <Wishlist />
          )}
          {activeTab === 'history' && (
            <History onReRunSearch={handleSearchComplete} />
          )}
          {activeTab === 'admin' && (
            <Admin />
          )}
          {activeTab === 'auth' && (
            <Auth onAuthSuccess={() => setActiveTab('search')} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
