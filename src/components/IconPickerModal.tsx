"use client";

import React, { useState, useMemo } from "react";
import { HOMELAB_ICONS, HomelabIcon } from "@/lib/icons";
import { Search, X, Check, Image as ImageIcon, Link as LinkIcon, Layers } from "lucide-react";

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconUrl: string) => void;
  currentIcon?: string;
  appName?: string;
}

const CATEGORIES = [
  { id: "all", label: "Összes" },
  { id: "media", label: "Média" },
  { id: "network", label: "Hálózat & DNS" },
  { id: "system", label: "Rendszer & VM" },
  { id: "smarthome", label: "Okosotthon" },
  { id: "security", label: "Biztonság & Auth" },
  { id: "storage", label: "Tárhely & Cloud" },
  { id: "download", label: "Letöltések" },
  { id: "tools", label: "Eszközök" },
  { id: "dev", label: "Fejlesztés" },
];

export default function IconPickerModal({
  isOpen,
  onClose,
  onSelectIcon,
  currentIcon = "",
  appName = "",
}: IconPickerModalProps) {
  const [search, setSearch] = useState(appName ? appName.split(" ")[0] : "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customUrl, setCustomUrl] = useState(currentIcon);
  const [activeTab, setActiveTab] = useState<"library" | "custom">("library");

  const filteredIcons = useMemo(() => {
    return HOMELAB_ICONS.filter((icon) => {
      const matchesCat = selectedCategory === "all" || icon.category === selectedCategory;
      if (!matchesCat) return false;

      if (!search.trim()) return true;

      const q = search.toLowerCase().trim();
      const inName = icon.name.toLowerCase().includes(q);
      const inSlug = icon.slug.toLowerCase().includes(q);
      const inKeywords = icon.keywords.some((k) => k.toLowerCase().includes(q));

      return inName || inSlug || inKeywords;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onSelectIcon(url);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: "680px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem",
          gap: "1.25rem",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                background: "#171717",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ImageIcon size={16} style={{ color: "var(--foreground)" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
                Ikon választása
              </h2>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Válassz a {HOMELAB_ICONS.length}+ önállóan futtatható homelab ikon közül
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost"
            style={{ padding: "0.25rem" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`btn btn-sm ${activeTab === "library" ? "btn-primary" : "btn-ghost"}`}
          >
            <Layers size={13} />
            <span>Homelab Ikon Könyvtár ({HOMELAB_ICONS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`btn btn-sm ${activeTab === "custom" ? "btn-primary" : "btn-ghost"}`}
          >
            <LinkIcon size={13} />
            <span>Egyéni URL megadása</span>
          </button>
        </div>

        {activeTab === "library" ? (
          <>
            {/* Search and Category filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className="search-wrapper" style={{ maxWidth: "100%" }}>
                <Search className="search-icon" size={15} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Keresés szolgáltatás neve szerint (pl. Plex, Proxmox, Pi-hole, Vaultwarden)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="btn-ghost"
                    style={{ padding: "0.25rem", color: "var(--text-dim)" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category pills */}
              <div
                className="flex gap-1.5 flex-wrap"
                style={{ maxHeight: "72px", overflowY: "auto" }}
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`btn btn-sm ${
                      selectedCategory === cat.id ? "btn-primary" : "btn-ghost"
                    }`}
                    style={{
                      fontSize: "0.6875rem",
                      padding: "0.25rem 0.625rem",
                      height: "auto",
                      borderRadius: "100px",
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Icons Grid */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                maxHeight: "360px",
                paddingRight: "0.25rem",
              }}
            >
              {filteredIcons.length === 0 ? (
                <div
                  className="card text-center"
                  style={{ padding: "2.5rem 1rem", border: "1px dashed var(--border)" }}
                >
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    Nem található ikon a(z) &quot;{search}&quot; keresésre.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("all");
                    }}
                    className="btn btn-sm"
                    style={{ alignSelf: "center", marginTop: "0.75rem" }}
                  >
                    Összes ikon mutatása
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  {filteredIcons.map((icon) => {
                    const isSelected = currentIcon === icon.url;
                    return (
                      <button
                        key={icon.slug}
                        type="button"
                        onClick={() => handleSelect(icon.url)}
                        className="card group"
                        style={{
                          padding: "0.75rem 0.5rem",
                          alignItems: "center",
                          textAlign: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#1f1f1f" : "#0d0d0d",
                          borderColor: isSelected ? "var(--foreground)" : "var(--border)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ position: "relative" }}>
                          <img
                            src={icon.url}
                            alt={icon.name}
                            loading="lazy"
                            style={{
                              width: "36px",
                              height: "36px",
                              objectFit: "contain",
                            }}
                          />
                          {isSelected && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: "-4px",
                                right: "-4px",
                                background: "#ffffff",
                                color: "#000000",
                                borderRadius: "50%",
                                width: "16px",
                                height: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? "var(--foreground)" : "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                          }}
                        >
                          {icon.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Custom URL Tab */
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                Közvetlen Kép / Ikon URL (PNG, SVG, JPG):
              </label>
              <input
                type="text"
                className="input"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://pelda.hu/ikon.svg"
              />
            </div>

            {customUrl && (
              <div className="flex items-center gap-3" style={{ padding: "0.75rem", background: "#111111", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <img
                  src={customUrl}
                  alt="Előnézet"
                  style={{ width: "36px", height: "36px", objectFit: "contain" }}
                  onError={(e) => {
                    (e.target as any).style.display = "none";
                  }}
                />
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Ikon előnézete
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => {
                  onSelectIcon("");
                  onClose();
                }}
                className="btn btn-ghost btn-sm"
              >
                Ikon eltávolítása
              </button>
              <button
                type="button"
                onClick={() => handleSelect(customUrl)}
                className="btn btn-primary btn-sm"
                disabled={!customUrl.trim()}
              >
                Alkalmazás
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center" style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => {
              onSelectIcon("");
              onClose();
            }}
            className="btn btn-ghost btn-sm text-dim"
            style={{ fontSize: "0.75rem" }}
          >
            Ikon törlése
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
