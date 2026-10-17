"use client";

import { Button } from "@/shared/components";

export function PromptInjectionHeader({
  onNewRule,
  onOpenPlayground,
  onOpenTemplates,
  onOpenHistory,
  onImport,
  onExport,
  onRefresh,
  loading,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px] text-primary">tune</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            Prompt Injection Studio
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Active Gateway
            </span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Intercept, mutate, and enforce system and user prompts across LLM routes with zero latency
          </p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="gap-1.5 text-text-muted hover:text-text"
          title="Refresh Rules"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>
            refresh
          </span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onImport}
          className="gap-1.5 text-text-muted hover:text-text"
          title="Import Rules from JSON"
        >
          <span className="material-symbols-outlined text-[18px]">upload</span>
          <span className="hidden md:inline">Import</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="gap-1.5 text-text-muted hover:text-text"
          title="Export Rules as JSON"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span className="hidden md:inline">Export</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenHistory}
          className="gap-1.5 text-text-muted hover:text-text"
          title="View Studio Revision History & Audit Trail"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span className="hidden md:inline">History</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenTemplates}
          className="gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">auto_stories</span>
          <span>Templates</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenPlayground}
          className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
          <span>Simulator</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onNewRule}
          className="gap-1.5 shadow-sm shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Rule</span>
        </Button>
      </div>
    </div>
  );
}
