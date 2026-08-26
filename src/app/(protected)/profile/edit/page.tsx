import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User, { type LeanUser } from "@/models/User";
import ProfileEditForm from "./ProfileEditForm";

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const user = await User.findById(session.user.id).lean<LeanUser>();
  if (!user) redirect("/login");

  const isNewProfile = !user.headline && !user.bio && (!user.skills || user.skills.length === 0);

  return (
    <ProfileEditForm
      isNewProfile={isNewProfile}
      initialData={{
        username: user.username,
        image: user.image ?? "",
        headline: user.headline ?? "",
        bio: user.bio ?? "",
        skills: user.skills ?? [],
        githubUrl: user.githubUrl ?? "",
        linkedinUrl: user.linkedinUrl ?? "",
      }}
    />
  );
}
