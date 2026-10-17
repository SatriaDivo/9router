import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  isRuleMatching,
  interpolateVariables,
  executeInjection,
  extractUserText,
  getPromptInjections,
  getPromptInjectionById,
  createPromptInjection,
  updatePromptInjection,
  deletePromptInjection,
  togglePromptInjection,
  reorderPromptInjections,
  recordRuleHits,
  applyPromptInjectionsToBody,
  invalidatePromptInjectionCache,
} from "../../src/lib/db/repos/promptInjectionRepo.js";
import { GET, POST, PUT, DELETE } from "../../src/app/api/prompt-injection/route.js";

describe("Prompt Injection Studio - Advanced Execution Mutations & Wire Formats", () => {
  it("Claude / Anthropic array-of-blocks system format", () => {
    // Array system prepend
    const bodyPrepend = {
      system: [{ type: "text", text: "Base Anthropic System" }],
      messages: [{ role: "user", content: "Hello" }],
    };
    executeInjection(bodyPrepend, "system_prepend", "Prepended Rule");
    expect(bodyPrepend.system).toHaveLength(2);
    expect(bodyPrepend.system[0]).toEqual({ type: "text", text: "Prepended Rule" });
    expect(bodyPrepend.system[1]).toEqual({ type: "text", text: "Base Anthropic System" });

    // Array system append
    const bodyAppend = {
      system: [{ type: "text", text: "Base Anthropic System" }],
      messages: [{ role: "user", content: "Hello" }],
    };
    executeInjection(bodyAppend, "system_append", "Appended Rule");
    expect(bodyAppend.system).toHaveLength(2);
    expect(bodyAppend.system[0]).toEqual({ type: "text", text: "Base Anthropic System" });
    expect(bodyAppend.system[1]).toEqual({ type: "text", text: "Appended Rule" });

    // System override replaces array system with string
    const bodyOverride = {
      system: [{ type: "text", text: "Base Anthropic System" }],
      messages: [{ role: "user", content: "Hello" }],
    };
    executeInjection(bodyOverride, "system_override", "Overridden System");
    expect(bodyOverride.system).toBe("Overridden System");
  });

  it("OpenAI Responses / Instructions format", () => {
    // instructions prepend
    const bodyPrepend = { instructions: "Base instructions" };
    executeInjection(bodyPrepend, "system_prepend", "Prepend this");
    expect(bodyPrepend.instructions).toBe("Prepend this\n\nBase instructions");

    // instructions append
    const bodyAppend = { instructions: "Base instructions" };
    executeInjection(bodyAppend, "system_append", "Append this");
    expect(bodyAppend.instructions).toBe("Base instructions\n\nAppend this");

    // instructions override
    const bodyOverride = { instructions: "Old instructions" };
    executeInjection(bodyOverride, "system_override", "New instructions");
    expect(bodyOverride.instructions).toBe("New instructions");
  });

  it("Google Gemini system_instruction and contents format", () => {
    // Gemini existing system_instruction prepend
    const geminiPrepend = {
      system_instruction: { parts: [{ text: "Base Gemini System" }] },
      contents: [{ role: "user", parts: [{ text: "Hello Gemini" }] }],
    };
    executeInjection(geminiPrepend, "system_prepend", "Gemini Guard");
    expect(geminiPrepend.system_instruction.parts).toHaveLength(2);
    expect(geminiPrepend.system_instruction.parts[0]).toEqual({ text: "Gemini Guard" });

    // Gemini existing system_instruction append
    const geminiAppend = {
      system_instruction: { parts: [{ text: "Base Gemini System" }] },
      contents: [{ role: "user", parts: [{ text: "Hello Gemini" }] }],
    };
    executeInjection(geminiAppend, "system_append", "Gemini Suffix");
    expect(geminiAppend.system_instruction.parts).toHaveLength(2);
    expect(geminiAppend.system_instruction.parts[1]).toEqual({ text: "Gemini Suffix" });

    // Gemini no system_instruction fallback (creates one)
    const geminiNoSys = {
      contents: [{ role: "user", parts: [{ text: "Hello Gemini" }] }],
    };
    executeInjection(geminiNoSys, "system_prepend", "Created System Instruction");
    expect(geminiNoSys.system_instruction).toBeDefined();
    expect(geminiNoSys.system_instruction.parts).toEqual([{ text: "Created System Instruction" }]);

    // Gemini user prepend / append
    const geminiTurns = {
      contents: [
        { role: "user", parts: [{ text: "First question" }] },
        { role: "model", parts: [{ text: "First answer" }] },
        { role: "user", parts: [{ text: "Latest question" }] },
      ],
    };
    executeInjection(geminiTurns, "user_prepend", "[Context]");
    expect(geminiTurns.contents[2].parts[0]).toEqual({ text: "[Context]" });
    expect(geminiTurns.contents[2].parts[1]).toEqual({ text: "Latest question" });

    executeInjection(geminiTurns, "user_append", "[Postscript]");
    expect(geminiTurns.contents[2].parts[2]).toEqual({ text: "[Postscript]" });
  });

  it("OpenAI Developer message role handling & multimodal user messages", () => {
    // Developer role recognized for system prepend
    const bodyDev = {
      messages: [
        { role: "developer", content: "Existing developer instructions" },
        { role: "user", content: "Prompt" },
      ],
    };
    executeInjection(bodyDev, "system_prepend", "Pre-developer");
    expect(bodyDev.messages[0].content).toBe("Pre-developer\n\nExisting developer instructions");

    // Multimodal user content array
    const bodyMultimodal = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image" },
            { type: "image_url", image_url: { url: "http://example.com/test.png" } },
          ],
        },
      ],
    };
    executeInjection(bodyMultimodal, "user_prepend", "IMPORTANT INSTRUCTION");
    expect(bodyMultimodal.messages[0].content[0]).toEqual({ type: "text", text: "IMPORTANT INSTRUCTION" });
    expect(bodyMultimodal.messages[0].content[1]).toEqual({ type: "text", text: "Analyze this image" });

    executeInjection(bodyMultimodal, "user_append", "FINAL REQUIREMENT");
    expect(bodyMultimodal.messages[0].content[3]).toEqual({ type: "text", text: "FINAL REQUIREMENT" });
  });

  it("Fallback when body has no messages, system, or contents", () => {
    const rawBody = { temperature: 0.7 };
    executeInjection(rawBody, "system_prepend", "Fallback System");
    expect(rawBody.system).toBe("Fallback System");
  });
});

