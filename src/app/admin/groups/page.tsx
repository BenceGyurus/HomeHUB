"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Users, Shield, Check, Save, CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function GroupsPage() {
  const { t } = useI18n();
  const [groups, setGroups] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [appGroups, setAppGroups] = useState<any[]>([]);
  const [savingGroupId, setSavingGroupId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = () => {
    fetch("/api/admin/groups")
      .then((res) => res.json())
      .then((data) => {
        if (data.groups) setGroups(data.groups);
        if (data.apps) setApps(data.apps);
        if (data.appGroups) setAppGroups(data.appGroups);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = (groupId: number, appId: number) => {
    setAppGroups((prev) => {
      const exists = prev.find((ag) => ag.group_id === groupId && ag.app_id === appId);
      if (exists) {
        return prev.filter((ag) => !(ag.group_id === groupId && ag.app_id === appId));
      } else {
        return [...prev, { group_id: groupId, app_id: appId }];
      }
    });
  };

  const handleSelectAll = (groupId: number) => {
    setAppGroups((prev) => {
      const otherGroups = prev.filter((ag) => ag.group_id !== groupId);
      const allForGroup = apps.map((app) => ({ group_id: groupId, app_id: app.id }));
      return [...otherGroups, ...allForGroup];
    });
  };

  const handleDeselectAll = (groupId: number) => {
    setAppGroups((prev) => prev.filter((ag) => ag.group_id !== groupId));
  };

  const handleSave = async (groupId: number, groupName: string) => {
    setSavingGroupId(groupId);
    setSuccessMessage(null);
    const assignedAppIds = appGroups
      .filter((ag) => ag.group_id === groupId)
      .map((ag) => ag.app_id);

    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, appIds: assignedAppIds }),
      });

      if (res.ok) {
        setSuccessMessage(`"${groupName}" jogosultságai sikeresen mentve!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } finally {
      setSavingGroupId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            {t("groups")} & Hozzáférési Mátrix
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", margin: "0.25rem 0 0 0" }}>
            Authentik felhasználói csoportok hozzárendelése az elérhető alkalmazásokhoz
          </p>
        </div>

        <Link href="/admin/sync" className="btn btn-sm flex items-center gap-1.5">
          <RefreshCw size={14} />
          <span>Csoportok frissítése</span>
        </Link>
      </div>

      {successMessage && (
        <div
          className="card"
          style={{
            padding: "0.75rem 1rem",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.5rem",
            borderColor: "rgba(16, 185, 129, 0.3)",
            backgroundColor: "rgba(16, 185, 129, 0.05)",
            color: "var(--status-online)",
          }}
        >
          <CheckCircle2 size={16} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{successMessage}</span>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="card text-center" style={{ padding: "4rem 2rem" }}>
          <Users size={32} style={{ color: "var(--text-dim)", margin: "0 auto 1rem auto" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", margin: 0 }}>
            Nincsenek szinkronizált csoportok az adatbázisban.
          </p>
          <Link
            href="/admin/sync"
            className="btn btn-primary btn-sm"
            style={{ alignSelf: "center", marginTop: "1rem" }}
          >
            Csoportok szinkronizálása Authentikből
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {groups.map((group) => {
            const groupAssignedCount = appGroups.filter((ag) => ag.group_id === group.id).length;
            return (
              <div key={group.id} className="card" style={{ gap: "1rem" }}>
                {/* Group Header Bar */}
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div className="flex items-center gap-3">
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
                        color: "var(--foreground)",
                      }}
                    >
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="card-title" style={{ fontSize: "1rem" }}>{group.name}</h3>
                        <span className="tag font-mono">{groupAssignedCount} / {apps.length} app</span>
                      </div>
                      <span className="text-dim" style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)" }}>
                        ID: {group.authentik_pk}
                      </span>
                    </div>
                  </div>

                  {/* Group Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(group.id)}
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Mind kijelöl
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeselectAll(group.id)}
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Mind töröl
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(group.id, group.name)}
                      disabled={savingGroupId === group.id}
                      className="btn btn-sm btn-primary flex items-center gap-1.5"
                    >
                      <Save size={12} />
                      <span>{savingGroupId === group.id ? "Mentés..." : t("save")}</span>
                    </button>
                  </div>
                </div>

                {/* App Checkbox Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "0.5rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid #1a1a1a",
                  }}
                >
                  {apps.map((app) => {
                    const isAssigned = appGroups.some(
                      (ag) => ag.group_id === group.id && ag.app_id === app.id
                    );
                    return (
                      <label
                        key={app.id}
                        className="flex items-center gap-2.5"
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderRadius: "var(--radius-sm)",
                          border: `1px solid ${isAssigned ? "var(--border-hover)" : "var(--border)"}`,
                          background: isAssigned ? "#141414" : "transparent",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => handleToggle(group.id, app.id)}
                          style={{ accentColor: "#ffffff" }}
                        />
                        <span style={{ fontSize: "0.8125rem", fontWeight: isAssigned ? 600 : 400, color: isAssigned ? "var(--foreground)" : "var(--text-muted)" }}>
                          {app.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
