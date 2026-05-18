import { redirect } from "next/navigation";

/** Approval detail digabung ke Inbound Summary. */
export default async function InboundApprovalDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/inbound-ikan/summary/${id}`);
}
