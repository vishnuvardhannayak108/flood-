"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar,
  Loader2,
  RefreshCw
} from "lucide-react";
import { UserRole, VerificationStatus } from "@/types/database";

interface UserProfileItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && data.data) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSetRole = async (id: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );

    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates: { role: newRole } }),
      });
    } catch {
      fetchUsers();
    }
  };

  const handleVerify = async (id: string, newStatus: VerificationStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, verificationStatus: newStatus } : u))
    );

    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates: { verificationStatus: newStatus } }),
      });
    } catch {
      fetchUsers();
    }
  };

  const handleToggleActive = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newActive = !user.isActive;

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: newActive } : u))
    );

    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates: { isActive: newActive } }),
      });
    } catch {
      fetchUsers();
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.verificationStatus !== statusFilter) return false;
    if (
      searchQuery &&
      !u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !u.email?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !u.phone?.includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span>User Directory & Responder Access Control</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Role assignments, credentials verification, and security authorization for crisis actors.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            className="text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>

          <span className="px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {users.filter((u) => u.verificationStatus === "pending").length} Pending Responders
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-md border bg-background text-xs font-semibold text-foreground"
            aria-label="Filter user role"
          >
            <option value="all">All Roles</option>
            <option value="citizen">Citizens</option>
            <option value="rescue_team">Rescue Responders</option>
            <option value="volunteer">Volunteers</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border bg-background text-xs font-semibold text-foreground"
            aria-label="Filter verification status"
          >
            <option value="all">All Verifications</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Reading live user profiles directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
          <p className="text-sm font-semibold">No registered users matching this filter.</p>
        </Card>
      ) : (
        /* User Table */
        <div className="rounded-lg border overflow-hidden bg-card shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b text-muted-foreground uppercase text-[10px] font-extrabold tracking-wider">
              <tr>
                <th className="p-3 pl-4">User Identity</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Role Authorization</th>
                <th className="p-3">Verification</th>
                <th className="p-3">Account Status</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 pl-4">
                    <div className="font-bold text-foreground">{user.fullName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      ID: {user.id}
                    </div>
                  </td>

                  <td className="p-3 space-y-0.5">
                    <div className="text-muted-foreground flex items-center gap-1 font-mono">
                      <Mail className="h-3 w-3 shrink-0" />
                      {user.email}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1 font-mono">
                      <Phone className="h-3 w-3 shrink-0 text-primary" />
                      {user.phone}
                    </div>
                  </td>

                  <td className="p-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleSetRole(user.id, e.target.value as UserRole)}
                      className="h-8 px-2 rounded border bg-background text-[11px] font-bold capitalize"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="rescue_team">Rescue Team</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                        user.verificationStatus === "verified"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                          : user.verificationStatus === "pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                          : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                      }`}
                    >
                      {user.verificationStatus === "verified" && (
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      )}
                      {user.verificationStatus}
                    </span>
                  </td>

                  <td className="p-3">
                    <span
                      className={`inline-block h-2 w-2 rounded-full mr-1.5 ${
                        user.isActive ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    <span className="font-semibold text-muted-foreground text-[11px]">
                      {user.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>

                  <td className="p-3 pr-4 text-right space-x-1.5">
                    {user.verificationStatus === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                        onClick={() => handleVerify(user.id, "verified")}
                      >
                        Approve
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 px-2 text-[10px] font-bold ${
                        user.isActive
                          ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      }`}
                      onClick={() => handleToggleActive(user.id)}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
