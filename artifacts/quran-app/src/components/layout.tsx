import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AuthPanel, CompactAuthButton, MoreSheetAuthSection } from "@/components/auth-panel";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, LayoutDashboard, Brain, History,
  Settings as SettingsIcon, GraduationCap, TrendingUp, Bell, Bookmark, Sparkles,
  Sun, Moon, Flame, Layers, Smartphone, FileText,
  MoreHorizontal, X, ChevronLeft, ChevronRight, Columns2, ScrollText,
} from "lucide-react";
import { useReminders } from "@/hooks/use-reminders";
import { useReadingProfile } from "@/hooks/use-reading-profile";
import type { ProfileId } from "@/lib/display-profiles";

/* ── Constants ───────────────────────────────────────────────── */
const NAV_PREF_KEY     = "qiyam_nav_pref";
const SIDEBAR_COLS_KEY = "qiyam_sidebar_collapsed";

type ScreenSize = "mobile" | "tablet" | "desktop";
type NavPref    = "sidebar" | "bottom";

/* ── Theme switcher ──────────────────────────────────────────── */
const PROFILES: {
  id: ProfileId;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}[] = [
  { id: "light",   icon: Sun,        label: "Light"  },
  { id: "dark",    icon: Moon,       label: "Dark"   },
  { id: "kobo",    icon: Flame,      label: "Kobo"   },
  { id: "boox",    icon: Layers,     label: "BOOX"   },
  { id: "kindle",  icon: Smartphone, label: "Kindle" },
  { id: "paper",   icon: FileText,   label: "Paper"  },
];

