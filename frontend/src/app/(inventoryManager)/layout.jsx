
import DashboardSidebar from '../components/sidebar/Sidebar';

export default function RootLayout({ children }) {
  return (
    <>
      <div className="flex h-screen">
        <DashboardSidebar role="Inventory Manager" title="Best Wishes" subtitle />
        <div className="flex-1 p-8 overflow-auto">
          
          {children}
        </div>
      </div>
    </>
  );
}
