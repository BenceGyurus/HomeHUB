"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

export default function GroupsPage() {
  const { t } = useI18n();
  const [groups, setGroups] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [appGroups, setAppGroups] = useState<any[]>([]);
  const [savingGroupId, setSavingGroupId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/groups")
      .then(res => res.json())
      .then(data => {
        if (data.groups) setGroups(data.groups);
        if (data.apps) setApps(data.apps);
        if (data.appGroups) setAppGroups(data.appGroups);
      });
  }, []);

  const handleToggle = (groupId: number, appId: number) => {
    setAppGroups(prev => {
      const exists = prev.find(ag => ag.group_id === groupId && ag.app_id === appId);
      if (exists) {
        return prev.filter(ag => !(ag.group_id === groupId && ag.app_id === appId));
      } else {
        return [...prev, { group_id: groupId, app_id: appId }];
      }
    });
  };

  const handleSave = async (groupId: number) => {
    setSavingGroupId(groupId);
    const assignedAppIds = appGroups.filter(ag => ag.group_id === groupId).map(ag => ag.app_id);
    
    await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, appIds: assignedAppIds }),
    });
    
    setSavingGroupId(null);
  };

  return (
    <div>
      <h1 style={{ margin: "0 0 2rem 0", fontSize: "1.875rem" }}>{t("groups")} & Alkalmazások</h1>
      
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Állítsd be, hogy az egyes Authentik csoportok tagjai mely alkalmazásokat láthatják a főoldalon.
        Aki semmilyen csoporthoz nem tartozik (vagy lokális admin), az is látja azokat, amiknél "Láthatóság" be van kapcsolva, 
        de ha beállítod a csoportokat, akkor a főoldal szűrni fogja az appokat a bejelentkezett user csoportjai szerint.
      </p>

      {groups.length === 0 ? (
        <div className="card text-center text-muted">
          Nincsenek szinkronizált csoportok. Menj a Szinkronizálás menüpontba.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {groups.map(group => (
            <div key={group.id} className="card" style={{ padding: "1.5rem" }}>
              <div className="flex justify-between items-center" style={{ marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.25rem", margin: 0 }}>{group.name}</h2>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleSave(group.id)}
                  disabled={savingGroupId === group.id}
                >
                  {savingGroupId === group.id ? "Mentés..." : t("save")}
                </button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {apps.map(app => {
                  const isAssigned = appGroups.some(ag => ag.group_id === group.id && ag.app_id === app.id);
                  return (
                    <label key={app.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", backgroundColor: isAssigned ? "rgba(59, 130, 246, 0.1)" : "transparent" }}>
                      <input 
                        type="checkbox" 
                        checked={isAssigned} 
                        onChange={() => handleToggle(group.id, app.id)} 
                      />
                      {app.name}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
