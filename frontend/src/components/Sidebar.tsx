import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, t }) => {
  const location = useLocation();
  const navItems = [
    {
      path: "/dashboard",
      icon: LayoutDashboard,
      label: t("dashboard"),
    },
    {
      path: "/surveys",
      icon: FileText,
      label: t("surveys"),
    },
    {
      path: "/analytics",
      icon: BarChart3,
      label: t("analytics"),
    },
    {
      path: "/members",
      icon: Users,
      label: t("members"),
    },
    {
      path: "/settings",
      icon: Settings,
      label: t("settings"),
    },
  ];
  return (
    <>
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        )}
      </button>
      <aside
        className={`
          fixed lg:sticky lg:top-20 
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          transition-transform duration-300 ease-in-out
          z-40 lg:z-auto
          left-0 top-0 h-full lg:h-auto
          w-64 lg:w-full
          bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700 lg:border-0
          p-4 lg:p-0
          lg:bg-transparent
        `}
      >
        <nav className="mt-16 lg:mt-0" aria-label="Primary navigation">
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => onToggle()}
                    className={`
                      w-full inline-flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium
                      transition-all duration-200 
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600"
                      }
                    `}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
    </>
  );
};
export default Sidebar;
