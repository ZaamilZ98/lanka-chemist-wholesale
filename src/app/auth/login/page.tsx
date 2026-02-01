import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In — Lanka Chemist Wholesale",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Access wholesale prices and place orders
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
