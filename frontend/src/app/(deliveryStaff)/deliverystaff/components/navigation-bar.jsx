"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Package, AlertCircle, History, Route, BarChart3, Sun, Moon } from "lucide-react"
import ProfileAvatar from "./profile-avatar"
import ProfilePage from "./profile-page"
import Image from "next/image";
import logo from "@/assets/logo.png";


export default function NavigationBar({ activeTab, onTabChange, userProfile, notifications = [] }) {
  // State management
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showProfilePage, setShowProfilePage] = useState(false)
  const [userData, setUserData] = useState({
    name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "Loading...",
    email: userProfile?.email || "Loading...",
    phone: userProfile?.phone || "Loading...",
    profileImage: userProfile?.profileImage || "/images/profile-avatar.png",
  })
  
  // Update userData when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setUserData({
        name: `${userProfile.firstName} ${userProfile.lastName}`,
        email: userProfile.email,
        phone: userProfile.phone || "Not provided",
        profileImage: userProfile.profileImage || "/images/profile-avatar.png",
      })
    }
  }, [userProfile])
  
  const [userNotifications, setUserNotifications] = useState(notifications || [])
  
  // Update notifications when prop changes
  useEffect(() => {
    setUserNotifications(notifications || [])
  }, [notifications])
  
  // Mock notifications - remove this when real notifications are implemented
  const [mockNotifications] = useState([
    {
      id: "1",
      message: "Order #12345 assigned to you",
      time: "2 minutes ago",
      type: "order",
      read: false,
    },
    {
      id: "2",
      message: "New complaint received for Order #12340",
      time: "15 minutes ago",
      type: "complaint",
      read: false,
    },
    {
      id: "3",
      message: "System maintenance scheduled for tonight",
      time: "1 hour ago",
      type: "system",
      read: true,
    },
    {
      id: "4",
      message: "Order #12338 completed successfully",
      time: "2 hours ago",
      type: "order",
      read: true,
    },
    {
      id: "5",
      message: "Weekly delivery report is ready",
      time: "1 day ago",
      type: "system",
      read: true,
    },
  ])

  // Refs for dropdown positioning
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle notification click
  const handleNotificationClick = (notificationId) => {
    setUserNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
    // Navigate to notification details or handle specific notification actions
    console.log("Notification clicked:", notificationId)
  }

  // Handle view all notifications
  const handleViewAllNotifications = () => {
    setShowNotifications(false)
    // Navigate to notifications page or show expanded view
    console.log("View all notifications clicked")
    alert("Navigating to notifications page...")
  }

  // Handle profile save
  const handleProfileSave = () => {
    // Simulate API call to save user data
    console.log("Saving user data:", userData)
    // You would typically make an API call here
    alert("Profile updated successfully!")
  }

  // Handle logout
  const handleLogout = () => {
    // Simulate logout logic
    console.log("Logging out...")
    // You would typically clear auth tokens and redirect
    alert("Logged out successfully!")
  }

  // Get unread notification count
  const unreadCount = userNotifications.filter((n) => !n.read).length

  // Navigation items
  const navItems = [
    {
      id: "delivery",
      label: "Delivery Status",
      shortLabel: "Delivery",
      icon: Package,
    },
    {
      id: "route",
      label: "Delivery Route",
      shortLabel: "Route",
      icon: Route,
    },
    {
      id: "analytics",
      label: "Analytics",
      shortLabel: "Analytics",
      icon: BarChart3,
    },
    {
      id: "complains",
      label: "Complains",
      shortLabel: "Complains",
      icon: AlertCircle,
    },
    {
      id: "history",
      label: "Delivery History",
      shortLabel: "History",
      icon: History,
    },
  ]

  return (
    <>
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo */}
            {/* <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-purple-600 italic">Best wishes</h1>
            </div> */}
            <div className="flex items-center">
              <Image src={logo} alt="Logo" width={100} className="h-auto sm:w-[130px]" />
            </div>

            {/* Right: Notification and Profile */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {/* Notification Dropdown */}
              <div className="relative flex-1 sm:flex-none" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setShowProfile(false)
                  }}
                  className="relative hover:bg-purple-50 w-full sm:w-auto"
                >
                  <Bell className="w-5 h-5 mx-auto sm:mx-0" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notification Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-full sm:w-80 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No notifications</div>
                      ) : (
                        userNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id)}
                            className={`
                            p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
                            ${!notification.read ? "bg-blue-50" : ""}
                          `}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`
                              w-2 h-2 rounded-full mt-2 flex-shrink-0
                              ${
                                notification.type === "order"
                                  ? "bg-green-500"
                                  : notification.type === "complaint"
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                              }
                            `}
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`
                                text-sm ${!notification.read ? "font-semibold text-gray-900" : "text-gray-700"}
                              `}
                                >
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <Button 
                        onClick={handleViewAllNotifications}
                        variant="ghost" 
                        className="w-full text-sm text-purple-600 hover:bg-purple-50"
                      >
                        View All Notifications
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative flex-1 sm:flex-none" ref={profileRef}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowProfile(!showProfile)
                    setShowNotifications(false)
                  }}
                  className="hover:bg-purple-50 p-1 rounded-full w-full sm:w-auto"
                >
                  <ProfileAvatar
                    src="/images/profile-avatar.png"
                    alt="Profile"
                    name={userData.name}
                    size={32}
                    className="border-2 border-purple-200 mx-auto sm:mx-0"
                  />
                </Button>

                {showProfile && (
                  <div className="absolute right-0 mt-2 w-full sm:w-80 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Name</p>
                        <p className="text-sm text-gray-900">{userData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900 break-all">{userData.email}</p>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Second Row */}
        <div className="border-t border-gray-100">
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
            <div className="flex overflow-x-auto space-x-2 sm:space-x-4 md:space-x-8 py-3 scrollbar-hide">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => onTabChange(item.id)}
                    className={`
                      flex items-center space-x-1 sm:space-x-2 px-2 sm:px-0 py-2 text-xs sm:text-sm font-medium transition-all duration-200 border-b-2 rounded-none whitespace-nowrap flex-shrink-0
                      ${
                        isActive
                          ? "text-purple-600 border-purple-600"
                          : "text-gray-600 hover:text-purple-600 border-transparent hover:border-purple-300"
                      }
                    `}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{item.shortLabel}</span>
                    <span className="sm:hidden">{item.shortLabel.charAt(0)}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Page Modal */}
      {showProfilePage && (
        <ProfilePage 
          onClose={() => setShowProfilePage(false)} 
          userProfile={userProfile}
        />
      )}
    </>
  )
}
