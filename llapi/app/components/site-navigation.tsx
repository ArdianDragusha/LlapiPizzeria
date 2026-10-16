"use client";

import Link from "next/link";
import { useState } from "react";

const languages = [
  { code: "FI", name: "Finnish" },
  { code: "EN", name: "English" },
  { code: "SQ", name: "Albanian" },
];

export default function SiteNavigation() {
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  return (
    <header className="site-header">
      <nav className="site-navigation" aria-label="Main navigation">
        <Link className="brand" href="/">
          Pizzeria <span>Llapi</span>
        </Link>

        <div className="navigation-links">
          <Link href="/menu">Menu</Link>
          <Link href="/build-your-pizza">Build your pizza</Link>
          <Link href="/kitchen">Kitchen</Link>
        </div>

        <div className="navigation-actions">
          <label className="language-picker">
            <svg
              aria-hidden="true"
              className="globe-icon"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
            </svg>
              <span aria-hidden="true">{selectedLanguage}</span>
              <select
                aria-label="Language"
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
              >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              className="chevron-icon"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path d="m4 6 4 4 4-4" />
            </svg>
          </label>

          <Link className="cart-link" href="/cart">
            <svg
              aria-hidden="true"
              className="cart-icon"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M5 8h14v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2M9 12h6" />
            </svg>
            <span>Cart</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
