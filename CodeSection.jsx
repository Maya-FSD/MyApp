// src/pages/CodesMainPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';

const codesModules = [
  { label: 'View All Codes', icon: '📋', path: '/codes/list', description: 'Browse and search all codes' },
  { label: 'Add New Code', icon: '➕', path: '/codes/add', description: 'Create a new code entry' },
  { label: 'Update Codes', icon: '✏️', path: '/codes/update', description: 'Modify existing codes' }, 
  { label: 'Color Management', icon: '🎨', path: '/codes/colors', description: 'Manage code colors' },
  { label: 'Icon Library', icon: '🎯', path: '/codes/icons', description: 'Manage code icons' },
  { label: 'Export Codes', icon: '📤', path: '/codes/export', description: 'Export codes data' },
  { label: 'Import Codes', icon: '📥', path: '/codes/import', description: 'Import codes from file' },
  { label: 'Code Analytics', icon: '📊', path: '/codes/analytics', description: 'View usage statistics' },  

];

const CodesMainPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Codes Management Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage system codes, colors, purposes, and icons</p>
          {user && (
            <p className="text-sm text-gray-500 mt-1">Welcome, {user.name || user.username}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
          
        </div>
      </header>

     
      {/* Main Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {codesModules.map((module, idx) => (
          <div
            key={idx}            
             onClick={() => {
    console.log('Attempting to navigate to:', module.path); // Add this line
    navigate(module.path);
  }}
            className="cursor-pointer bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-md hover:border-blue-500 hover:scale-[1.02] group"
          >
            <div className="text-5xl mb-3 group-hover:text-blue-600 transition-colors">
              {module.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-700 mb-2">
              {module.label}
            </h3>
            <div className="text-sm text-gray-500 group-hover:text-blue-600 mb-2">
              {module.description}
            </div>
            <div className="text-xs text-gray-400 group-hover:text-blue-500">
              Click to access
            </div>
          </div>
        ))}
      </div>
      
      
      <div className="mt-10 text-center text-gray-500 text-sm">
        <p>Codes Panel • Restricted Access </p>
      </div>
    </div>
  );
};

export default CodesMainPage;