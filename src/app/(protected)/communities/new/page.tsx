import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CommunityForm from "@/components/CommunityForm";

export default async function NewCommunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/communities/new");

  return <CommunityForm />;
}
