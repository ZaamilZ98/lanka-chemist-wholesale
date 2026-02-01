import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Register — Lanka Chemist Wholesale",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Register to access wholesale prices and place orders
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
