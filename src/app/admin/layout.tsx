import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Lanka Chemist Admin",
    default: "Lanka Chemist Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
