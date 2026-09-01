import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { site } from "@/lib/site";
import { isConfigured } from "@/lib/env";
import { AuthNotConfigured } from "@/components/auth-not-configured";

export const metadata = { title: "Doctor sign in" };

export default function SignInPage() {
  if (!isConfigured.clerk) return <AuthNotConfigured />;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-cream px-4 py-16">
      <Link href="/" className="font-serif text-xl">
        {site.name}
      </Link>
      <SignIn
        appearance={{
          variables: { colorPrimary: "#2e4636", borderRadius: "4px" },
        }}
      />
      <p className="text-sm text-ink-faint">
        New specialist?{" "}
        <Link href="/sign-up" className="text-green underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
