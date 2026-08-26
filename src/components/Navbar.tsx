import Link from "next/link";
import NavbarClient from "./NavbarClient";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <span className="inline-block h-2 w-2 rounded-full bg-teal" />
          DevHive
        </Link>
        <NavbarClient />
      </div>
    </header>
  );
}
