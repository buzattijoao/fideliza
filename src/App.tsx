import React from 'react';
import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import CustomerDashboard from './components/customer/CustomerDashboard';
import PublicRegistration from './components/PublicRegistration';

function AppContent() {
  const { state } = useApp();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check if it's a registration URL
  const registrationMatch = currentPath.match(/^\/register\/(.+)$/);
  if (registrationMatch) {
    const companySlug = registrationMatch[1];
    return <PublicRegistration companySlug={companySlug} />;
  }

  if (!state.currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {state.currentUser.type === 'superadmin' ? (
        <SuperAdminDashboard />
      ) : state.currentUser.type === 'admin' ? (
        <AdminDashboard />
      ) : (
        <CustomerDashboard />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;