function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { profileId, setProfileId } = useReadingProfile();
  return (
    <div className={`flex flex-wrap items-center ${compact ? "gap-0.5" : "gap-1"} p-1 rounded-lg bg-muted/60 border border-border`}>
      {PROFILES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setProfileId(id)}
          title={label}
          className={`flex items-center justify-center rounded-md transition-all ${
            compact ? "h-7 w-7" : "h-7 gap-1 px-2"
          } ${
            profileId === id
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {!compact && <span className="text-[11px] font-medium">{label}</span>}
        </button>
      ))}
    </div>
  );
}

/* ── Nav item type ───────────────────────────────────────────── */
type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: number;
};

/* ── Sidebar nav link ────────────────────────────────────────── */
function SideNavLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.name : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 min-h-[44px] transition-all hover:text-primary ${
        collapsed ? "justify-center py-2.5" : "py-2"
      } ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground"
      }`}
    >
      <div className="relative flex-shrink-0">
        <item.icon className="h-4 w-4" />
        {item.badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-secondary-foreground">
            {item.badge}
          </span>
        )}
      </div>
      {!collapsed && (
        <>
          <span className="flex-1 text-sm">{item.name}</span>
          {item.badge > 0 && (
            <span className="ml-auto rounded-full bg-secondary/20 px-1.5 py-0.5 text-xs font-medium text-secondary">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  Layout                                                        */
/* ══════════════════════════════════════════════════════════════ */
export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { dueToday } = useReminders();

  /* ── Screen size ─────────────────────────────────────────── */
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setScreenSize(w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ── Tablet nav preference ───────────────────────────────── */
  const [tabletNavPref, setTabletNavPref] = useState<NavPref | null>(() => {
    const s = localStorage.getItem(NAV_PREF_KEY);
    return s === "sidebar" || s === "bottom" ? s : null;
  });

  const showTabletBanner = screenSize === "tablet" && tabletNavPref === null;

  const chooseTabletNav = (pref: NavPref) => {
    localStorage.setItem(NAV_PREF_KEY, pref);
    setTabletNavPref(pref);
  };

  /* ── Desktop sidebar collapse ────────────────────────────── */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLS_KEY) === "true"
  );

  const toggleCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLS_KEY, String(next));
      return next;
    });
  };

  /* ── More bottom sheet ───────────────────────────────────── */
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { setMoreOpen(false); }, [location]);

  /* ── Nav mode ────────────────────────────────────────────── */
  const navMode: NavPref =
    screenSize === "desktop" ? "sidebar" :
    screenSize === "tablet"  ? (tabletNavPref ?? "sidebar") :
    "bottom";

  const showSidebar   = navMode === "sidebar";
  const showBottomNav = navMode === "bottom";

  /* ── Nav items ───────────────────────────────────────────── */
  const allNav: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: 0              },
    { name: "Quran",     href: "/quran",     icon: BookOpen,        badge: 0              },
    { name: "Practice",  href: "/practice",  icon: GraduationCap,   badge: 0              },
    { name: "Memorize",  href: "/memorize",  icon: Brain,           badge: 0              },
    { name: "Review",    href: "/review",    icon: History,         badge: 0              },
    { name: "Progress",  href: "/progress",  icon: TrendingUp,      badge: 0              },
    { name: "Dhikr & Dua", href: "/dhikr",    icon: Sparkles,        badge: 0              },
    { name: "Hadith",      href: "/hadith",   icon: ScrollText,      badge: 0              },
    { name: "Bookmarks",   href: "/bookmarks", icon: Bookmark,        badge: 0              },
    { name: "Reminders",   href: "/reminders", icon: Bell,            badge: dueToday.length},
    { name: "Settings",    href: "/settings",  icon: SettingsIcon,    badge: 0              },
  ];

  const PRIMARY_NAMES = ["Dashboard", "Quran", "Memorize", "Review"];
  const primaryNav    = allNav.filter(n => PRIMARY_NAMES.includes(n.name));
  const moreNav       = allNav.filter(n => !PRIMARY_NAMES.includes(n.name));
  const moreHasActive = moreNav.some(n => location.startsWith(n.href));

  /* ──────────────────────────────────────────────────────────── */
  return (
    <div
      className={`flex w-full bg-background ${showTabletBanner ? "pt-12" : ""}`}
      style={{
        minHeight: "100dvh",
        "--sidebar-offset": showSidebar ? (sidebarCollapsed ? "4rem" : "16rem") : "0rem",
      } as React.CSSProperties}
    >

      {/* ── Tablet nav-preference banner ─────────────────────── */}
      <AnimatePresence>
        {showTabletBanner && (
          <motion.div
            key="tablet-banner"
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: -56,  opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-3 shadow-lg"
          >
            <div className="flex items-center gap-2 text-sm font-medium min-w-0">
              <Columns2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">How would you like to navigate on this device?</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => chooseTabletNav("sidebar")}
                className="rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/30 px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Sidebar
              </button>
              <button
                onClick={() => chooseTabletNav("bottom")}
                className="rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/30 px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Bottom Tabs
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar ───────────────────────────────────────────── */}
      {showSidebar && (
        <aside
          className={`flex flex-col flex-shrink-0 border-r bg-sidebar transition-[width] duration-300 ease-in-out ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
          style={{ minHeight: "100dvh", position: "sticky", top: 0, alignSelf: "flex-start", height: "100dvh", overflowY: "auto" }}
        >
          {/* Logo row */}
          <div className={`flex h-14 items-center border-b flex-shrink-0 ${
            sidebarCollapsed ? "justify-center px-4" : "justify-between px-5"
          }`}>
            <div className={`flex items-center gap-2 font-semibold text-primary overflow-hidden ${sidebarCollapsed ? "" : "flex-1"}`}>
              <BookOpen className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-xl truncate">Qiyam</span>}
            </div>
            {screenSize === "desktop" && (
              <button
                onClick={toggleCollapse}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex-shrink-0"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed
                  ? <ChevronRight className="h-4 w-4" />
                  : <ChevronLeft  className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* Nav links */}
          <nav className={`flex-1 overflow-y-auto py-3 ${sidebarCollapsed ? "px-2" : "px-3"}`}>
            <div className="grid gap-0.5">
              {allNav.map(item => (
                <SideNavLink
                  key={item.name}
                  item={item}
                  collapsed={sidebarCollapsed}
                  active={location.startsWith(item.href)}
                />
              ))}
            </div>
          </nav>

          {/* Auth panel */}
          {sidebarCollapsed ? (
            <div className="border-t border-sidebar-border flex-shrink-0 py-3 flex justify-center">
              <CompactAuthButton />
            </div>
          ) : (
            <div className="border-t border-sidebar-border flex-shrink-0">
              <AuthPanel />
            </div>
          )}

          {/* Theme switcher */}
          <div className={`border-t border-sidebar-border flex-shrink-0 ${sidebarCollapsed ? "py-3 flex justify-center" : "px-4 py-4"}`}>
            {sidebarCollapsed ? (
              <ThemeSwitcher compact />
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  Reading Profile
                </p>
                <ThemeSwitcher />
              </>
            )}
          </div>

          {/* Attribution */}
          {!sidebarCollapsed && (
            <div className="border-t border-sidebar-border/50 px-4 py-2.5 flex-shrink-0 text-center">
              <span className="text-[11px] text-muted-foreground/60">
                Made with <span className="text-red-400">❤️</span> by{" "}
                <span className="font-semibold text-muted-foreground/80">Badrul</span>
              </span>
            </div>
          )}
        </aside>
      )}

      {/* ── Content column ───────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {showBottomNav && (
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 flex-shrink-0">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <BookOpen className="h-5 w-5" />
              <span className="text-lg">Qiyam</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeSwitcher compact />
              <CompactAuthButton />
            </div>
          </header>
        )}

        <main className={`flex-1 ${showBottomNav ? "pb-20" : ""}`}>
          {children}
        </main>
      </div>

      {/* ── Bottom tab bar ────────────────────────────────────── */}
      {showBottomNav && (
        <nav
          className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border flex items-stretch"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {primaryNav.map(item => {
            const active = location.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] py-2 px-1 transition-colors relative ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-[20%] right-[20%] h-[2px] rounded-full bg-primary" />
                )}
                <div className="relative">
                  <item.icon className={`h-[22px] w-[22px] transition-transform ${active ? "scale-110" : ""}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-none ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] py-2 px-1 transition-colors relative ${
              moreHasActive || moreOpen ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {moreHasActive && (
              <span className="absolute top-0 left-[20%] right-[20%] h-[2px] rounded-full bg-primary" />
            )}
            <MoreHorizontal className={`h-[22px] w-[22px] transition-transform ${moreOpen ? "scale-110" : ""}`} />
            <span className={`text-[10px] font-medium leading-none ${moreHasActive || moreOpen ? "text-primary" : "text-muted-foreground"}`}>
              More
            </span>
          </button>
        </nav>
      )}

      {/* ── More bottom sheet ─────────────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{   y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-background rounded-t-2xl border-t border-border shadow-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
              </div>
              <div className="flex items-center justify-between px-5 py-2">
                <span className="text-sm font-semibold text-foreground">More</span>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="rounded-full p-2 -mr-2 hover:bg-muted/60 text-muted-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-3 pb-1">
                {moreNav.map(item => {
                  const active = location.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-4 rounded-xl px-4 min-h-[52px] py-3 transition-colors ${
                        active ? "bg-primary/8 text-primary" : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <item.icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        {item.badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="flex-1 text-sm font-medium">{item.name}</span>
                      {item.badge > 0 && (
                        <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-xs font-medium text-secondary">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>

              <MoreSheetAuthSection />

              <div className="border-t border-border mx-4 mt-1 pt-4 pb-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  Reading Profile
                </p>
                <ThemeSwitcher />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Attribution footer for sidebar ─────────────────────────── */
export function SidebarAttribution({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="mt-auto px-4 py-3 border-t border-border/50 flex flex-col items-center gap-0.5">
      <span className="text-[11px] text-muted-foreground/70">
        Made with <span className="text-red-400">❤️</span> by <span className="font-semibold text-muted-foreground">Badrul</span>
      </span>
    </div>
  );
}
