"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dfa", label: "DFA Workspace" },
  { href: "/workspace", label: "General Workspace" },
  { href: "/sessions", label: "Sessions" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "var(--header-height)",
        zIndex: 100,
        background: scrolled
          ? "rgba(10, 15, 30, 0.92)"
          : "rgba(10, 15, 30, 0.6)",
        borderBottom: `1px solid ${scrolled ? "rgba(99, 130, 201, 0.2)" : "transparent"}`,
        backdropFilter: "blur(20px)",
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "var(--gradient-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "#fff",
              boxShadow: "0 0 16px var(--color-accent-glow)",
              flexShrink: 0,
            }}
          >
            L
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.15rem",
              color: "var(--color-text-primary)",
            }}
          >
            Learn<span className="text-gradient">Lens</span>{" "}
            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }} className="hide-mobile">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "0.4rem 0.875rem",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  background: active ? "var(--color-surface-2)" : "transparent",
                  border: active ? "1px solid var(--color-border)" : "1px solid transparent",
                  transition: "all 0.2s ease",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Link href="/dfa" className="btn btn-secondary btn-sm hide-mobile" id="header-dfa-btn">
            DFA Workspace
          </Link>
          <Link href="/workspace" className="btn btn-primary btn-sm hide-mobile" id="header-workspace-btn">
            Open Workspace →
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="btn btn-ghost btn-icon"
            style={{ display: "none" }}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
            id="mobile-menu-toggle"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "rgba(10, 15, 30, 0.98)",
            borderBottom: "1px solid var(--color-border)",
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/workspace" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
            Open Workspace
          </Link>
        </div>
      )}
    </header>
  );
}
