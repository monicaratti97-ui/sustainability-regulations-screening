// app/page.tsx
"use client";

import React from "react";
import Link from "next/link";

const CARDS = [
  {
    title: "PPWR",
    desc: "Packaging & Packaging Waste Regulation",
    href: "/ppwr?reg=PPWR",
    color: "#0ea5e9",
  },
  {
    title: "Battery Passport",
    desc: "Battery Passport screening",
    href: "/bp?reg=BATTERY",
    color: "#7c3aed",
  },
  {
    title: "RED III",
    desc: "Renewable Energy Directive III",
    href: "/rediii?reg=REDIII",
    color: "#059669",
  },
];

export default function Page() {
  return (
    <div style={s.root}>
      <div style={s.container}>
        <div style={s.badge}>Compliance Suite · 2025</div>
        <h1 style={s.title}>Scegli la normativa</h1>
        <p style={s.subtitle}>
          Seleziona quale questionario vuoi avviare.
        </p>

        <div style={s.grid}>
          {CARDS.map((card) => (
            <RegCard key={card.title} {...card} />
          ))}
        </div>

        
      </div>
    </div>
  );
}

function RegCard({
  title,
  desc,
  href,
  color,
}: {
  title: string;
  desc: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none",height: "100%" }}>
      <div
        style={s.card}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = color + "44";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,23,42,0.10)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "none";
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              ...s.cardCode,
              background: color + "18",
              color,
            }}
          >
            {title}
          </div>
          <div style={s.cardDesc}>{desc}</div>
        </div>
        <div style={{ ...s.cardArrow, color }}>→</div>
      </div>
    </Link>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
    color: "#0f172a",
  },
  container: {
    maxWidth: 920,
    margin: "0 auto",
    padding: "64px 24px 80px",
  },
  badge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    padding: "3px 10px",
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 1.7,
    maxWidth: 500,
    marginBottom: 36,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 12,
    marginBottom: 32,
    lignItems: "stretch",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "20px 20px 18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 16,
    transition: "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
    height: "100%",
    alignItems: "flex-start",
  },
  cardCode: {
    display: "inline-block",
    fontSize: 13,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 6,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.5,
  },
  cardArrow: {
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
  },
  footnote: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.6,
  },
};