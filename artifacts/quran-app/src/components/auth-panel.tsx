import { useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogIn, LogOut, Download, Loader2, User } from "lucide-react";

/* ── Shared helpers ─────────────────────────────────────────────── */
function getDisplayName(user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) {
  if (!user) return "Account";
  return user.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : user.email?.split("@")[0] ?? "Account";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ── Full sidebar auth panel ────────────────────────────────────── */
export function AuthPanel() {
  const { user, isLoading, isAuthenticated, hasPendingGuestData, login, logout, migrateGuestData, refetch } = useAuth();
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="px-3 py-2 space-y-2">
        <p className="text-xs text-muted-foreground leading-snug">
          Sign in to sync your progress across devices.
        </p>
        <Button size="sm" className="w-full gap-2" onClick={login}>
          <LogIn className="h-4 w-4" />
          Sign in with Replit
        </Button>
      </div>
    );
  }

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  async function handleMigrate() {
    setMigrating(true);
    setMigrateMsg(null);
    try {
      const result = await migrateGuestData();
      setMigrateMsg(result.message);
      if (result.migrated) refetch();
    } finally {
      setMigrating(false);
      setShowMigrateDialog(false);
    }
  }

  return (
    <div className="px-3 py-2 space-y-2">
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={user?.profileImageUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{displayName}</p>
          {user?.email && (
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          )}
        </div>
      </div>

      {hasPendingGuestData && (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2 text-xs"
          onClick={() => setShowMigrateDialog(true)}
          disabled={migrating}
        >
          {migrating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Download className="h-3 w-3" />
          )}
          Import guest data
        </Button>
      )}

      {migrateMsg && (
        <p className="text-xs text-muted-foreground">{migrateMsg}</p>
      )}

      <Button size="sm" variant="ghost" className="w-full gap-2 text-xs text-muted-foreground" onClick={logout}>
        <LogOut className="h-3 w-3" />
        Sign out
      </Button>

      <AlertDialog open={showMigrateDialog} onOpenChange={setShowMigrateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import your guest data?</AlertDialogTitle>
            <AlertDialogDescription>
              Your bookmarks, memorization progress, and activity from your guest
              session will be merged into your account. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMigrate} disabled={migrating}>
              {migrating ? "Importing…" : "Import data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Compact avatar button (collapsed sidebar + mobile header) ──── */
export function CompactAuthButton() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        title="Sign in with Replit"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <User className="h-5 w-5" />
      </button>
    );
  }

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title={displayName}
          className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-transparent hover:ring-primary/30 transition-all focus:outline-none"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="font-medium text-sm truncate">{displayName}</p>
          {user?.email && (
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-muted-foreground gap-2 cursor-pointer">
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Auth section for the mobile "More" bottom sheet ───────────── */
export function MoreSheetAuthSection() {
  const { user, isLoading, isAuthenticated, hasPendingGuestData, login, logout, migrateGuestData, refetch } = useAuth();
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);
  const [migrating, setMigrating] = useState(false);

  async function handleMigrate() {
    setMigrating(true);
    try {
      const result = await migrateGuestData();
      if (result.migrated) refetch();
    } finally {
      setMigrating(false);
      setShowMigrateDialog(false);
    }
  }

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <div className="border-t border-border mx-4 mt-1 pt-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Account</p>
        <button
          onClick={login}
          className="flex items-center gap-4 w-full rounded-xl px-4 min-h-[52px] py-3 transition-colors text-foreground hover:bg-muted/50"
        >
          <LogIn className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium">Sign in with Replit</span>
        </button>
      </div>
    );
  }

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  return (
    <>
      <div className="border-t border-border mx-4 mt-1 pt-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Account</p>

        {/* User info row */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user?.profileImageUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{displayName}</p>
            {user?.email && (
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            )}
          </div>
        </div>

        {hasPendingGuestData && (
          <button
            onClick={() => setShowMigrateDialog(true)}
            disabled={migrating}
            className="flex items-center gap-4 w-full rounded-xl px-4 min-h-[52px] py-3 mt-1 transition-colors text-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            {migrating ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin flex-shrink-0" />
            ) : (
              <Download className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-sm font-medium">Import guest data</span>
          </button>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-4 w-full rounded-xl px-4 min-h-[52px] py-3 transition-colors text-muted-foreground hover:bg-muted/50"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>

      <AlertDialog open={showMigrateDialog} onOpenChange={setShowMigrateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import your guest data?</AlertDialogTitle>
            <AlertDialogDescription>
              Your bookmarks, memorization progress, and activity from your guest
              session will be merged into your account. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMigrate} disabled={migrating}>
              {migrating ? "Importing…" : "Import data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
