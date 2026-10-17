"use client";

import { Input, Select } from "@/shared/components";
import { TARGET_TYPE_LABELS, POSITION_LABELS } from "../constants/promptConstants";

export function PromptFilterControls({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  targetFilter,
  onTargetChange,
  positionFilter,
  onPositionChange,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
      <div className="relative flex-1 max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
          search
        </span>
        <Input
          placeholder="Filter rules by name, target, or content..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 text-xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-surface border border-border/60 text-xs rounded-lg px-2.5 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Status: All</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <select
          value={targetFilter}
          onChange={(e) => onTargetChange(e.target.value)}
          className="bg-surface border border-border/60 text-xs rounded-lg px-2.5 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Target: All</option>
          <option value="all_traffic">Global Traffic</option>
          <option value="models">Models</option>
          <option value="combos">Combos</option>
        </select>

        <select
          value={positionFilter}
          onChange={(e) => onPositionChange(e.target.value)}
          className="bg-surface border border-border/60 text-xs rounded-lg px-2.5 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Position: All</option>
          {Object.entries(POSITION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
