import type { Metadata } from "next";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login | Lanka Chemist",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white font-bold text-lg">
            LC
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lanka Chemist Wholesale
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <AdminLoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          This area is restricted to authorized personnel only.
        </p>
      </div>
    </div>
  );
}
