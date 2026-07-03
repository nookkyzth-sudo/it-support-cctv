"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

export function NavBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/repairs", label: "ข้อมูลการซ่อม" },
    { href: "/report", label: "แจ้งซ่อม" },
    ...(isAdmin ? [{ href: "/admin", label: "จัดการระบบ" }] : []),
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="font-bold text-gray-900 text-lg"
            >
              IT Support
            </Link>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
