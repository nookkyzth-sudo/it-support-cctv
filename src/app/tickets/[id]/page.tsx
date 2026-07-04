import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getCurrentUser, getTicketById } from "@/lib/supabase-db";
import { TicketDetail } from "@/components/ui/ticket-detail";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await getCurrentUser();
  const isAdmin = dbUser?.role === "admin";

  const { id } = await params;
  const ticket = await getTicketById(parseInt(id), {
    viewerUserId: user.id,
    isAdmin,
  });

  if (!ticket) notFound();

  return <TicketDetail ticket={ticket} />;
}
