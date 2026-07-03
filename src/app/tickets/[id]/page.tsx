import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getTicketById } from "@/lib/supabase-db";
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

  const { id } = await params;
  const ticket = await getTicketById(parseInt(id));

  if (!ticket) notFound();

  return <TicketDetail ticket={ticket} />;
}
