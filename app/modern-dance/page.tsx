import { redirect } from "next/navigation";
import { DEFAULT_VIDEO_SLUG } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default function ModernDancePage() {
  redirect(`/video/${DEFAULT_VIDEO_SLUG}`);
}
