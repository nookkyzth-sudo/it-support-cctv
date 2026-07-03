import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const ticket_id = parseInt(formData.get("ticket_id") as string);
  const type = formData.get("type") as string;

  if (!file || !ticket_id) {
    return Response.json(
      { error: "Missing file or ticket_id" },
      { status: 400 }
    );
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `${ticket_id}/${type}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("ticket-images")
    .upload(filePath, file);

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("ticket-images").getPublicUrl(filePath);

  const { data: attachment, error: dbError } = await supabase
    .from("ticket_attachments")
    .insert({
      ticket_id,
      file_path: publicUrl,
      type,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (dbError) {
    return Response.json({ error: dbError.message }, { status: 500 });
  }

  return Response.json(attachment, { status: 201 });
}
