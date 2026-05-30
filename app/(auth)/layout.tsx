import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
      <Link href="/" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/green-sol-logo.svg" alt="Green Sol" className="size-10" />
        <span className="text-xl font-bold">Green Sol</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
