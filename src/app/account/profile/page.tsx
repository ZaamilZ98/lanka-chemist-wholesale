import { Metadata } from "next";
import { Suspense } from "react";
import ProfileClient from "@/components/account/ProfileClient";

export const metadata: Metadata = {
  title: "My Profile - Lanka Chemist Wholesale",
  description: "View and edit your profile information",
};

function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClient />
    </Suspense>
  );
}
