"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

export default function PendingPage() {
  const { user, isLoading, isAuthenticated, isApproved, isRejected, logout } =
    useAuth();
  const router = useRouter();

  // Redirect approved users to account
  useEffect(() => {
    if (!isLoading && isApproved) {
      router.push("/account");
    }
  }, [isLoading, isApproved, router]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {isRejected ? (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-light">
              <svg
                className="h-8 w-8 text-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Verification Unsuccessful
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Unfortunately, we could not verify your account.
              </p>
            </div>
            {user?.rejection_reason && (
              <Alert type="error">
                <strong>Reason:</strong> {user.rejection_reason}
              </Alert>
            )}
            <p className="text-sm text-gray-600">
              Please review the reason above and contact us if you believe this
              is an error, or re-upload corrected documents.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={logout}>
                Sign out
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-light">
              <svg
                className="h-8 w-8 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Account Pending Verification
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Your account is pending verification. You will receive an email
                once approved.
              </p>
            </div>
            <Alert type="info">
              Our team will review your uploaded documents and verify your
              account. This usually happens within 1-2 business days.
            </Alert>
            <p className="text-sm text-gray-500">
              You can browse products in the meantime. Wholesale prices and
              ordering will be available once your account is verified.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push("/")}>
                Browse Products
              </Button>
              <Button variant="ghost" onClick={logout}>
                Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
