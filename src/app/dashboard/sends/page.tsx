import { redirect } from "next/navigation";

export default function DashboardSendsRedirect() {
  redirect("/dashboard/contacts?tab=sends");
}
