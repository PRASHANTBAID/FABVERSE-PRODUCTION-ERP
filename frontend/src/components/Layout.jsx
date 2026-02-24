import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, api } from "@/App";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  Upload,
  Lock,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/lots", icon: Package, label: "Lots" },
  { path: "/challans", icon: FileText, label: "Challans" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
  { path: "/import-export", icon: Upload, label: "Import/Export" },
  { path: "/settings", icon: Settings, label: "Settings" },
  { path: "/change-password", icon: Lock, label: "Change Password" },
];

const NavLink = ({ item, active, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
      active
        ? "bg-[#1e3a5f] text-white"
        : "text-blue-100 hover:bg-[#1e3a5f]/50 hover:text-white"
    )}
    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <item.icon className="w-5 h-5" />
    <span>{item.label}</span>
  </Link>
);

const Sidebar = ({ onNavigate, firmSettings }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e3a8a]">
      {/* Logo */}
      <div className="p-5 border-b border-blue-800/50">
        <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
          {firmSettings?.logo_url ? (
            <img 
              src={firmSettings.logo_url} 
              alt="Logo"
              className="w-10 h-10 object-contain rounded-lg bg-white/10"
            />
          ) : (
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">$</span>
            </div>
          )}
          <div>
            <span className="text-xl font-bold text-white tracking-wide">
              {firmSettings?.firm_name || "FABVERSE"}
            </span>
            <p className="text-xs text-blue-200">Production ERP</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              active={isActive(item.path)}
              onClick={onNavigate}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="p-4 border-t border-blue-800/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.username?.charAt(0).toUpperCase() || "A"}
          </div>
          <span className="text-white font-medium text-sm">{user?.username || "admin"}</span>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-blue-200 hover:text-white hover:bg-blue-800/50"
          onClick={logout}
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [firmSettings, setFirmSettings] = useState(null);

  useEffect(() => {
    const fetchFirmSettings = async () => {
      try {
        const res = await api.get("/settings/firm");
        setFirmSettings(res.data);
      } catch (error) {
        console.error("Failed to fetch firm settings");
      }
    };
    fetchFirmSettings();
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-[#e8f4fc]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar onNavigate={closeSidebar} firmSettings={firmSettings} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-56 border-0">
          <Sidebar onNavigate={closeSidebar} firmSettings={firmSettings} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:pl-56">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[#1e3a8a] h-14 flex items-center px-4 sticky top-0 z-40">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-blue-800"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="ml-3 text-white font-bold">FABVERSE</span>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
