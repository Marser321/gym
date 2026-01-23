import { redirect } from "next/navigation";

export default function Home() {
  // Por ahora redirigimos al login hasta tener el dashboard y auth flow completos
  redirect("/login");
}
