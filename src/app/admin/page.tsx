import db from "@/lib/db";

export default async function AdminDashboard() {
  const appsCount = (db.prepare('SELECT count(*) as count FROM apps').get() as any).count;
  const groupsCount = (db.prepare('SELECT count(*) as count FROM groups').get() as any).count;
  
  return (
    <div>
      <h1 style={{ margin: "0 0 2rem 0", fontSize: "1.875rem" }}>Áttekintés</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
        <div className="card">
          <h3 className="card-title text-muted" style={{ fontSize: "0.875rem", textTransform: "uppercase" }}>Alkalmazások</h3>
          <p style={{ fontSize: "2rem", fontWeight: 600, margin: "0.5rem 0 0 0" }}>{appsCount}</p>
        </div>
        
        <div className="card">
          <h3 className="card-title text-muted" style={{ fontSize: "0.875rem", textTransform: "uppercase" }}>Csoportok</h3>
          <p style={{ fontSize: "2rem", fontWeight: 600, margin: "0.5rem 0 0 0" }}>{groupsCount}</p>
        </div>
      </div>
    </div>
  );
}
