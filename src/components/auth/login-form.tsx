"use client";

import { useActionState, useState } from "react";
import { login, signup } from "@/app/actions/auth";

export function LoginForm() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(login, null);
  const [signupState, signupAction, signupPending] = useActionState(signup, null);

  return (
    <div>
      {/* Tabs */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "login"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          onClick={() => setTab("signup")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "signup"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          สมัครสมาชิก
        </button>
      </div>

      {/* Login Form */}
      {tab === "login" && (
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมลหรือชื่อผู้ใช้
            </label>
            <input
              name="identifier"
              type="text"
              required
              placeholder="อีเมล หรือ ชื่อผู้ใช้"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          {loginState?.error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {loginState.error}
            </div>
          )}
          <button
            type="submit"
            disabled={loginPending}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loginPending ? "กำลังเข้า..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      )}

      {/* Signup Form */}
      {tab === "signup" && (
        <form action={signupAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อผู้ใช้ (สำหรับ login)
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="เช่น สมชาย หรือ somchai"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          {signupState?.error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {signupState.error}
            </div>
          )}
          <button
            type="submit"
            disabled={signupPending}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {signupPending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>
      )}
    </div>
  );
}
