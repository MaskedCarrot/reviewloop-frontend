import { redirect } from "next/navigation";

/** Backwards compatibility: use /how-it-works */
export default function FeaturesRedirectPage() {
  redirect("/how-it-works");
}
