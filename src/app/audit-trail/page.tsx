import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import AuditTrailDashboard from "@/components/audit/AuditTrailDashboard";
import { AUDIT_TRAIL_ROLES } from "@/lib/menu";

export default function AuditTrailPage() {
  return (
    <ProtectedRoute allowedRoles={[...AUDIT_TRAIL_ROLES]}>
      <AppShell>
        <AuditTrailDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}