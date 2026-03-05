import Link from "next/link";

export default function BackToHome() {
  return (
    <Link
      href="/"
      className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
    >
      Torna alla home
    </Link>
  );
}
