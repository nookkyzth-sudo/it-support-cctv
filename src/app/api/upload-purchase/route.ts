import { NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const purchase_id = parseInt(formData.get("purchase_id") as string);

  if (!file || !purchase_id) {
    return Response.json(
      { error: "Missing file or purchase_id" },
      { status: 400 }
    );
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `purchases/${purchase_id}/receipt_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await adminSupabase.storage
    .from("ticket-images")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("ticket-images").getPublicUrl(filePath);

  try {
    const attachment = await prisma.purchase_attachments.create({
      data: {
        purchase_id,
        file_path: publicUrl,
        uploaded_by: user.id,
      }
    });

    return Response.json(attachment, { status: 201 });
  } catch (dbError) {
    console.error("DB error:", dbError);
    return Response.json({ error: (dbError as Error).message }, { status: 500 });
  }
}
