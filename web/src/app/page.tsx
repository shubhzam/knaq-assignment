import { redirect } from "next/navigation";

// redirect the root url to the alerts queue
export default function Home() {
  redirect("/alerts");
} 