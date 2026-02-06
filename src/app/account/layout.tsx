import { Metadata } from "next";
import AccountSidebar from "@/components/account/AccountSidebar";

export const metadata: Metadata = {
  title: "My Account - Lanka Chemist Wholesale",
  description: "Manage your orders and account settings",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <AccountSidebar />
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
