"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase-server";

export async function deleteTicketAttachment(attachmentId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const adminClient = await createAdminClient();
  const { data: attachment } = await adminClient
    .from("ticket_attachments")
    .select("*, tickets(reporter_id)")
    .eq("attachment_id", attachmentId)
    .single();

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  const { data: dbUser } = await adminClient
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (dbUser?.role !== "admin" && attachment.tickets?.reporter_id !== user.id) {
    throw new Error("Forbidden");
  }

  try {
    const urlObj = new URL(attachment.file_path);
    const pathParts = urlObj.pathname.split('/ticket-images/');
    const storagePath = pathParts.length > 1 ? pathParts[1] : null;

    if (storagePath) {
      await adminClient.storage.from("ticket-images").remove([storagePath]);
    }
  } catch (err) {
    console.error("Failed to delete from storage:", err);
  }

  await adminClient
    .from("ticket_attachments")
    .delete()
    .eq("attachment_id", attachmentId);

  revalidatePath(`/tickets/${attachment.ticket_id}`);
  return { success: true };
}
