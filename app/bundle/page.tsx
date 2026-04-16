import { redirect } from "next/navigation";
import { DEFAULT_BUNDLE_OFFER_SLUG } from "@/lib/offers";

export default function BundleRedirectPage() {
  redirect(`/offers/${DEFAULT_BUNDLE_OFFER_SLUG}`);
}
