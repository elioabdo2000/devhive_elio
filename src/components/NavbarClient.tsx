"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/components/Toast";

const NAV_LINKS = [
  { href: "/blogs", label: "blogs" },
  { href: "/communities", label: "communities" },
];

export default function NavbarClient() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const user = session?.user ?? null;

  function isActive(href: string) {
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  async function handleLogout() {
    setMenuOpen(false);
    setMobileOpen(false);
    setLoggingOut(true);
    showToast("success", "You've been logged out");
    // signOut() does a full-page redirect, which would unmount the toast
    // before it's visible — give it a beat to render first.
    await new Promise((resolve) => setTimeout(resolve, 500));
    signOut({ callbackUrl: "/" });
  }

  const navLinkList = (onClick?: () => void) => (
    <>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClick}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={`transition hover:text-teal ${isActive(link.href) ? "font-semibold text-teal" : ""}`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  const authActions = (onNavigate?: () => void) => {
    if (status === "loading") {
      return <div className="h-9 w-24 animate-pulse rounded-md bg-teal-soft/60" />;
    }

    if (!user) {
      return (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            onClick={onNavigate}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition hover:border-teal hover:text-teal"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            onClick={onNavigate}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal"
          >
            Sign up
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1 md:hidden">
        <Link href={`/profile/${user.username}`} onClick={onNavigate} className="rounded-md px-3 py-2 text-sm text-ink hover:bg-teal-soft">
          Profile
        </Link>
        <Link href="/blogs/new" onClick={onNavigate} className="rounded-md px-3 py-2 text-sm text-ink hover:bg-teal-soft">
          New Blog
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-teal-soft disabled:opacity-50"
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4">
      <nav className="font-mono hidden gap-6 text-sm text-ink-soft md:flex">{navLinkList()}</nav>

      {/* Desktop auth actions / account menu */}
      <div className="hidden md:block">
        {status !== "loading" && user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 transition hover:border-teal"
            >
              {user.image ? (
                <Image src={user.image} alt="" width={28} height={28} className="rounded-full" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-teal-soft" />
              )}
              <span className="text-sm font-medium text-ink">{user.name}</span>
            </button>

            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-paper-raised py-1 shadow-lg">
                <Link
                  href={`/profile/${user.username}`}
                  role="menuitem"
                  className="block px-4 py-2 text-sm text-ink hover:bg-teal-soft"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/blogs/new"
                  role="menuitem"
                  className="block px-4 py-2 text-sm text-ink hover:bg-teal-soft"
                  onClick={() => setMenuOpen(false)}
                >
                  New Blog
                </Link>
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-teal-soft disabled:opacity-50"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            )}
          </div>
        ) : (
          authActions()
        )}
      </div>

      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileOpen((o) => !o)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav-panel"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink transition hover:border-teal md:hidden"
      >
        {mobileOpen ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {mobileOpen && (
        <div
          id="mobile-nav-panel"
          className="absolute inset-x-0 top-full border-b border-border bg-paper-raised px-4 py-4 shadow-lg md:hidden"
        >
          <nav className="font-mono flex flex-col gap-3 text-sm text-ink-soft">
            {navLinkList(() => setMobileOpen(false))}
          </nav>
          <div className="mt-4 border-t border-border pt-4 md:hidden">{authActions(() => setMobileOpen(false))}</div>
        </div>
      )}
    </div>
  );
}