describe("Prompt Injection Studio - extractUserText across formats", () => {
  it("extracts text from OpenAI multi-part multimodal content", () => {
    const body = {
      messages: [
        { role: "system", content: "System" },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this chart" },
            { type: "image_url", image_url: { url: "http://img.png" } },
            { type: "text", text: "and tell me the trend" },
          ],
        },
      ],
    };
    expect(extractUserText(body)).toBe("Analyze this chart and tell me the trend");
  });

  it("extracts text from Gemini contents format", () => {
    const body = {
      contents: [
        { role: "user", parts: [{ text: "Hello Gemini" }, { text: "Explain quantum mechanics" }] },
      ],
    };
    expect(extractUserText(body)).toBe("Hello Gemini\nExplain quantum mechanics");
  });

  it("extracts text from direct input format", () => {
    expect(extractUserText({ input: "Direct user prompt" })).toBe("Direct user prompt");
    expect(extractUserText({ input: [{ role: "user", content: "Input message" }] })).toBe("Input message");
    expect(extractUserText(null)).toBe("");
    expect(extractUserText({})).toBe("");
  });
});

describe("Prompt Injection Studio - Edge Case Variable Interpolation", () => {
  it("interpolates multiple occurrences and handles missing context gracefully", () => {
    const template = "{{model}} vs {{model}} on {{weekday}} ({{provider}})";
    const res = interpolateVariables(template, { modelStr: "claude-3-7-sonnet", provider: "anthropic" });
    expect(res).toContain("claude-3-7-sonnet vs claude-3-7-sonnet");
    expect(res).toContain("(anthropic)");
    expect(res).toMatch(/on (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/);
  });

  it("handles empty and non-string templates safely", () => {
    expect(interpolateVariables("")).toBe("");
    expect(interpolateVariables(null)).toBe("");
    expect(interpolateVariables(undefined)).toBe("");
    expect(interpolateVariables(123)).toBe("");
  });
});

describe("Prompt Injection Studio - Repository DB CRUD & In-Memory Caching", () => {
  let createdId = null;

  beforeEach(() => {
    invalidatePromptInjectionCache();
  });

  afterEach(async () => {
    if (createdId) {
      await deletePromptInjection(createdId);
      createdId = null;
    }
  });

  it("creates, reads, updates, and deletes rules cleanly", async () => {
    // 1. Create
    const created = await createPromptInjection({
      name: "Test Red Team Guard",
      description: "Test description",
      enabled: true,
      targetType: "models",
      targetModels: ["test-model-*"],
      position: "system_prepend",
      content: "Strict Policy Active",
      priority: 5,
    });
    expect(created.id).toBeDefined();
    expect(created.name).toBe("Test Red Team Guard");
    expect(created.priority).toBe(5);
    createdId = created.id;

    // 2. Read by ID
    const fetched = await getPromptInjectionById(createdId);
    expect(fetched).not.toBeNull();
    expect(fetched.name).toBe("Test Red Team Guard");

    // 3. Update
    const updated = await updatePromptInjection(createdId, {
      name: "Updated Red Team Guard",
      priority: 2,
    });
    expect(updated.name).toBe("Updated Red Team Guard");
    expect(updated.priority).toBe(2);

    // 4. Toggle
    const toggled = await togglePromptInjection(createdId, false);
    expect(toggled.enabled).toBe(false);

    // 5. Delete
    const deleted = await deletePromptInjection(createdId);
    expect(deleted).toBe(true);
    createdId = null;

    const notFound = await getPromptInjectionById(created.id);
    expect(notFound).toBeNull();
  });

  it("reorders rules and updates priority ascending", async () => {
    const r1 = await createPromptInjection({ name: "Rule A", content: "A", priority: 10 });
    const r2 = await createPromptInjection({ name: "Rule B", content: "B", priority: 20 });

    try {
      // Reorder r2 to index 0, r1 to index 1
      const ok = await reorderPromptInjections([r2.id, r1.id]);
      expect(ok).toBe(true);

      const rules = await getPromptInjections(false);
      const fetchedR2 = rules.find((r) => r.id === r2.id);
      const fetchedR1 = rules.find((r) => r.id === r1.id);

      expect(fetchedR2.priority).toBe(1);
      expect(fetchedR1.priority).toBe(2);
    } finally {
      await deletePromptInjection(r1.id);
      await deletePromptInjection(r2.id);
    }
  });

  it("records rule hits and updates in-memory cache", async () => {
    const rule = await createPromptInjection({ name: "Telemetry Rule", content: "Telemetry", priority: 1 });
    createdId = rule.id;

    // Prime cache
    await getPromptInjections(true);

    await recordRuleHits([rule.id]);
    const updated = await getPromptInjectionById(rule.id);
    expect(updated.hitCount).toBe(1);
    expect(updated.lastTriggeredAt).toBeDefined();
  });
});

describe("Prompt Injection Studio - applyPromptInjectionsToBody Pipeline Integration", () => {
  let ruleId = null;

  afterEach(async () => {
    if (ruleId) {
      await deletePromptInjection(ruleId);
      ruleId = null;
    }
  });

  it("applies matching rule and guarantees idempotency against duplicate runs", async () => {
    const rule = await createPromptInjection({
      name: "Idempotency Rule",
      content: "[TEST_INJECTION]",
      position: "system_prepend",
      targetType: "all",
      priority: 1,
    });
    ruleId = rule.id;

    const body = {
      messages: [{ role: "user", content: "Hello" }],
    };

    // First pass (e.g. combo resolution stage)
    const result1 = await applyPromptInjectionsToBody(body, { modelStr: "gpt-4o" });
    expect(result1.modified).toBe(true);
    expect(result1.injectedRules).toContain("Idempotency Rule");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("[TEST_INJECTION]");

    // Second pass (e.g. provider resolution stage) - MUST NOT DUPLICATE
    const result2 = await applyPromptInjectionsToBody(body, { modelStr: "gpt-4o", provider: "openai" });
    expect(result2.modified).toBe(false);
    expect(result2.injectedRules).toHaveLength(0);
    expect(body.messages).toHaveLength(2); // still 1 system + 1 user
  });

  it("fails open gracefully on malformed inputs without throwing", async () => {
    expect(await applyPromptInjectionsToBody(null)).toEqual({ modified: false, injectedRules: [] });
    expect(await applyPromptInjectionsToBody("invalid string")).toEqual({ modified: false, injectedRules: [] });
  });
});

describe("Prompt Injection Studio - API Route Contracts (/api/prompt-injection)", () => {
  let createdApiRuleId = null;

  afterEach(async () => {
    if (createdApiRuleId) {
      await deletePromptInjection(createdApiRuleId);
      createdApiRuleId = null;
    }
  });

  it("GET returns rules list", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.rules)).toBe(true);
  });

  it("POST creates rule with validation", async () => {
    // Missing name
    const reqInvalid = new Request("http://localhost/api/prompt-injection", {
      method: "POST",
      body: JSON.stringify({ content: "Some content" }),
    });
    const resInvalid = await POST(reqInvalid);
    expect(resInvalid.status).toBe(400);

    // Missing content
    const reqNoContent = new Request("http://localhost/api/prompt-injection", {
      method: "POST",
      body: JSON.stringify({ name: "Rule Name", content: "   " }),
    });
    const resNoContent = await POST(reqNoContent);
    expect(resNoContent.status).toBe(400);

    // Valid rule creation
    const reqValid = new Request("http://localhost/api/prompt-injection", {
      method: "POST",
      body: JSON.stringify({
        name: "API Created Rule",
        content: "System Prompt Injection Content",
        targetType: "models",
        targetModels: ["gpt-4o"],
        position: "system_prepend",
      }),
    });
    const resValid = await POST(reqValid);
    expect(resValid.status).toBe(201);
    const data = await resValid.json();
    expect(data.rule?.id).toBeDefined();
    createdApiRuleId = data.rule.id;
  });

  it("POST action='test' simulates dry-run without writing to DB", async () => {
    const testReq = new Request("http://localhost/api/prompt-injection", {
      method: "POST",
      body: JSON.stringify({
        action: "test",
        rule: {
          enabled: true,
          content: "Simulated System Rule for {{model}}",
          targetType: "all",
          position: "system_prepend",
        },
        sampleBody: {
          messages: [{ role: "user", content: "Hello AI" }],
        },
        context: {
          modelStr: "gpt-4o",
        },
      }),
    });

    const res = await POST(testReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.matches).toBe(true);
    expect(data.promptText).toBe("Simulated System Rule for gpt-4o");
    expect(data.resultBody.messages[0]).toEqual({
      role: "system",
      content: "Simulated System Rule for gpt-4o",
    });
  });

  it("PUT updates rule and validates existence", async () => {
    const rule = await createPromptInjection({ name: "Initial Rule", content: "Initial Content" });
    createdApiRuleId = rule.id;

    // Missing ID
    const reqNoId = new Request("http://localhost/api/prompt-injection", {
      method: "PUT",
      body: JSON.stringify({ name: "New Name" }),
    });
    const resNoId = await PUT(reqNoId);
    expect(resNoId.status).toBe(400);

    // Not found ID
    const reqNotFound = new Request("http://localhost/api/prompt-injection", {
      method: "PUT",
      body: JSON.stringify({ id: "non-existent-id-12345", name: "New Name" }),
    });
    const resNotFound = await PUT(reqNotFound);
    expect(resNotFound.status).toBe(404);

    // Valid update
    const reqUpdate = new Request("http://localhost/api/prompt-injection", {
      method: "PUT",
      body: JSON.stringify({ id: rule.id, name: "Renamed Rule", content: "Updated Content" }),
    });
    const resUpdate = await PUT(reqUpdate);
    expect(resUpdate.status).toBe(200);
    const data = await resUpdate.json();
    expect(data.rule.name).toBe("Renamed Rule");
  });

  it("DELETE validates id and handles non-existent rule", async () => {
    // Missing ID
    const reqNoId = new Request("http://localhost/api/prompt-injection", { method: "DELETE" });
    const resNoId = await DELETE(reqNoId);
    expect(resNoId.status).toBe(400);

    // Non-existent ID
    const reqNotFound = new Request("http://localhost/api/prompt-injection?id=non-existent-id", { method: "DELETE" });
    const resNotFound = await DELETE(reqNotFound);
    expect(resNotFound.status).toBe(404);
  });
});

