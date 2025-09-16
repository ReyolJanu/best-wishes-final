'use client';
import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/sidebar/Sidebar';
import WarningModal from '../components/WarningModal';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import AuthNavbar from '../components/authNavbar/page';
import Image from 'next/image';
import { User, Settings, LogOut, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";

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
          requiredRole="admin"
        />
        <Toaster position="top-center" richColors closeButton />
      </>
    );
  }

  const handleLogout = () => {
    // Add logout logic here
    router.push('/login');
  };

  const handleProfileClick = () => {
    router.push('/setting');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <DashboardSidebar role="admin" title="" subtitle="" />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo Section */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Image 
                    src="/logo.png" 
                    alt="Best Wishes Logo" 
                    width={120}
                    height={40}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="border-l border-gray-300 pl-3">
                  <h1 className="text-lg font-semibold text-gray-800">Admin Panel</h1>
                  <p className="text-sm text-gray-500">Management Dashboard</p>
                </div>
                
              </div>

              

              {/* Admin Profile Section */}
              <div className="flex items-center space-x-4">
                {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 bg-green-200 hover:text-white hover:bg-green-500 rounded-lg transition-colors duration-200 group hover:cursor-pointer"
                title="Refresh Page"
              >
                <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-300" />
                <span className="hidden md:inline text-sm font-medium">Refresh</span>
              </button>
                <div className="text-right hidden sm:block">
                  
                  <p className="text-sm font-medium text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-1 transition-colors hover:cursor-pointer">
                      <Avatar className="h-10 w-10 border-2 border-purple-200">
                        <AvatarImage 
                          src={user?.profileImage || "/placeholder.svg"} 
                          alt={`${user?.firstName} ${user?.lastName}`}
                        />
                        <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold">
                          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 hover:text-red-700">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
