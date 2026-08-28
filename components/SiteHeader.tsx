import { getCurrentUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";

export default async function SiteHeader() {
  const user = await getCurrentUser();
  return <NavBar user={user} />;
}
