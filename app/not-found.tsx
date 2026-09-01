import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="section-index">404</p>
      <h1 className="display text-3xl">This page could not be found.</h1>
      <Link href="/" className="btn btn-outline">
        Back to home
      </Link>
    </main>
  );
}
