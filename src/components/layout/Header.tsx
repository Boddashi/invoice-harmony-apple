import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../theme/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Check if current route is credit notes related
  const isCreditNotesPage = location.pathname.includes("/creditnotes");

  const getTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Dashboard";
      case "/invoices":
        return "Invoices";
      case "/clients":
        return "Clients";
      case "/settings":
        return "Settings";
      case "/reports":
        return "Reports";
      case "/items":
        return "Items";
      case "/login":
        return "Sign In";
      case "/creditnotes":
        return "Credit Notes";
      default:
        if (location.pathname.startsWith("/invoices/")) {
          return "Invoice Details";
        }
        if (location.pathname.startsWith("/creditnotes/")) {
          return "Credit Note Details";
        }
        if (location.pathname.startsWith("/clients/")) {
          return "Client Details";
        }
        return "Power to the Peppol";
    }
  };

  const isCreatePage = location.pathname === "/invoices/new";
  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return null; // Don't show header on login page
  }

  return (
    <header
      className={cn(
        "w-full h-16 border-b border-border/40 sticky top-0 z-30 flex items-center px-6 backdrop-blur-apple",
        isCreditNotesPage
          ? "bg-gradient-credit-note-header"
          : "bg-gradient-header"
      )}
    >
      <div className="flex justify-between items-center w-full px-3">
        <div className="flex items-center gap-2">
          <img src="/favicon.ico" alt="Power Peppol Logo" className="w-6 h-6" />
          <h1 className="text-2xl font-semibold tracking-tight animate-fade-in">
            {getTitle()}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
