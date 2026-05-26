import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import type {
  ModerationRule,
  ModerationRuleRequest,
  ViolationSeverity,
} from "../../interfaces/admin.interface";

const severityOptions: ViolationSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const emptyForm: ModerationRuleRequest = {
  term: "",
  category: "general",
  language: "vi",
  severity: "HIGH",
  enabled: true,
};

const severityClassName = (severity: ViolationSeverity) => {
  switch (severity) {
    case "LOW":
      return "border border-slate-200 bg-slate-50 text-slate-700";
    case "MEDIUM":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "HIGH":
      return "border border-red-200 bg-red-50 text-red-700";
    case "CRITICAL":
      return "border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-700";
  }
};

const formatTimestamp = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const buildPayload = (form: ModerationRuleRequest): ModerationRuleRequest => ({
  term: form.term.trim(),
  category: form.category.trim(),
  language: form.language.trim().toLowerCase(),
  severity: form.severity,
  enabled: form.enabled ?? true,
});

const isValidForm = (form: ModerationRuleRequest) =>
  form.term.trim() !== "" &&
  form.category.trim() !== "" &&
  form.language.trim() !== "" &&
  severityOptions.includes(form.severity);

const ModerationRulesManager: React.FC = () => {
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [form, setForm] = useState<ModerationRuleRequest>(emptyForm);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const editingRule = useMemo(
    () => rules.find((rule) => rule.id === editingRuleId) ?? null,
    [editingRuleId, rules],
  );

  const loadRules = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.getModerationRules();
      setRules(response);
    } catch (err) {
      console.error("Failed to load moderation rules", err);
      setError("Moderation rules could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingRuleId(null);
    setNotice(null);
  };

  const beginEdit = (rule: ModerationRule) => {
    setEditingRuleId(rule.id);
    setForm({
      term: rule.term,
      category: rule.category,
      language: rule.language,
      severity: rule.severity,
      enabled: rule.enabled,
    });
    setNotice(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!isValidForm(form)) {
      setError("Term, category, language, and severity are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = buildPayload(form);
      const saved = editingRuleId
        ? await adminService.updateModerationRule(editingRuleId, payload)
        : await adminService.createModerationRule(payload);

      setRules((current) => {
        if (!editingRuleId) return [saved, ...current];
        return current.map((rule) => (rule.id === saved.id ? saved : rule));
      });
      setNotice(editingRuleId ? "Rule updated." : "Rule added.");
      setForm(emptyForm);
      setEditingRuleId(null);
    } catch (err) {
      console.error("Failed to save moderation rule", err);
      setError(
        err instanceof Error ? err.message : "Moderation rule could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: ModerationRule) => {
    setTogglingRuleId(rule.id);
    setError(null);
    setNotice(null);

    try {
      const updated = await adminService.updateModerationRuleStatus(
        rule.id,
        !rule.enabled,
      );
      setRules((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(updated.enabled ? "Rule enabled." : "Rule disabled.");
    } catch (err) {
      console.error("Failed to update moderation rule status", err);
      setError(
        err instanceof Error
          ? err.message
          : "Moderation rule status could not be updated.",
      );
    } finally {
      setTogglingRuleId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Dictionary
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Moderation Rules
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Terms are normalized by moderation-service and reloaded into the
            in-memory scanner after each committed change.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRules()}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              {editingRule ? (
                <Edit3 className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-950">
                {editingRule ? "Edit rule" : "Add rule"}
              </h4>
              <p className="text-sm text-slate-500">
                {editingRule
                  ? `Editing ${editingRule.normalizedTerm}`
                  : "Create a term rule for realtime text scanning."}
              </p>
            </div>
          </div>
          {editingRule && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_110px_150px_110px]">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Term
            </span>
            <input
              value={form.term}
              onChange={(event) =>
                setForm((current) => ({ ...current, term: event.target.value }))
              }
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              placeholder="lừa đảo"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
            </span>
            <input
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              placeholder="fraud"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Language
            </span>
            <input
              value={form.language}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  language: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              placeholder="vi"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Severity
            </span>
            <select
              value={form.severity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  severity: event.target.value as ViolationSeverity,
                }))
              }
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
            >
              {severityOptions.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Enabled
            </span>
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  enabled: !(current.enabled ?? true),
                }))
              }
              className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                form.enabled ?? true
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              {form.enabled ?? true ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {form.enabled ?? true ? "On" : "Off"}
            </button>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm">
            {error && <span className="text-red-600">{error}</span>}
            {!error && notice && <span className="text-emerald-600">{notice}</span>}
          </div>
          <button
            type="submit"
            disabled={saving || !isValidForm(form)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {editingRule ? "Save changes" : "Add rule"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Term
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Normalized
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Category
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Severity
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Updated
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading moderation rules...
                  </span>
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                  No moderation rules yet.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 align-top font-medium text-slate-950">
                    {rule.term}
                  </td>
                  <td className="px-5 py-4 align-top font-mono text-xs text-slate-600">
                    {rule.normalizedTerm}
                  </td>
                  <td className="px-5 py-4 align-top text-slate-700">
                    <div>{rule.category}</div>
                    <div className="mt-1 text-xs uppercase text-slate-400">
                      {rule.language}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityClassName(rule.severity)}`}
                    >
                      {rule.severity}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 align-top text-slate-600">
                    {formatTimestamp(rule.updatedAt || rule.createdAt)}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        rule.enabled
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => beginEdit(rule)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                        title="Edit rule"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleRule(rule)}
                        disabled={togglingRuleId === rule.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title={rule.enabled ? "Disable rule" : "Enable rule"}
                      >
                        {togglingRuleId === rule.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : rule.enabled ? (
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ModerationRulesManager;
