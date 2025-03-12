
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, FileText, Users, Settings, LogOut, Package, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Header from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      toast.error('Please log in to access this page');
      navigate('/login');
    }
  }, [user, navigate]);

  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/' },
    { icon: FileText, label: 'Invoices', href: '/invoices' },
    { icon: Users, label: 'Clients', href: '/clients' },
    { icon: Package, label: 'Items', href: '/items' },
  ];

  // Navigation items to display in the "More" fullscreen menu on mobile
  const moreNavItems = [
    { icon: FileText, label: 'Invoices', href: '/invoices' },
    { icon: Users, label: 'Clients', href: '/clients' },
    { icon: Package, label: 'Items', href: '/items' },
    { icon: LogOut, label: 'Sign Out', href: null, onClick: () => { signOut(); setMoreMenuOpen(false); } },
  ];

  const handleLogout = () => {
    signOut();
  };

  // If we're still checking authentication or user is not authenticated, don't render the layout
  if (!user) {
    return null;
  }

  const toggleMoreMenu = () => {
    setMoreMenuOpen(!moreMenuOpen);
  };

  const handleMoreItemClick = (href: string | null, onClick?: () => void) => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
      setMoreMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <Header />
      
      <div className="flex flex-1 w-full">
        {/* Navigation sidebar - fixed on desktop */}
        <nav className="hidden md:block w-64 border-r border-border/40 h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0 bg-sidebar text-sidebar-foreground">
          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col p-4 gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon size={20} className={cn(isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Settings link in the sidebar only */}
              <Link
                to="/settings"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  location.pathname === "/settings" 
                    ? "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                )}
              >
                <Settings size={20} className={cn(location.pathname === "/settings" ? "text-sidebar-primary" : "text-sidebar-foreground/70")} />
                <span>Settings</span>
              </Link>
            </div>
            
            {/* Sign out button at bottom of sidebar */}
            <div className="p-4 mt-auto border-t border-sidebar-border">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground transition-all duration-200"
              >
                <LogOut size={20} className="text-sidebar-foreground/70" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>
        
        {/* Main content area - takes remaining width */}
        <main className="flex-1 p-6 md:p-8 pb-20 md:pb-8 w-full">
          <div className="max-w-none animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile bottom navbar */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-sidebar/90 backdrop-blur-apple border-t border-sidebar-border flex md:hidden z-30">
        {/* Left side - Settings */}
        <Link
          to="/settings"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1.5 transition-all px-3",
            location.pathname === "/settings" ? "text-sidebar-primary" : "text-sidebar-foreground/70"
          )}
        >
          <Settings size={22} />
          <span className="text-xs font-medium">Settings</span>
        </Link>
        
        {/* Center - Dashboard */}
        <Link
          to="/"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1.5 transition-all px-3",
            location.pathname === "/" ? "text-sidebar-primary" : "text-sidebar-foreground/70"
          )}
        >
          <LayoutGrid size={22} />
          <span className="text-xs font-medium">Dashboard</span>
        </Link>

        {/* Right side - More button */}
        <button
          onClick={toggleMoreMenu}
          className="flex flex-1 flex-col items-center justify-center gap-1.5 text-sidebar-foreground/70 px-3 focus:outline-none"
        >
          <MoreHorizontal size={22} />
          <span className="text-xs font-medium">More</span>
        </button>

        {/* Custom Dialog for More menu that slides from bottom */}
        <Dialog open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
          <DialogContent 
            className="md:hidden p-0 border-none max-w-full h-[calc(100vh-5rem)] rounded-t-xl rounded-b-none bottom-20 top-auto translate-y-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
            hideCloseButton={true} // Hide the default close button
          >
            <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <h2 className="text-lg font-semibold">More Options</h2>
                <button 
                  onClick={() => setMoreMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-sidebar-accent/20"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {moreNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = item.href && (location.pathname === item.href || 
                    (item.href !== '/' && location.pathname.startsWith(item.href)));
                  
                  return (
                    <button
                      key={item.label + index}
                      onClick={() => handleMoreItemClick(item.href, item.onClick)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-5 mb-2 rounded-lg transition-colors",
                        isActive 
                          ? "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon size={24} className={isActive ? "text-sidebar-primary" : ""} />
                      <span className="text-base">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MainLayout;
