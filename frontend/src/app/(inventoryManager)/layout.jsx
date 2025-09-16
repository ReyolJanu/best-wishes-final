
'use client';
import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/sidebar/Sidebar';
import WarningModal from '../components/WarningModal';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import AuthNavbar from '../components/authNavbar/page';

export default function RootLayout({ children }) {
  const [showWarning, setShowWarning] = useState(false);
  const { user } = useSelector(state => state.userState);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      setShowWarning(true);
      return;
    }

    // Check if user has the correct role
    if (user.role !== 'inventoryManager') {
      setShowWarning(true);
      return;
    }

    // If user has correct role but is not on the main dashboard page, redirect them
    if (user.role === 'inventoryManager' && pathname === '/inventorymanager') {
      // User is already on correct dashboard, do nothing
      return;
    }

    // User has correct role, hide warning if it was shown
    setShowWarning(false);
  }, [user, pathname]);

  if (!user || user.role !== 'inventoryManager') {
    return (
      <>
        <AuthNavbar />
        <WarningModal 
          isOpen={showWarning} 
          onClose={() => setShowWarning(false)}
          requiredRole="inventoryManager"
        />
        <Toaster position="top-center" richColors closeButton />
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen">
        <DashboardSidebar role="Inventory Manager" title="Best Wishes" subtitle />
        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
