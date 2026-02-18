
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-600 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.283a2 2 0 01-1.198.043l-2.431-.73a2 2 0 01-1.28-1.907v-4.577a2 2 0 011.105-1.79l2.352-1.177a2 2 0 011.697 0l2.352 1.177A2 2 0 0115.422 8.35v1.306a2 2 0 001.242 1.848l.44.176a2 2 0 011.169 2.531l-.845 2.112a2 2 0 01-1.996 1.304l-1.004-.001a2 2 0 00-1.854 1.144l-.845 2.112z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">Contenize</h1>
              <p className="text-xs text-slate-500 font-medium">Omnichannel Content Engine</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-orange-600">Methodology</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-orange-600">Templates</a>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
              Upgrade Pro
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
