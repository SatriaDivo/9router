"use client";

import { Card } from "@/shared/components";

export function PromptMetricsBar({ rules = [] }) {
  const total = rules.length;
  const active = rules.filter((r) => r.enabled).length;
  const totalHits = rules.reduce((acc, r) => acc + (Number(r.hitCount) || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="p-3.5 flex items-center justify-between border-border/50 bg-surface/50">
        <div>
          <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Total Rules
          </div>
          <div className="text-xl font-bold text-text mt-0.5">{total}</div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-text-muted">
          <span className="material-symbols-outlined text-[18px]">rule</span>
        </div>
      </Card>

      <Card className="p-3.5 flex items-center justify-between border-border/50 bg-surface/50">
        <div>
          <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Active Rules
          </div>
          <div className="text-xl font-bold text-emerald-500 mt-0.5">{active}</div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
        </div>
      </Card>

      <Card className="p-3.5 flex items-center justify-between border-border/50 bg-surface/50">
        <div>
          <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Injections Triggered
          </div>
          <div className="text-xl font-bold text-amber-500 mt-0.5">
            {totalHits.toLocaleString()}
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">bolt</span>
        </div>
      </Card>

      <Card className="p-3.5 flex items-center justify-between border-border/50 bg-surface/50">
        <div>
          <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Engine Overhead
          </div>
          <div className="text-xl font-bold text-sky-500 mt-0.5">&lt; 0.01 ms</div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">speed</span>
        </div>
      </Card>
    </div>
  );
}
