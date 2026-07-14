import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const branch_id = searchParams.get("branch_id");

  try {
    let whereClause: any = {};
    if (branch_id) {
      whereClause.branch_id = parseInt(branch_id);
    }

    const installations = await prisma.equipment_replacements.findMany({
      where: whereClause,
      include: {
        branch: true,
        recorder: true,
        attachments: true
      },
      orderBy: { action_date: 'desc' }
    });

    return Response.json(installations);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Check if we need to create a new branch first
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

    const installation = await prisma.equipment_replacements.create({
      data: {
        branch_id: branchId,
        target_branch: targetBranch || "",
        equipment_name: body.equipment_name || "ไม่มีชื่อ",
        equipment_details: body.equipment_details || "",
        action_date: new Date(body.action_date),
        recorded_by: user.id,
      },
    });

    return Response.json(installation, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
