import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const installationIdStr = formData.get("installation_id") as string;
    const type = formData.get("type") as string; // "equipment" or "receipt"

    if (!file || !installationIdStr || !type) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const installationId = parseInt(installationIdStr);
    if (isNaN(installationId)) {
      return Response.json({ error: "Invalid installation ID" }, { status: 400 });
    }

    // Verify installation exists
    const installation = await prisma.equipment_replacements.findUnique({
      where: { id: installationId }
    });

    if (!installation) {
      return Response.json({ error: "Installation not found" }, { status: 404 });
    }

    // Use admin client to bypass RLS for storage upload since it might be blocked
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `installations/${installationId}/${type}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from("ticket-images")
      .upload(filePath, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      return Response.json({ error: "Failed to upload file to storage" }, { status: 500 });
    }

    const { data: { publicUrl } } = adminClient.storage
      .from("ticket-images")
      .getPublicUrl(filePath);

    // Save attachment record using Prisma
    const attachment = await prisma.installation_attachments.create({
      data: {
        installation_id: installationId,
        file_path: publicUrl,
        type: type,
        uploaded_by: user.id
      }
    });

    return Response.json({ url: publicUrl, id: attachment.attachment_id }, { status: 201 });
  } catch (error) {
    console.error("Upload Error:", error);
    return Response.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
