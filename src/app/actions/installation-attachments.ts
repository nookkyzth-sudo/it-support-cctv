"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function deleteInstallationAttachment(attachmentId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const attachment = await prisma.installation_attachments.findUnique({
    where: { attachment_id: attachmentId },
    include: { installation: true }
  });

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  const dbUser = await prisma.users.findUnique({ where: { user_id: user.id } });
  if (dbUser?.role !== "admin" && attachment.installation.recorded_by !== user.id) {
    throw new Error("Forbidden");
  }

  try {
    const urlObj = new URL(attachment.file_path);
    const pathParts = urlObj.pathname.split('/ticket-images/');
    const storagePath = pathParts.length > 1 ? pathParts[1] : null;

    if (storagePath) {
      const adminClient = await createAdminClient();
      await adminClient.storage.from("ticket-images").remove([storagePath]);
    }
  } catch (err) {
    console.error("Failed to delete from storage:", err);
    // Continue to delete from DB even if storage delete fails
  }

  await prisma.installation_attachments.delete({
    where: { attachment_id: attachmentId }
  });

  revalidatePath(`/installations/${attachment.installation_id}`);
  return { success: true };
}
