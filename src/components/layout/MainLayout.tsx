
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  FileText,
  Users,
  Settings,
  LogOut,
  Package,
  MoreHorizontal,
  X,
  BarChart,
  FileMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "./Header";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Check if current route is credit notes related
  const isCreditNotesPage = location.pathname.includes('/creditnotes');

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to access this page");
      navigate("/login");
    }
  }, [user, navigate]);

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", href: "/" },
    { icon: FileText, label: "Invoices", href: "/invoices" },
    { icon: FileMinus, label: "Credit Notes", href: "/creditnotes" },
    { icon: Users, label: "Clients", href: "/clients" },
    { icon: Package, label: "Items", href: "/items" },
    { icon: BarChart, label: "Reports", href: "/reports" },
  ];

  const moreNavItems = [
    { icon: FileText, label: "Invoices", href: "/invoices" },
    { icon: FileMinus, label: "Credit Notes", href: "/creditnotes" },
    { icon: Users, label: "Clients", href: "/clients" },
    { icon: Package, label: "Items", href: "/items" },
    { icon: BarChart, label: "Reports", href: "/reports" },
    {
      icon: LogOut,
      label: "Sign Out",
      href: null,
      onClick: () => {
        signOut();
        setMoreMenuOpen(false);
      },
    },
  ];

  const handleLogout = () => {
    signOut();
  };

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
    <div className={cn("min-h-screen flex flex-col w-full", isCreditNotesPage && "credit-note-page")}>
      <Header />

      <div className="flex flex-1 w-full">
        <nav className={cn(
          "hidden md:block w-64 border-r h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0 backdrop-blur-sm",
          isCreditNotesPage 
            ? "border-red-200/40 bg-gradient-to-b from-red-50/80 to-red-100/80 dark:border-red-900/40 dark:from-red-950/80 dark:to-red-900/80" 
            : "border-border/40 bg-gradient-sidebar"
        )}>
          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col p-4 gap-2">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/" &&
                    location.pathname.startsWith(item.href));
                const Icon = item.icon;
                
                // Special styling for credit notes link when on credit notes pages
                const isCreditNoteLink = item.href === "/creditnotes";
                const creditNoteActiveStyle = isCreditNotesPage && isCreditNoteLink;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? creditNoteActiveStyle 
                          ? "bg-red-100/30 text-red-700 font-medium dark:bg-red-900/30 dark:text-red-400"
                          : "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
                        : creditNoteActiveStyle
                          ? "text-red-600/70 hover:bg-red-100/50 hover:text-red-700 dark:text-red-400/70 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon
                      size={20}
                      className={cn(
                        isActive
                          ? creditNoteActiveStyle
                            ? "text-red-700 dark:text-red-400"
                            : "text-sidebar-primary"
                          : creditNoteActiveStyle
                            ? "text-red-600/70 dark:text-red-400/70"
                            : "text-sidebar-foreground/70"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <Link
                to="/settings"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  location.pathname === "/settings"
                    ? isCreditNotesPage
                      ? "bg-red-100/30 text-red-700 font-medium dark:bg-red-900/30 dark:text-red-400" 
                      : "bg-sidebar-primary/10 text-sidebar-primary font-medium"
                    : isCreditNotesPage
                      ? "text-red-600/70 hover:bg-red-100/50 hover:text-red-700 dark:text-red-400/70 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                )}
              >
                <Settings
                  size={20}
                  className={cn(
                    location.pathname === "/settings"
                      ? isCreditNotesPage
                        ? "text-red-700 dark:text-red-400"
                        : "text-sidebar-primary"
                      : isCreditNotesPage
                        ? "text-red-600/70 dark:text-red-400/70"
                        : "text-sidebar-foreground/70"
                  )}
                />
                <span>Settings</span>
              </Link>
            </div>

            <div className={cn(
              "p-4 mt-auto border-t",
              isCreditNotesPage 
                ? "border-red-200 dark:border-red-900/50" 
                : "border-sidebar-border"
            )}>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200",
                  isCreditNotesPage
                    ? "text-red-600/70 hover:bg-red-100/50 hover:text-red-700 dark:text-red-400/70 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                )}
              >
                <LogOut size={20} className={cn(
                  isCreditNotesPage
                    ? "text-red-600/70 dark:text-red-400/70"
                    : "text-sidebar-foreground/70"
                )} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-6 md:p-8 pb-20 md:pb-8 w-full">
          <div className="max-w-none animate-fade-in">{children}</div>
        </main>
      </div>

      {/* Bottom navigation - hidden when more menu is open */}
      {!moreMenuOpen && (
        <div className={cn(
          "fixed bottom-0 left-0 right-0 h-20 backdrop-blur-apple border-t flex md:hidden z-30",
          isCreditNotesPage 
            ? "border-red-200 bg-gradient-to-r from-red-50/80 to-red-100/80 dark:border-red-900/40 dark:from-red-950/80 dark:to-red-900/80" 
            : "border-sidebar-border bg-gradient-sidebar"
        )}>
          <Link
            to="/settings"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1.5 transition-all px-3",
              location.pathname === "/settings"
                ? isCreditNotesPage
                  ? "text-red-700 dark:text-red-400"
                  : "text-sidebar-primary"
                : isCreditNotesPage
                  ? "text-red-600/70 dark:text-red-400/70"
                  : "text-sidebar-foreground/70"
            )}
          >
            <Settings size={22} />
            <span className="text-xs font-medium">Settings</span>
          </Link>

          <Link
            to="/"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1.5 transition-all px-3",
              location.pathname === "/"
                ? isCreditNotesPage
                  ? "text-red-700 dark:text-red-400"
                  : "text-sidebar-primary"
                : isCreditNotesPage
                  ? "text-red-600/70 dark:text-red-400/70"
                  : "text-sidebar-foreground/70"
            )}
          >
            <LayoutGrid size={22} />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>

          <button
            onClick={toggleMoreMenu}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1.5 px-3 focus:outline-none",
              isCreditNotesPage
                ? "text-red-600/70 dark:text-red-400/70"
                : "text-sidebar-foreground/70"
            )}
          >
            <MoreHorizontal size={22} />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      )}

      <Dialog open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <DialogContent
          className={cn(
            "md:hidden p-0 border-none max-w-full h-[100vh] rounded-t-xl rounded-b-none bottom-0 top-auto translate-y-0 data-[state=open]:animate-slide-in-up data-[state=closed]:animate-slide-out-down",
            isCreditNotesPage 
              ? "bg-gradient-to-b from-red-50 to-red-100 dark:from-red-950 dark:to-red-900" 
              : "bg-gradient-sidebar"
          )}
          hideCloseButton={true}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse">
              {moreNavItems.map((item, index) => {
                const Icon = item.icon;
                const isActive =
                  item.href &&
                  (location.pathname === item.href ||
                    (item.href !== "/" &&
                      location.pathname.startsWith(item.href)));
                      
                // Special styling for credit notes link when on credit notes pages
                const isCreditNoteLink = item.href === "/creditnotes";
                const creditNoteActiveStyle = isCreditNotesPage && isCreditNoteLink;

                return (
                  <button
                    key={item.label + index}
                    onClick={() => handleMoreItemClick(item.href, item.onClick)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-5 mb-2 rounded-lg transition-colors",
                      isActive
                        ? creditNoteActiveStyle 
                          ? "bg-red-100/30 text-red-700 font-medium dark:bg-red-900/30 dark:text-red-400"
                          : "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
                        : creditNoteActiveStyle
                          ? "text-red-600/70 hover:bg-red-100/50 hover:text-red-700 dark:text-red-400/70 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon
                      size={24}
                      className={cn(
                        isActive
                          ? creditNoteActiveStyle
                            ? "text-red-700 dark:text-red-400"
                            : "text-sidebar-primary"
                          : creditNoteActiveStyle
                            ? "text-red-600/70 dark:text-red-400/70" 
                            : ""
                      )}
                    />
                    <span className="text-base">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className={cn(
              "flex items-center justify-between p-4 border-b",
              isCreditNotesPage 
                ? "border-red-200 dark:border-red-900/50" 
                : "border-sidebar-border"
            )}>
              <h2 className={cn(
                "text-lg font-semibold",
                isCreditNotesPage && "text-red-700 dark:text-red-400"
              )}>More Options</h2>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className={cn(
                  "p-2 rounded-full",
                  isCreditNotesPage 
                    ? "hover:bg-red-100/50 text-red-700 dark:hover:bg-red-900/50 dark:text-red-400" 
                    : "hover:bg-sidebar-accent/20"
                )}
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainLayout;
