"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { 
  LayoutDashboard, 
  Wrench, 
  PlusCircle, 
  ShoppingCart, 
  Settings,
  LogOut,
  HardDrive,
  Users
} from "lucide-react";

export function SideBar({ 
  isAdmin = false, 
  userEmail = "User",
  userRole = "staff"
}: { 
  isAdmin?: boolean, 
  userEmail?: string,
  userRole?: string
}) {
  const pathname = usePathname();

  const menuGroups = [
    {
      title: "MENU",
      links: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/repairs", label: "ข้อมูลการซ่อม", icon: Wrench },
        { href: "/report", label: "แจ้งซ่อม", icon: PlusCircle },
        { href: "/purchases", label: "จดบันทึกแจ้งซื้อ", icon: ShoppingCart },
        { href: "/installations", label: "บันทึกการติดตั้ง", icon: HardDrive },
      ]
    },
    ...((userRole === "technician" || userRole === "admin") ? [{
      title: "TEAM",
      links: [
        { href: "/team", label: "ข้อมูลบุคลากร", icon: Users },
      ]
    }] : []),
    ...(isAdmin ? [{
      title: "ADMIN",
      links: [
        { href: "/admin", label: "จัดการระบบ", icon: Settings },
      ]
    }] : [])
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
      {/* Brand & Profile */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            IT
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">IT Support</h1>
            <p className="text-xs text-gray-500 truncate w-32">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-3 text-xs font-semibold text-gray-400 mb-3 tracking-wider uppercase">
              {group.title}
            </h3>
            <ul className="space-y-1.5">
              {group.links.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                const Icon = link.icon;
                
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? "bg-[#F4F7FE] text-blue-600 font-medium shadow-sm" 
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-blue-600" : "text-gray-400"} />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer (Logout) */}
      <div className="p-4 border-t border-gray-100">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} strokeWidth={2} />
            <span className="font-medium">ออกจากระบบ</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
