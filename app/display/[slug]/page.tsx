import type { Metadata } from "next";
import DisplayClient from "./display-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DisplayClient slug={slug} />;
}
