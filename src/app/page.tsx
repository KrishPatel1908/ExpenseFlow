import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold tracking-tight text-stone-900">
            ExpenseFlow
          </h1>

          <p className="mt-4 text-lg text-stone-600">
            Manage customer budgets and expenses with a clean, fast, and
            modern dashboard.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            prefetch={false}
            className="rounded-lg bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/login"
            prefetch={false}
            className="rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </main>
  );
}