'use client';
import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/sidebar/Sidebar';
import WarningModal from '../components/WarningModal';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import AuthNavbar from '../components/authNavbar/page';

export default function RootLayout({ children }) {
  const [showWarning, setShowWarning] = useState(false);
  const { user } = useSelector(state => state.userState);
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setShowWarning(true);
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <>
        <AuthNavbar />
        <WarningModal 
          isOpen={showWarning} 
          onClose={() => setShowWarning(false)} 
        />
        <Toaster position="top-center" richColors closeButton />
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen">
        <DashboardSidebar role="admin" title="Best Wishes" subtitle />
        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
