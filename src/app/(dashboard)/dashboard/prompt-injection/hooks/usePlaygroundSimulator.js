import { useState } from "react";

export function usePlaygroundSimulator() {
  const [model, setModel] = useState("openai/gpt-4o");
  const [comboName, setComboName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [userPrompt, setUserPrompt] = useState("Can you please help me write a Python web scraper?");
  const [systemPrompt, setSystemPrompt] = useState("You are an AI helpful assistant.");
  const [activeRuleId, setActiveRuleId] = useState(""); // empty = test all active rules
  const [result, setResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);

  const runSimulation = async () => {
    setSimulating(true);
    setError(null);
    try {
      const res = await fetch("/api/prompt-injection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulate: true,
          model,
          comboName: comboName || undefined,
          apiKey: apiKey || undefined,
          ruleId: activeRuleId || undefined,
          body: {
            messages: [
              ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
              { role: "user", content: userPrompt },
            ],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to run simulation");
    } finally {
      setSimulating(false);
    }
  };

  const resetPlayground = () => {
    setModel("openai/gpt-4o");
    setComboName("");
    setApiKey("");
    setUserPrompt("Can you please help me write a Python web scraper?");
    setSystemPrompt("You are an AI helpful assistant.");
    setActiveRuleId("");
    setResult(null);
    setError(null);
  };

  return {
    model,
    setModel,
    comboName,
    setComboName,
    apiKey,
    setApiKey,
    userPrompt,
    setUserPrompt,
    systemPrompt,
    setSystemPrompt,
    activeRuleId,
    setActiveRuleId,
    result,
    simulating,
    error,
    runSimulation,
    resetPlayground,
  };
}
