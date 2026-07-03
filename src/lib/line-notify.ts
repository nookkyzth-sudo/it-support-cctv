const LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN;

export async function sendLineNotify(message: string) {
  if (!LINE_NOTIFY_TOKEN) return;

  try {
    await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
      },
      body: new URLSearchParams({ message }),
    });
  } catch (error) {
    console.error("LINE Notify error:", error);
  }
}

export function formatTicketMessage(
  ticket: {
    ticket_id: number;
    branch_name: string;
    category_name: string;
    issue_description: string;
    reporter_name?: string;
  },
  action: "new" | "resolved"
) {
  const emoji = action === "new" ? "🆕" : "✅";
  const header =
    action === "new"
      ? `[แจ้งงานใหม่] #${ticket.ticket_id}`
      : `[ปิดงาน] #${ticket.ticket_id}`;

  return (
    `${emoji} ${header}\n` +
    `สาขา: ${ticket.branch_name}\n` +
    `อุปกรณ์: ${ticket.category_name}\n` +
    `รายละเอียด: ${ticket.issue_description}\n` +
    (ticket.reporter_name ? `ผู้แจ้ง: ${ticket.reporter_name}\n` : "") +
    `ดูรายละเอียด: ${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticket.ticket_id}`
  );
}
