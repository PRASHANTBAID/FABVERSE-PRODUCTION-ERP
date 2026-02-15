import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "@/App";
import { cn } from "@/lib/utils";
import {
  Factory,
  LayoutDashboard,
  Scissors,
  FileSpreadsheet,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/cutting/new", icon: Scissors, label: "New Lot" },
  { path: "/import-export", icon: FileSpreadsheet, label: "Import/Export" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const NavLink = ({ item, active, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
      active
        ? "bg-primary text-primary-foreground"
        : "hover:bg-muted text-muted-foreground hover:text-foreground"
    )}
    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <item.icon className="w-5 h-5" />
    <span className="font-medium">{item.label}</span>
  </Link>
);

const Sidebar = ({ onNavigate }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Factory className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-wider uppercase logo-text">FABVERSE</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              active={location.pathname === item.path || 
                (item.path === "/cutting/new" && location.pathname.startsWith("/cutting")) ||
                (item.path === "/" && location.pathname.startsWith("/lot"))}
              onClick={onNavigate}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-muted-foreground">Theme</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="sidebar-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
        <Separator />
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const closeSidebar = () => setSidebarOpen(false);

  // Get page title based on route
  const getPageTitle = () => {
    if (location.pathname === "/") return "Dashboard";
    if (location.pathname.startsWith("/cutting")) return "Cutting";
    if (location.pathname.startsWith("/lot")) return "Lot Details";
    if (location.pathname.startsWith("/challan")) return "Challan";
    if (location.pathname === "/import-export") return "Import / Export";
    if (location.pathname === "/reports") return "Reports";
    if (location.pathname === "/settings") return "Settings";
    return "FABVERSE";
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card">
        <Sidebar onNavigate={closeSidebar} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onNavigate={closeSidebar} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Top Header */}
        <header className="glass-header h-16 flex items-center gap-4 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {location.pathname !== "/" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              data-testid="back-btn"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          <h2 className="text-xl font-semibold uppercase tracking-wide">{getPageTitle()}</h2>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
