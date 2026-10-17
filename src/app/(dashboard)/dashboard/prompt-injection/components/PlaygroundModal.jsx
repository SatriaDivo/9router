"use client";

import { Modal, Button, Input } from "@/shared/components";
import { usePlaygroundSimulator } from "../hooks/usePlaygroundSimulator";
import { POPULAR_MODELS } from "../constants/promptConstants";

export function PlaygroundModal({ isOpen, onClose, combos = [], targetRule = null }) {
  const sim = usePlaygroundSimulator();

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        targetRule
          ? `Prompt Simulator — Testing: ${targetRule.name}`
          : "Prompt Injection Interactive Simulator & Diff"
      }
      size="xl"
    >
      <div className="flex flex-col gap-4 text-xs">
        <p className="text-text-muted">
          Simulate gateway prompt injection transformations without contacting upstream LLMs or spending API credits.
        </p>

        {sim.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span>{sim.error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Test Inputs */}
          <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-border/50 bg-surface/50">
            <div className="font-semibold text-text flex items-center gap-1.5 border-b border-border/40 pb-2">
              <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
              Simulation Parameters
            </div>

            {/* Model input */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-text">Target Model</label>
              <Input
                placeholder="e.g. openai/gpt-4o or claude-3-7-sonnet"
                value={sim.model}
                onChange={(e) => sim.setModel(e.target.value)}
                className="font-mono text-xs"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {POPULAR_MODELS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => sim.setModel(m)}
                    className="px-1.5 py-0.5 rounded bg-surface hover:bg-surface-hover border border-border/50 text-[10px] font-mono text-text-muted hover:text-text"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Combo input */}
            {combos.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="font-medium text-text">Target Combo (Optional)</label>
                <select
                  value={sim.comboName}
                  onChange={(e) => sim.setComboName(e.target.value)}
                  className="bg-surface border border-border/60 text-xs rounded-lg px-2.5 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                >
                  <option value="">(None - Direct Model Request)</option>
                  {combos.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Original System Prompt */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-text">Original System Prompt (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. You are a helpful assistant."
                value={sim.systemPrompt}
                onChange={(e) => sim.setSystemPrompt(e.target.value)}
                className="w-full bg-surface border border-border/60 rounded-lg p-2 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary resize-y"
              />
            </div>

            {/* User Prompt */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-text">Sample User Prompt *</label>
              <textarea
                rows={3}
                placeholder="Enter sample prompt that triggers or tests rules..."
                value={sim.userPrompt}
                onChange={(e) => sim.setUserPrompt(e.target.value)}
                className="w-full bg-surface border border-border/60 rounded-lg p-2 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary resize-y"
              />
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={sim.runSimulation}
              disabled={sim.simulating}
              className="gap-1.5 mt-2 shadow-sm"
            >
              <span className={`material-symbols-outlined text-[16px] ${sim.simulating ? "animate-spin" : ""}`}>
                {sim.simulating ? "progress_activity" : "play_arrow"}
              </span>
              {sim.simulating ? "Simulating..." : "Execute Simulation"}
            </Button>
          </div>

          {/* Right Column: Results & Diff */}
          <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-border/50 bg-surface/50">
            <div className="font-semibold text-text flex items-center justify-between border-b border-border/40 pb-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-500">
                  analytics
                </span>
                Dry-Run Output & Diff
              </span>
              {sim.result && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    sim.result.modified
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}
                >
                  {sim.result.modified ? "Injected (Mutated)" : "No Rules Triggered"}
                </span>
              )}
            </div>

            {!sim.result ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-text-muted gap-2">
                <span className="material-symbols-outlined text-[28px] opacity-40">science</span>
                <p>Click &quot;Execute Simulation&quot; to test prompt injection matching and see transformed payloads.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Applied Rules Summary */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-semibold text-text">Rules Applied:</div>
                  {sim.result.injectedRules?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sim.result.injectedRules.map((rName) => (
                        <span
                          key={rName}
                          className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium text-[11px] flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[12px]">check</span>
                          {rName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-text-muted">None (Request passed through unmodified)</span>
                  )}
                </div>

                {/* Transformed Messages Payload Preview */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-semibold text-text">
                    Transformed Messages Sent Upstream:
                  </div>
                  <pre className="bg-surface rounded-lg p-2.5 border border-border/50 font-mono text-[11px] text-text max-h-56 overflow-y-auto whitespace-pre-wrap select-text">
                    {JSON.stringify(sim.result.body?.messages || sim.result.body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
