import { Link } from "@tanstack/react-router";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 border-b border-border pb-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <nav className="flex flex-wrap gap-2 text-sm">
              <Link
                to="/"
                className="rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-accent"
                activeProps={{ className: "rounded-md bg-primary px-3 py-1.5 text-primary-foreground" }}
              >
                Home
              </Link>
              <Link
                to="/search"
                className="rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-accent"
                activeProps={{ className: "rounded-md bg-primary px-3 py-1.5 text-primary-foreground" }}
              >
                Search
              </Link>
              <Link
                to="/memorize"
                className="rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-accent"
                activeProps={{ className: "rounded-md bg-primary px-3 py-1.5 text-primary-foreground" }}
              >
                Memorize
              </Link>
              <Link
                to="/bookmarks"
                className="rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-accent"
                activeProps={{ className: "rounded-md bg-primary px-3 py-1.5 text-primary-foreground" }}
              >
                Bookmarks
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}