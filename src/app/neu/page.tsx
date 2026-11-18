import { redirect } from "next/navigation";

// The new app moved to /. Old bookmarks and home-screen icons still land in the right place.
export default function NeuPage() {
  redirect("/");
}