describe("Security, ReDoS Guard, and Advanced Protocol Hardening", () => {
  it("enforces non-enumerable _appliedPromptInjections to prevent JSON leaks to upstream LLMs", async () => {
    const body = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello world" }],
    };

    // Inject rule
    const rule = await createPromptInjection({
      name: "Leakage Test Rule",
      targetType: "all",
      content: "SYSTEM_SECURITY_TEST",
      position: "system_prepend",
    });

    try {
      await applyPromptInjectionsToBody(body, { modelStr: "gpt-4o" });
      expect(body._appliedPromptInjections).toContain(rule.id);

      // Crucial verification: JSON serialization MUST NOT contain _appliedPromptInjections
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain("_appliedPromptInjections");
      expect(Object.keys(body)).not.toContain("_appliedPromptInjections");
    } finally {
      await deletePromptInjection(rule.id);
    }
  });

  it("supports middle wildcard patterns in model matching", async () => {
    const rule = {
      enabled: true,
      content: "Middle wildcard test",
      targetType: "models",
      targetModels: ["claude-*-sonnet", "*-instruct"],
    };

    expect(await isRuleMatching(rule, { modelStr: "claude-3-7-sonnet" })).toBe(true);
    expect(await isRuleMatching(rule, { modelStr: "claude-3-5-sonnet" })).toBe(true);
    expect(await isRuleMatching(rule, { modelStr: "deepseek-v3-instruct" })).toBe(true);
    expect(await isRuleMatching(rule, { modelStr: "claude-3-haiku" })).toBe(false);
    expect(await isRuleMatching(rule, { modelStr: "gpt-4o" })).toBe(false);
  });

  it("guards against ReDoS attacks and dangerous regex patterns", async () => {
    // 1. Oversized pattern (> 250 chars)
    const longPattern = "a".repeat(251);
    const ruleLong = {
      enabled: true,
      content: "Long regex",
      targetType: "all",
      matchCondition: { type: "regex", pattern: longPattern },
    };
    expect(await isRuleMatching(ruleLong, { userText: "test" })).toBe(false);

    // 2. Dangerous catastrophic backtracking pattern (nested quantifiers)
    const ruleNested = {
      enabled: true,
      content: "Catastrophic regex",
      targetType: "all",
      matchCondition: { type: "regex", pattern: "(a+)+" },
    };
    expect(await isRuleMatching(ruleNested, { userText: "aaaaaaaaaaaaaaaaaaaa!" })).toBe(false);

    // 3. Normal safe regex works
    const ruleSafe = {
      enabled: true,
      content: "Safe regex",
      targetType: "all",
      matchCondition: { type: "regex", pattern: "^order-\\d{4}$" },
    };
    expect(await isRuleMatching(ruleSafe, { userText: "order-1234" })).toBe(true);
    expect(await isRuleMatching(ruleSafe, { userText: "order-xyz" })).toBe(false);
  });

  it("handles Anthropic Claude wire format safely when body.system is initially undefined", () => {
    const body = {
      model: "claude-3-7-sonnet",
      messages: [{ role: "user", content: "Write a poem" }],
    };

    executeInjection(body, "system_prepend", "You are an expert poet.", {
      provider: "anthropic",
      modelStr: "claude-3-7-sonnet",
    });

    // Must set body.system directly and NOT unshift role: 'system' into body.messages
    expect(body.system).toBe("You are an expert poet.");
    expect(body.messages.length).toBe(1);
    expect(body.messages[0].role).toBe("user");
  });

  it("reorders rules and updates priority deterministically", async () => {
    const r1 = await createPromptInjection({
      name: "First Priority Rule",
      targetType: "all",
      content: "FIRST",
      priority: 1,
    });
    const r2 = await createPromptInjection({
      name: "Second Priority Rule",
      targetType: "all",
      content: "SECOND",
      priority: 2,
    });

    try {
      // Reorder via PUT route
      const reqReorder = new Request("http://localhost/api/prompt-injection", {
        method: "PUT",
        body: JSON.stringify({ action: "reorder", orderedIds: [r2.id, r1.id] }),
      });
      const resReorder = await PUT(reqReorder);
      expect(resReorder.status).toBe(200);

      const all = await getPromptInjections();
      const updatedR2 = all.find((r) => r.id === r2.id);
      const updatedR1 = all.find((r) => r.id === r1.id);
      expect(updatedR2.priority).toBe(1);
      expect(updatedR1.priority).toBe(2);
    } finally {
      await deletePromptInjection(r1.id);
      await deletePromptInjection(r2.id);
    }
  });

  it("evaluates gateway simulation via POST with simulate: true", async () => {
    const r = await createPromptInjection({
      name: "Sim Test Rule",
      targetType: "all",
      content: "SIM_INJECTED_SYSTEM",
      position: "system_prepend",
    });

    try {
      const reqSim = new Request("http://localhost/api/prompt-injection", {
        method: "POST",
        body: JSON.stringify({
          simulate: true,
          model: "openai/gpt-4o",
          body: {
            messages: [{ role: "user", content: "Tell me a joke" }],
          },
        }),
      });
      const resSim = await POST(reqSim);
      expect(resSim.status).toBe(200);
      const data = await resSim.json();
      expect(data.modified).toBe(true);
      expect(data.injectedRules).toContain("Sim Test Rule");
      expect(data.body.messages.some((m) => m.content.includes("SIM_INJECTED_SYSTEM"))).toBe(true);
    } finally {
      await deletePromptInjection(r.id);
    }
  });
});
