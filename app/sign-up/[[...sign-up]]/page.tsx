import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { site } from "@/lib/site";
import { isConfigured } from "@/lib/env";
import { AuthNotConfigured } from "@/components/auth-not-configured";

export const metadata = { title: "Join as a specialist" };

export default function SignUpPage() {
  if (!isConfigured.clerk) return <AuthNotConfigured />;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-cream px-4 py-16">
      <Link href="/" className="font-serif text-xl">
        {site.name}
      </Link>
      <div className="max-w-sm text-center">
        <h1 className="font-serif text-2xl">Create your specialist account</h1>
        <p className="prose-body mt-2 text-sm">
          After signing up you&rsquo;ll complete your profile and set your
          availability. Your listing goes live immediately.
        </p>
      </div>
      <SignUp
        appearance={{
          variables: { colorPrimary: "#2e4636", borderRadius: "4px" },
        }}
      />
    </main>
  );
}
