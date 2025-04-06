
import { useState, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Home,
  Menu,
  MessageSquare,
  PackageOpen,
  PieChart,
  Settings,
  Stethoscope,
  Users,
  X
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  path: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, path, active, onClick }: SidebarItemProps) => (
  <Link
    to={path}
    className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      active
        ? "bg-dental-primary text-white"
        : "hover:bg-dental-light dark:hover:bg-gray-800"
    )}
    onClick={onClick}
  >
    <div className="flex-shrink-0 w-5 h-5">{icon}</div>
    <span>{label}</span>
  </Link>
);

interface SidebarSectionProps {
  title?: string;
  children: ReactNode;
}

const SidebarSection = ({ title, children }: SidebarSectionProps) => (
  <div className="space-y-1">
    {title && (
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
        {title}
      </h3>
    )}
    {children}
  </div>
);

interface SidebarLayoutProps {
  children: ReactNode;
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const mainNavigationItems = [
    { path: "/", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { path: "/patients", label: "Pacientes", icon: <Users className="h-5 w-5" /> },
    { path: "/appointments", label: "Citas", icon: <Calendar className="h-5 w-5" /> },
    { path: "/odontogram", label: "Odontograma", icon: <ClipboardList className="h-5 w-5" /> },
    { path: "/treatments", label: "Tratamientos", icon: <Stethoscope className="h-5 w-5" /> },
    { path: "/billing", label: "Facturación", icon: <FileSpreadsheet className="h-5 w-5" /> },
  ];

  const communicationItems = [
    { path: "/communication", label: "Comunicación", icon: <MessageSquare className="h-5 w-5" /> },
    { path: "/reports", label: "Reportes", icon: <PieChart className="h-5 w-5" /> },
  ];

  const inventoryItems = [
    { path: "/inventory", label: "Inventario", icon: <PackageOpen className="h-5 w-5" /> },
  ];
  
  const settingsItems = [
    { path: "/settings", label: "Configuración", icon: <Settings className="h-5 w-5" /> },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-900 transition-all border-r",
          collapsed ? "w-16" : "w-64",
          isMobile && !mobileOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b">
            {!collapsed && !isMobile && (
              <div className="flex items-center">
                <span className="font-bold text-lg text-dental-secondary">Dental Spark</span>
              </div>
            )}
            {isMobile ? (
              <Button variant="ghost" size="icon" onClick={closeMobileSidebar} className="ml-auto">
                <X className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                {collapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>

          {/* Sidebar content */}
          <div className="flex-1 py-4 px-2 overflow-y-auto">
            <div className="space-y-6">
              {/* Main section */}
              <SidebarSection title={collapsed && !isMobile ? undefined : "Principal"}>
                {mainNavigationItems.map((item) => (
                  <SidebarItem
                    key={item.path}
                    icon={item.icon}
                    label={collapsed && !isMobile ? "" : item.label}
                    path={item.path}
                    active={location.pathname === item.path}
                    onClick={closeMobileSidebar}
                  />
                ))}
              </SidebarSection>

              {/* Communication section */}
              <SidebarSection title={collapsed && !isMobile ? undefined : "Comunicación y Reportes"}>
                {communicationItems.map((item) => (
                  <SidebarItem
                    key={item.path}
                    icon={item.icon}
                    label={collapsed && !isMobile ? "" : item.label}
                    path={item.path}
                    active={location.pathname === item.path}
                    onClick={closeMobileSidebar}
                  />
                ))}
              </SidebarSection>

              {/* Inventory section */}
              <SidebarSection title={collapsed && !isMobile ? undefined : "Inventario"}>
                {inventoryItems.map((item) => (
                  <SidebarItem
                    key={item.path}
                    icon={item.icon}
                    label={collapsed && !isMobile ? "" : item.label}
                    path={item.path}
                    active={location.pathname === item.path}
                    onClick={closeMobileSidebar}
                  />
                ))}
              </SidebarSection>
              
              {/* Settings section */}
              <SidebarSection title={collapsed && !isMobile ? undefined : "Configuración"}>
                {settingsItems.map((item) => (
                  <SidebarItem
                    key={item.path}
                    icon={item.icon}
                    label={collapsed && !isMobile ? "" : item.label}
                    path={item.path}
                    active={location.pathname === item.path}
                    onClick={closeMobileSidebar}
                  />
                ))}
              </SidebarSection>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 transition-all",
          !isMobile && (collapsed ? "ml-16" : "ml-64")
        )}
      >
        {/* Top nav for mobile */}
        <header className="sticky top-0 z-30 flex items-center px-4 h-14 bg-white dark:bg-gray-900 border-b md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMobileSidebar} className="mr-2">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-lg text-dental-secondary">Dental Spark</span>
        </header>

        {/* Page content */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
};

export default SidebarLayout;
