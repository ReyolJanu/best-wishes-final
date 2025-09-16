"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  Bookmark,
  Calendar,
  Calculator,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  CreditCardIcon,
  DollarSign,
  Edit,
  Eye,
  FileText,
  Gift,
  Heart,
  HelpCircle,
  Home,
  ImageIcon,
  Key,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Star,
  TrendingUp,
  Truck,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react"

// Navigation data configuration for each role
const getNavigationData = (role) => {
  switch (role) {
    case "admin":
      return [
        {
          title: "Dashboard",
          icon: BarChart3,
          items: [
            {
              title: "Overview ",
              icon: Home,
              href: "/admin",
             },
            // {
            //   title: "Product Profit Analysis",
            //   icon: TrendingUp,
            //   href: "/admin/dashboard/profit-analysis",
            // },
            // {
            //   title: " Profit/Loss Calculation",
            //   icon: FileText,
            //   href: "/admin/dashboard/funnel",
            // },
          ],
        },
        {
          title: "Users Management",
          icon: Users,
          items: [
            {
              title: "View Users List",
              icon: Users,
              href: "/usermanage",
            },
          //   {
          //     title: "Edit/Delete Users",
          //     icon: Edit,
          //     href: "/admin/users/manage",
          //   },
          //   {
          //     title: "User Activity",
          //     icon: Activity,
          //     href: "/admin/users/activity",
          //   },
          //   {
          //     title: "Manage User Status",
          //     icon: UserCheck,
          //     href: "/admin/users/status",
          //   },
          //   {
          //     title: "Search Users",
          //     icon: Search,
          //     href: "/admin/users/search",
          //   },
          ],
        },
        {
          title: "Roles Management",
          icon: UserCheck,
          items: [
            {
              title: "Staff Management",
              icon: UserCheck,
              href: "/roles-management",
            },
          ],
        },
        {
          title: "Products Management",
          icon: Package,
          items: [
            {
              title: "Product",
              icon: FileText,
              href: "/prodectmanage",
            },
            // {
            //   title: "Add New Product",
            //   icon: Plus,
            //   href: "/admin/products/add",
            // },
            // {
            //   title: "Edit Existing Products",
            //   icon: Edit,
            //   href: "/admin/products/edit",
            // },
            // {
            //   title: "Manage Categories",
            //   icon: FileText,
            //   href: "/admin/products/categories",
            // },
            // {
            //   title: "Inventory Management",
            //   icon: FileText,
            //   href: "/admin/products/inventory",
            // },
            // {
            //   title: "Out of Stock",
            //   icon: Archive,
            //   href: "/admin/products/stock",
            // },
            // {
            //   title: "Profit/Loss Calculation",
            //   icon: Calculator,
            //   href: "/admin/products/profit",
            // },
          ],
        },
        {
          title: "Orders Management",
          icon: ShoppingCart,
          items: [
            { title: "View All Orders", icon: Eye, href: "/order" },
            // {
            //   title: "Edit Order Status",
            //   icon: Edit,
            //   href: "/admin/orders/status",
            // },
            // {
            //   title: "Order Details",
            //   icon: CreditCard,
            //   href: "/admin/orders/details",
            // },
            // {
            //   title: "Refunds & Cancellations",
            //   icon: RefreshCw,
            //   href: "/admin/orders/refunds",
            // },
            // {
            //   title: "Order History",
            //   icon: Clock,
            //   href: "/admin/orders/history",
            // },
            // {
            //   title: "Bulk Processing",
            //   icon: Archive,
            //   href: "/admin/orders/bulk",
            // },
          ],
        },
        {
          title: "Surprise Gift Orders",
          icon: Gift,
          items: [
            {
              title: "Manage Surprise Gifts",
              icon: Gift,
              href: "/surpriseGifts",
            },
            {
              title: "Track Gift Orders",
              icon: Eye,
              href: "/surpriseGifts",
            },
            {
              title: "Delivery Management",
              icon: UserCheck,
              href: "/surpriseGifts",
            }
          ],
        },
        {
          title: "Banner & Homepage",
          icon: ImageIcon,
          items: [
            {
              title: "Homepage Banners",
              icon: ImageIcon,
              href: "/homepage_ads",
            },
            // {
            //   title: "Featured Products",
            //   icon: Star,
            //   href: "/admin/homepage/featured",
            // },
            // { title: "Hero Section", icon: Home, href: "/admin/homepage/hero" },
            // {
            //   title: "Event Section",
            //   icon: Calendar,
            //   href: "/admin/homepage/events",
            // },
          ],
        },
        {
          title: "Reports & Analytics",
          icon: FileText,
          items: [
            {
              title: "Reports Dashboard",
              icon: BarChart3,
              href: "/reports",
            },
          ],
        },
        {
          title: "Settings",
          icon: Settings,
          items: [
            {
              title: "Admin Profile",
              icon: User,
              href: "/setting",
            },
            // {
            //   title: "Change Password",
            //   icon: Key,
            //   href: "/admin/settings/password",
            // },
            // {
            //   title: "Notifications",
            //   icon: Bell,
            //   href: "/admin/settings/notifications",
            // },
            // {
            //   title: "System Settings",
            //   icon: Settings,
            //   href: "/admin/settings/system",
            // },
            // {
            //   title: "Backup & Restore",
            //   icon: Archive,
            //   href: "/admin/settings/backup",
            // },
          ],
        },
      ]

    case "user":
      return [
        {
          title: "Dashboard",
          icon: Home,
          items: [
            {
              title: "Account Overview",
              icon: Home,
              href: "/user/dashboard/overview",
            },
            {
              title: "Recent Activity",
              icon: Activity,
              href: "/user/dashboard/activity",
            },
            {
              title: "Quick Actions",
              icon: Plus,
              href: "/user/dashboard/actions",
            },
          ],
        },
        {
          title: "My Orders",
          icon: ShoppingBag,
          items: [
            {
              title: "Current Orders",
              icon: ShoppingBag,
              href: "/user/orders/current",
            },
            {
              title: "Order History",
              icon: Clock,
              href: "/user/orders/history",
            },
            { title: "Track Orders", icon: Truck, href: "/user/orders/track" },
            {
              title: "Return & Exchange",
              icon: RefreshCw,
              href: "/user/orders/returns",
            },
            { title: "Order Details", icon: Eye, href: "/user/orders/details" },
          ],
        },
        {
          title: "Wishlist & Favorites",
          icon: Heart,
          items: [
            { title: "My Wishlist", icon: Heart, href: "/user/wishlist" },
            { title: "Favorite Products", icon: Star, href: "/user/favorites" },
            {
              title: "Saved Collections",
              icon: Bookmark,
              href: "/user/collections",
            },
            { title: "Recently Viewed", icon: Eye, href: "/user/recent" },
          ],
        },
        {
          title: "Account Management",
          icon: User,
          items: [
            {
              title: "Profile Settings",
              icon: User,
              href: "/user/account/profile",
            },
            {
              title: "Shipping Addresses",
              icon: Home,
              href: "/user/account/addresses",
            },
            {
              title: "Payment Methods",
              icon: CreditCardIcon,
              href: "/user/account/payment",
            },
            {
              title: "Change Password",
              icon: Key,
              href: "/user/account/password",
            },
            {
              title: "Privacy Settings",
              icon: Shield,
              href: "/user/account/privacy",
            },
          ],
        },
        {
          title: "Notifications",
          icon: Bell,
          items: [
            {
              title: "Order Updates",
              icon: Bell,
              href: "/user/notifications/orders",
            },
            {
              title: "Promotional Offers",
              icon: Gift,
              href: "/user/notifications/offers",
            },
            {
              title: "Account Alerts",
              icon: Shield,
              href: "/user/notifications/alerts",
            },
            {
              title: "Notification Settings",
              icon: Settings,
              href: "/user/notifications/settings",
            },
          ],
        },
        {
          title: "Support & Help",
          icon: HelpCircle,
          items: [
            {
              title: "Help Center",
              icon: HelpCircle,
              href: "/user/support/help",
            },
            {
              title: "Contact Support",
              icon: MessageSquare,
              href: "/user/support/contact",
            },
            {
              title: "Live Chat",
              icon: MessageSquare,
              href: "/user/support/chat",
            },
            { title: "FAQ", icon: FileText, href: "/user/support/faq" },
          ],
        },
      ]

    case "Inventory Manager":
  return [
    {
      title: "Home",
      icon: Home,
      items: [
        {
          title: "Dashboard",
          icon: BarChart3,
          href: "/inventorymanager",
        },
      ],
    },
    {
      title: "Product Management",
      icon: ShoppingBag,
      items: [
        {
          title: "Products",
          icon: Search,
          href: "/productsInventory",
        },
      ],
    },
    {
      title: "Order Management",
      icon: ClipboardList,
      items: [
        {
          title: "All Orders",
          icon: ShoppingCart,
          href: "/orders",
        },
      ],
    },
    {
      title: "Low Stock Alerts",
      icon: AlertTriangle,
      items: [
        {
          title: "View Low Stock",
          icon: Eye,
          href: "/productsInventory?filter=low-stock",
        },
      ],
    },
    {
      title: "Settings",
      icon: Settings,
      items: [
        {
          title: "General Settings",
          icon: Settings,
          href: "/settings",
        },
       
      ],
    },
  ];
  
    default:
      return []
  }
}

