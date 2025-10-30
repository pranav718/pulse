// app/dashboard/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/auth");
  }

  const user = await currentUser();

  return <DashboardClient user={{
    name: user?.fullName || null,
    email: user?.emailAddresses[0]?.emailAddress || null,
    image: user?.imageUrl || null,
  }} />;
}