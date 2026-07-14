"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";
import { Lock } from "lucide-react";

export function ProfileForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, null);

  return (
    <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
          <Lock size={20} />
        </div>
        <h2 className="text-xl font-bold text-[#2B3674]">เปลี่ยนรหัสผ่าน</h2>
      </div>

      <form action={formAction} className="space-y-4 max-w-md">
        {state?.error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg font-medium border border-red-100">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg font-medium border border-green-100">
            {state.success}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-[#2B3674] mb-2">
            รหัสผ่านใหม่
          </label>
          <input
            type="password"
            name="newPassword"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/20 outline-none transition-all text-sm"
            placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#2B3674] mb-2">
            ยืนยันรหัสผ่านใหม่
          </label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/20 outline-none transition-all text-sm"
            placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#4318FF] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center h-12 mt-4"
        >
          {isPending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "บันทึกรหัสผ่านใหม่"
          )}
        </button>
      </form>
    </div>
  );
}