export default function DashboardSidebar({ role = "admin", title = "Best Wishes", subtitle }) {
  // Get navigation data based on role
  const navigationData = getNavigationData(role)
  const router = useRouter()

  // Set default subtitle based on role if not provided
  const defaultSubtitle =
    subtitle || (role === "admin" ? "Admin Dashboard" : role === "user" ? "User Portal" : "Customer Dashboard")

  // Set initial open sections based on role
  const getInitialOpenSections = (role) => {
    switch (role) {
      case "admin":
        return ["Dashboard", "Users Management", "Products Management"]
      case "user":
        return ["Dashboard", "My Orders"]
      case "customer":
        return ["Shop", "My Shopping"]
      default:
        return ["Dashboard"]
    }
  }

  const [openSections, setOpenSections] = React.useState(getInitialOpenSections(role))
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  const [activeItem, setActiveItem] = React.useState(navigationData[0]?.items[0]?.title || "")

  const toggleSection = (section) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleItemClick = (itemTitle, href) => {
    setActiveItem(itemTitle)
    setIsMobileOpen(false)
    router.push(href)
  }

  const handleLogout = () => {
    // Implement logout functionality here
    console.log("Logging out...")
    // For demonstration, navigate to login page
    router.push("/login")
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-lg shadow-lg border border-gray-200"
        >
          {isMobileOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
        </button>

        {/* Mobile Overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed md:relative z-40 h-full w-64 bg-white border-r border-gray-200
            transform transition-transform duration-300 ease-in-out
            ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            md:block flex flex-col
          `}
        >
          {/* Header */}
          {title && (
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-black">
                  {role === "admin" ? (
                    <BarChart3 className="h-5 w-5 text-white" />
                  ) : role === "user" ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                    {title}
                  </h1>
                  <p className="text-xs text-gray-500">{defaultSubtitle}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="text-xs font-medium mb-3 uppercase tracking-wide" style={{ color: "var(--primary)" }}>
                Main Navigation
              </div>
              <nav className="space-y-1">
                {navigationData.map((section) => (
                  <div key={section.title}>
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="flex w-full items-center justify-between px-2 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors"
                      style={{ color: "var(--primary)" }}
                    >
                      <div className="flex items-center gap-2">
                        <section.icon className="h-4 w-4" />
                        <span className="font-medium">{section.title}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          openSections.includes(section.title) ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openSections.includes(section.title) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {section.items.map((item) => (
                          <button
                            key={item.title}
                            onClick={() => handleItemClick(item.title, item.href)}
                            className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm rounded transition-colors ${
                              activeItem === item.title
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                            }`}
                          >
                            <item.icon className="h-3 w-3" />
                            <span>{item.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Log Out - Fixed at bottom */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-2 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors"
              style={{ color: "var(--primary)" }}
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
      </div>
    </>
  )
}
