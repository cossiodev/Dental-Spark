import React from 'react';
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
    scheduled: { label: "Programada", variant: "outline" },
    confirmed: { label: "Confirmada", variant: "secondary" },
    completed: { label: "Completada", variant: "default" },
    cancelled: { label: "Cancelada", variant: "destructive" },
  };

  const { label, variant } = statusMap[status] || { label: status, variant: "outline" };
  
  return <Badge variant={variant}>{label}</Badge>;
} 