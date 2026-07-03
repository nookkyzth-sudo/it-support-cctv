"use client";

import { useMemo, useState } from "react";
import {
  createBranchAction,
  createCategoryAction,
  deleteBranchAction,
  deleteCategoryAction,
  deleteTicketAdminAction,
  deleteUserAction,
  updateBranchAction,
  updateCategoryAction,
  updateTicketAdminAction,
  updateUserAction,
} from "@/app/actions/admin";
import type { Branch, Category, Ticket, User } from "@/types";

type AdminPanelProps = {
  branches: Branch[];
  categories: Category[];
  users: User[];
  tickets: Ticket[];
};

export function AdminPanel({ branches, categories, users, tickets }: AdminPanelProps) {
  const [userQuery, setUserQuery] = useState("");
  const [ticketQuery, setTicketQuery] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);

  const userPageSize = 10;
  const ticketPageSize = 10;

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, userQuery]);

  const filteredTickets = useMemo(() => {
    const q = ticketQuery.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        String(t.ticket_id).includes(q) ||
        (t.issue_description || "").toLowerCase().includes(q) ||
        (t.branch?.branch_name || "").toLowerCase().includes(q) ||
        (t.category?.category_name || "").toLowerCase().includes(q)
    );
  }, [tickets, ticketQuery]);

  const branchInUse = useMemo(() => {
    const used = new Set<number>();
    tickets.forEach((t) => used.add(t.branch_id));
    users.forEach((u) => {
      if (u.branch_id) used.add(u.branch_id);
    });
    return used;
  }, [tickets, users]);

  const categoryInUse = useMemo(() => {
    const used = new Set<number>();
    tickets.forEach((t) => used.add(t.category_id));
    return used;
  }, [tickets]);

  const userInUse = useMemo(() => {
    const used = new Set<string>();
    tickets.forEach((t) => {
      used.add(t.reporter_id);
      if (t.technician_id) used.add(t.technician_id);
    });
    return used;
  }, [tickets]);

  const userPageCount = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const ticketPageCount = Math.max(1, Math.ceil(filteredTickets.length / ticketPageSize));

  const safeUserPage = Math.min(userPage, userPageCount);
  const safeTicketPage = Math.min(ticketPage, ticketPageCount);

  const pagedUsers = filteredUsers.slice((safeUserPage - 1) * userPageSize, safeUserPage * userPageSize);
  const pagedTickets = filteredTickets.slice((safeTicketPage - 1) * ticketPageSize, safeTicketPage * ticketPageSize);

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-3">จัดการสาขา</h2>
        <form action={createBranchAction} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <input name="branch_name" placeholder="ชื่อสาขาใหม่" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input name="zone" placeholder="โซน (ไม่บังคับ)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm">เพิ่มสาขา</button>
        </form>
        <div className="space-y-2">
          {branches.map((b) => (
            <form key={b.branch_id} action={updateBranchAction} className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <input type="hidden" name="branch_id" value={b.branch_id} />
              <input name="branch_name" defaultValue={b.branch_name} required className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input name="zone" defaultValue={b.zone || ""} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button type="submit" className="rounded-lg border border-gray-300 px-3 py-2 text-sm">บันทึก</button>
              <button
                type="submit"
                formAction={deleteBranchAction}
                disabled={branchInUse.has(b.branch_id)}
                onClick={(e) => {
                  if (!confirm(`ยืนยันลบสาขา ${b.branch_name} ?`)) e.preventDefault();
                }}
                className="rounded-lg border border-red-300 text-red-600 px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {branchInUse.has(b.branch_id) ? "กำลังใช้งาน" : "ลบ"}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-3">จัดการประเภทอุปกรณ์</h2>
        <form action={createCategoryAction} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <input name="category_name" placeholder="ประเภทใหม่" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <div />
          <button type="submit" className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm">เพิ่มประเภท</button>
        </form>
        <div className="space-y-2">
          {categories.map((c) => (
            <form key={c.category_id} action={updateCategoryAction} className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <input type="hidden" name="category_id" value={c.category_id} />
              <input name="category_name" defaultValue={c.category_name} required className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <div />
              <button type="submit" className="rounded-lg border border-gray-300 px-3 py-2 text-sm">บันทึก</button>
              <button
                type="submit"
                formAction={deleteCategoryAction}
                disabled={categoryInUse.has(c.category_id)}
                onClick={(e) => {
                  if (!confirm(`ยืนยันลบประเภท ${c.category_name} ?`)) e.preventDefault();
                }}
                className="rounded-lg border border-red-300 text-red-600 px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {categoryInUse.has(c.category_id) ? "กำลังใช้งาน" : "ลบ"}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold">จัดการผู้ใช้</h2>
          <input
            value={userQuery}
            onChange={(e) => {
              setUserQuery(e.target.value);
              setUserPage(1);
            }}
            placeholder="ค้นหาผู้ใช้: ชื่อ/อีเมล/สิทธิ์"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full md:w-80"
          />
        </div>
        <div className="space-y-2">
          {pagedUsers.map((u) => (
            <form key={u.user_id} action={updateUserAction} className="grid grid-cols-1 md:grid-cols-7 gap-2">
              <input type="hidden" name="user_id" value={u.user_id} />
              <input name="name" defaultValue={u.name} required className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input name="email" defaultValue={u.email || ""} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="email" />
              <select name="role" defaultValue={u.role} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="staff">staff</option>
                <option value="technician">technician</option>
                <option value="admin">admin</option>
              </select>
              <select name="branch_id" defaultValue={u.branch_id?.toString() || ""} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">ไม่ระบุสาขา</option>
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                ))}
              </select>
              <button type="submit" className="rounded-lg border border-gray-300 px-3 py-2 text-sm">บันทึก</button>
              <button
                type="submit"
                formAction={deleteUserAction}
                disabled={userInUse.has(u.user_id)}
                onClick={(e) => {
                  if (!confirm(`ยืนยันลบผู้ใช้ ${u.name} ?`)) e.preventDefault();
                }}
                className="rounded-lg border border-red-300 text-red-600 px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {userInUse.has(u.user_id) ? "กำลังใช้งาน" : "ลบ"}
              </button>
            </form>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            type="button"
            disabled={userPage <= 1}
            onClick={() => setUserPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            ก่อนหน้า
          </button>
          <span className="text-sm text-gray-600">หน้า {safeUserPage}/{userPageCount}</span>
          <button
            type="button"
            disabled={userPage >= userPageCount}
            onClick={() => setUserPage((p) => Math.min(userPageCount, p + 1))}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold">จัดการงานซ่อมล่าสุด</h2>
          <input
            value={ticketQuery}
            onChange={(e) => {
              setTicketQuery(e.target.value);
              setTicketPage(1);
            }}
            placeholder="ค้นหางาน: เลขตั๋ว/สาขา/ประเภท/อาการ"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full md:w-80"
          />
        </div>
        <div className="space-y-2">
          {pagedTickets.map((t) => (
            <form key={t.ticket_id} action={updateTicketAdminAction} className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <input type="hidden" name="ticket_id" value={t.ticket_id} />
              <div className="md:col-span-1 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-600">#{t.ticket_id}</div>
              <select name="branch_id" defaultValue={String(t.branch_id)} className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                ))}
              </select>
              <select name="category_id" defaultValue={String(t.category_id)} className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
              <input name="issue_description" defaultValue={t.issue_description} required className="md:col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <select name="status" defaultValue={t.status} className="md:col-span-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="Pending">Pending</option>
                <option value="In_Progress">In_Progress</option>
                <option value="Claim">Claim</option>
                <option value="Resolved">Resolved</option>
              </select>
              <input type="date" name="report_date" defaultValue={new Date(t.report_date).toISOString().slice(0, 10)} className="md:col-span-1 border border-gray-300 rounded-lg px-2 py-2 text-sm" />
              <input type="date" name="resolved_date" defaultValue={t.resolved_date ? new Date(t.resolved_date).toISOString().slice(0, 10) : ""} className="md:col-span-1 border border-gray-300 rounded-lg px-2 py-2 text-sm" />
              <input name="technician_note" defaultValue={t.technician_note || ""} className="md:col-span-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="หมายเหตุ" />
              <button type="submit" className="md:col-span-1 rounded-lg border border-gray-300 px-2 py-2 text-sm">บันทึก</button>
              <button
                type="submit"
                formAction={deleteTicketAdminAction}
                onClick={(e) => {
                  if (!confirm(`ยืนยันลบงาน #${t.ticket_id} ?`)) e.preventDefault();
                }}
                className="md:col-span-1 rounded-lg border border-red-300 text-red-600 px-2 py-2 text-sm"
              >
                ลบ
              </button>
            </form>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            type="button"
            disabled={ticketPage <= 1}
            onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            ก่อนหน้า
          </button>
          <span className="text-sm text-gray-600">หน้า {safeTicketPage}/{ticketPageCount}</span>
          <button
            type="button"
            disabled={ticketPage >= ticketPageCount}
            onClick={() => setTicketPage((p) => Math.min(ticketPageCount, p + 1))}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      </section>
    </div>
  );
}
