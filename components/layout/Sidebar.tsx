// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Activity, 
  Users, 
  CheckSquare, 
  Settings,
  Hexagon,
  ClipboardCheck,
  UserCircle,
  LogOut,
  ShieldCheck,
  Contact // <-- Added the new Contact icon for the Directory
} from "lucide-react";
import { signOutAction } from "@/actions/auth";

type SidebarProps = {
  userRole: string;
  userName: string;
  orgName: string;
};

export default function Sidebar({ userRole, userName, orgName }: SidebarProps) {
  const pathname = usePathname();

  const adminNav = [
    { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    { name: "Manager Approvals", href: "/app/requests", icon: ShieldCheck },
    { name: "Directory", href: "/app/directory", icon: Contact }, // <-- THE NEW DIRECTORY LINK
    { name: "Active Workflows", href: "/app/workflows", icon: Activity },
    { name: "IT Tasks", href: "/app/tasks", icon: CheckSquare },
    { name: "HR Tasks", href: "/app/hr-tasks", icon: ClipboardCheck },
    { name: "Profiles", href: "/app/profiles", icon: Users },
    { name: "Settings", href: "/app/settings", icon: Settings },
  ];

  const employeeNav = [
    { name: "My Onboarding", href: "/app/dashboard", icon: LayoutDashboard },
  ];

  const navigation = userRole === "EMPLOYEE" ? employeeNav : adminNav;

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl">
      <div className="flex h-16 items-center gap-2 px-6 font-bold text-xl tracking-tight border-b border-slate-800">
        <Hexagon className="h-6 w-6 text-blue-500 fill-blue-500/20" />
        <span>Harmony OP</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center justify-between rounded-md bg-slate-800/50 p-3 border border-slate-700/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex flex-col truncate pr-2">
              <span className="text-sm font-medium text-white truncate">{userName}</span>
              <span className="text-xs text-slate-400 truncate">{userRole === "EMPLOYEE" ? orgName : `Admin • ${orgName}`}</span>
            </div>
          </div>
          
          <form action={signOutAction}>
            <button 
              type="submit" 
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}