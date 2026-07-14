import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt((await params).id);
  if (isNaN(id)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Delete attachments from storage first (optional, but good practice)
    const attachments = await prisma.installation_attachments.findMany({
      where: { installation_id: id }
    });

    if (attachments.length > 0) {
      const paths = attachments.map(a => {
        // extract path after the bucket URL
        const urlObj = new URL(a.file_path);
        const pathParts = urlObj.pathname.split('/ticket-images/');
        return pathParts.length > 1 ? pathParts[1] : null;
      }).filter(p => p !== null) as string[];

      if (paths.length > 0) {
         // Need admin client to bypass RLS for delete if user is not the owner
         const adminClient = require('@supabase/supabase-js').createClient(
           process.env.NEXT_PUBLIC_SUPABASE_URL!,
           process.env.SUPABASE_SERVICE_ROLE_KEY!
         );
         await adminClient.storage.from("ticket-images").remove(paths);
      }
    }

    // Prisma Cascade delete will handle the DB rows if configured,
    // but let's delete them explicitly just in case.
    await prisma.installation_attachments.deleteMany({
      where: { installation_id: id }
    });

    await prisma.equipment_replacements.delete({
      where: { id }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt((await params).id);
  if (isNaN(id)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    let branchId = parseInt(body.branch_id);
    const targetBranch = body.target_branch;
    
    if (isNaN(branchId) && targetBranch) {
      const existingBranch = await prisma.branches.findFirst({
        where: { branch_name: targetBranch }
      });
      if (existingBranch) {
        branchId = existingBranch.branch_id;
      } else {
        const newBranch = await prisma.branches.create({
          data: { branch_name: targetBranch }
        });
        branchId = newBranch.branch_id;
      }
    }

    const updated = await prisma.equipment_replacements.update({
      where: { id },
      data: {
        branch_id: branchId,
        target_branch: targetBranch || "",
        equipment_details: body.equipment_details || "",
        action_date: body.action_date ? new Date(body.action_date) : undefined,
      }
    });

    return Response.json(updated);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
