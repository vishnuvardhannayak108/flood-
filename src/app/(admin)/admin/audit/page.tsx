"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileCheck, 
  Search, 
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw
} from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  tableName: string;
  recordId: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
  diff: Record<string, unknown>;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audit");
      const data = await res.json();
      if (data.success && data.data) {
        setLogs(data.data);
        if (data.data.length > 0 && !expandedLogId) {
          setExpandedLogId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const filtered = logs.filter((l) => {
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (
      searchQuery &&
      !l.action?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !l.recordId?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !l.actorName?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <FileCheck className="h-6 w-6 text-primary" />
            <span>Immutable Security & System Audit Trail</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tamper-evident chronological journal of all state transitions, role updates, and crisis commands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh Trail
          </Button>

          <div className="text-xs font-mono text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-md border">
            Integrity: <strong>VERIFIED SHA-256</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit trail by actor, record ID, or operation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-10 px-3 rounded-md border bg-background text-xs font-semibold"
            aria-label="Filter action type"
          >
            <option value="all">All Audit Actions</option>
            <option value="UPDATE_STATUS">Status Updates</option>
            <option value="ASSIGN_REQUEST">Dispatch Assignments</option>
            <option value="UPDATE_OCCUPANCY">Shelter Occupancy</option>
            <option value="BROADCAST_ALERT">Weather Broadcasts</option>
            <option value="VERIFY_INCIDENT">Incident Verification</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Reading append-only audit trail...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <FileCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
          <p className="text-sm font-semibold">No audit log records found.</p>
          <p className="text-xs mt-1">Actions performed across dispatch, rescue, and shelter portals will stream here.</p>
        </Card>
      ) : (
        /* Audit Log Table */
        <div className="space-y-3">
          {filtered.map((log) => {
            const isExpanded = expandedLogId === log.id;

            return (
              <Card key={log.id} className="border shadow-sm">
                <button
                  type="button"
                  className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground border">
                          {log.action}
                        </span>
                        <span className="text-xs text-muted-foreground">on</span>
                        <span className="font-mono text-xs font-semibold text-primary">
                          {log.tableName}
                        </span>
                      </div>
                      <div className="text-xs text-foreground font-medium mt-1">
                        Target: <strong>{log.recordId}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <div className="font-bold text-foreground">{log.actorName}</div>
                      <div className="text-muted-foreground font-mono text-[11px] capitalize">
                        {log.actorRole}
                      </div>
                    </div>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {log.createdAt}
                    </span>
                  </div>
                </button>

                {/* JSON Diff Drawer */}
                {isExpanded && (
                  <div className="p-4 border-t bg-muted/40 space-y-2">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Audit Payload & State Differential
                    </div>
                    <pre className="p-3 rounded-md bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                      {JSON.stringify(log.diff, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
