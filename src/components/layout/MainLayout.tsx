
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/ui/sidebar";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={cn("flex flex-col items-center gap-1", {
      "text-primary": isActive,
      "text-foreground": !isActive,
    })}>
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isMobile && moreMenuOpen) {
      setMoreMenuOpen(false);
    }
  }, [isMobile, moreMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const mobileNavItems = [
    { icon: <Home size={20} />, label: "Home", to: "/" },
    { icon: <FileText size={20} />, label: "Tasks", to: "/tasks" },
    { icon: <Users size={20} />, label: "Clients", to: "/clients" },
    { icon: <BarChart2 size={20} />, label: "Reports", to: "/reports" },
  ];

  const moreMenuItems = [
    { icon: <Settings size={20} />, label: "Settings", to: "/settings" },
    { icon: <PlusCircle size={20} />, label: "Create Task", to: "/tasks/create" },
    { icon: <ShoppingBag size={20} />, label: "Billing", to: "/billing" },
    { icon: <LogOut size={20} />, label: "Logout", onClick: handleLogout },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-purple dark:bg-gradient-purple-dark">
      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header section */}
        <header className="fixed top-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-md border-b z-20">
          <div className="container max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-6">
            <Link to="/" className="font-bold text-xl">
              Taskify
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button
                onClick={() => setMoreMenuOpen(true)}
                className="md:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-4 md:p-6 pt-20 md:pt-24 pb-20 md:pb-6 overflow-auto">
          {children}
        </main>

        {/* Mobile navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-t flex items-center justify-around z-10">
          {mobileNavItems.map((item, index) => (
            <NavItem key={index} {...item} />
          ))}
          <Button onClick={() => setMoreMenuOpen(true)} variant="ghost">
            <Menu className="w-6 h-6" />
          </Button>
        </nav>
      </div>

      <Dialog open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <DialogContent
          className="md:hidden p-0 border-none max-w-full h-[100vh] rounded-t-xl rounded-b-none bottom-0 top-auto translate-y-0 data-[state=closed]:animate-slide-out-down data-[state=open]:animate-slide-in-up"
          hideCloseButton={true}
        >
          <div className="flex flex-col h-full bg-gradient-sidebar ">
            <div className="flex items-center justify-between p-4 border-b">
              <DialogTitle>More</DialogTitle>
              <Button
                onClick={() => setMoreMenuOpen(false)}
                variant="ghost"
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-col flex-grow">
              {moreMenuItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="justify-start rounded-none py-3.5 px-5 hover:bg-secondary/50"
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else {
                      navigate(item.to);
                      setMoreMenuOpen(false);
                    }
                  }}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Button>
              ))}
            </div>
            <div className="p-4">
              <ThemeToggle />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainLayout;
