import Link from "next/link";

export function AuthNotConfigured() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-serif text-2xl">Authentication not configured</h1>
      <p className="prose-body max-w-md text-sm">
        Set <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
        <code>CLERK_SECRET_KEY</code> (see <code>SETUP.md</code>) to enable
        specialist sign-in.
      </p>
      <Link href="/" className="btn btn-outline mt-2">
        Back to site
      </Link>
    </main>
  );
}
