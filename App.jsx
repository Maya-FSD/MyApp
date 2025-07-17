import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgetPassword from './pages/ForgetPassword';
import UserRegistration from './pages/UserRegistration';
import Header from './pages/Header';
import SplitAdminDashboard from './pages/SplitAdminDashboard';
import Footer from './pages/Footer';
import { AuthProvider, useAuth } from './components/Auth/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import UsersSection from './components/layout/UsersSection';
import UpdateUsers from './components/layout/UpdateUser';
import EditUser from './components/layout/EditUser';  
import BranchSection from './components/layout/BranchSection';
import CodeSection from './components/layout/CodeSection';
import ReportSection from './components/layout/ReportSection';
import ChangePassword from './pages/ChangePassword';
import AddCode from './components/layout/AddCode';
import CodeList from './components/layout/CodeList';
import AddBranch from './components/layout/AddBranch';
import BranchListPage from './components/layout/BranchListPage';
import DashboardHome from './pages/DashboardHome';
import UpdateCode from './components/layout/UpdateCode';
import DeleteCode from './components/layout/DeleteCode';
import EditCode from './components/layout/EditCode';
import ExportCode from './components/layout/ExportCode';
import MainLayout from './pages/MainLayout';
import AudioFileAuditReport from './components/reports/AudioFileAuditReport';


const AppContent = () => (
  <>
    {/* Fixed Header */}
    <Header />

    {/* Fixed Sidebar */}
    <div className="fixed top-16 bottom-16 left-0 w-64 bg-gray-100 shadow z-40">
  <SplitAdminDashboard />
</div>

    {/* Fixed Footer */}
    <Footer />

    {/* Main Content Area */}
<main className="absolute top-16 bottom-16 left-64 ml-4 right-0 overflow-y-auto p-4">
  <div
    className="w-full h-full flex flex-col shadow-2xl rounded-xl overflow-auto"
    style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    }}
  >
      <Routes>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/users" element={<UsersSection />} />
            <Route path="/branches" element={<BranchSection />} />
            <Route path="/codes" element={<CodeSection />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/register" element={<UserRegistration />} />
            <Route path="/codes/add" element={<AddCode />} />
            <Route path="/codes/list" element={<CodeList />} />
            <Route path="/branches/add" element={<AddBranch />} />
            <Route path="/branches/list" element={<BranchListPage />} />
            <Route path="/codes/update" element={<UpdateCode />} />
            <Route path="/codes/delete/:id" element={<DeleteCode />} />
            <Route path="/codes/edit/:id" element={<EditCode />} />
            <Route path="/codes/export" element={<ExportCode />} />
            <Route path="/users/update" element={<UpdateUsers />} />
            <Route path="/users/edit/:userId" element={<EditUser />} />
               <Route path="/reports" element={<ReportSection />} />
                <Route path="/codes/analytics" element={<MainLayout />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
          </Routes>
        </div>
    
    </main>
  </>
);


const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgetPassword />} />
          <Route path="/register" element={<UserRegistration />} />
          <Route path="/reports/audio-file-audit" element={<AudioFileAuditReport />} />
         
          
          {/* Main Application Content */}
       
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

// Enhanced Dashboard Home Component


        export default App;