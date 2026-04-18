import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/contexts/AuthContext";
import { verifyAdminSession, type AdminSessionPayload } from "@/lib/adminSessionApi";

export type AdminRole = AdminSessionPayload["role"];

type AdminAccessState = {
  loadingAccess: boolean;
  access: AdminSessionPayload | null;
};

export function useAdminAccess() {
  const { user, loading } = useAdminAuth();
  const [state, setState] = useState<AdminAccessState>({
    loadingAccess: true,
    access: null,
  });

  useEffect(() => {
    let active = true;

    async function loadAccess() {
      if (loading) return;

      if (!user) {
        if (active) {
          setState({ loadingAccess: false, access: null });
        }
        return;
      }

      if (active) {
        setState((prev) => ({ ...prev, loadingAccess: true }));
      }

      try {
        const payload = await verifyAdminSession();
        if (!active) return;
        setState({ loadingAccess: false, access: payload });
      } catch {
        if (!active) return;
        setState({ loadingAccess: false, access: null });
      }
    }

    loadAccess();

    return () => {
      active = false;
    };
  }, [loading, user?.id]);

  const permissions = useMemo(() => {
    const role = state.access?.role;
    const isRoot = Boolean(state.access?.isRoot);

    if (!role) {
      return {
        canSeeSettings: false,
        canManageInternalUsers: false,
        canReadAuditLogs: false,
        canManagePartners: false,
        canDeleteLeads: false,
        canEditCrm: false,
        canReadOnlyOperational: false,
      };
    }

    if (role === "administrador") {
      return {
        canSeeSettings: true,
        canManageInternalUsers: true,
        canReadAuditLogs: true,
        canManagePartners: true,
        canDeleteLeads: true,
        canEditCrm: true,
        canReadOnlyOperational: false,
        isRoot,
      };
    }

    if (role === "analista") {
      return {
        canSeeSettings: false,
        canManageInternalUsers: false,
        canReadAuditLogs: false,
        canManagePartners: false,
        canDeleteLeads: false,
        canEditCrm: false,
        canReadOnlyOperational: true,
        isRoot: false,
      };
    }

    if (role === "vendedor") {
      return {
        canSeeSettings: false,
        canManageInternalUsers: false,
        canReadAuditLogs: false,
        canManagePartners: false,
        canDeleteLeads: false,
        canEditCrm: true,
        canReadOnlyOperational: false,
        isRoot: false,
      };
    }

    return {
      canSeeSettings: false,
      canManageInternalUsers: false,
      canReadAuditLogs: false,
      canManagePartners: false,
      canDeleteLeads: false,
      canEditCrm: false,
      canReadOnlyOperational: false,
      isRoot: false,
    };
  }, [state.access?.role, state.access?.isRoot]);

  return {
    loadingAccess: state.loadingAccess,
    access: state.access,
    role: state.access?.role ?? null,
    permissions,
  };
}
