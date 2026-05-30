import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/green-sol-logo.svg" alt="Green Sol" className="size-20" />
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Green Sol
        </h1>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          Tu ahorro en grupo —san, bolso, vaca— transparente y con control, al
          mundo cripto sobre Solana.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/registro"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Crear cuenta
        </Link>
        <Link href="/login" className="text-sm text-brand underline">
          Ya tengo cuenta
        </Link>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-solana-1.png"
            alt="Solana"
            className="size-4 rounded-full"
          />
          Sobre Solana
        </span>
        <a
          href="https://github.com/michumichifu/green-sol"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-github-1.webp"
            alt="GitHub"
            className="size-4 dark:invert"
          />
          Open source
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        Solana Vibe Bootcamp · Venezuela
      </p>
    </main>
  );
}
