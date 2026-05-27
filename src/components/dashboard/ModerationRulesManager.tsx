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
  ModerationRuleCategory,
  ModerationRuleLanguage,
  ModerationRuleRequest,
  ViolationSeverity,
} from "../../interfaces/admin.interface";

const severityOptions: ViolationSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const categoryOptions: Array<{ value: ModerationRuleCategory; label: string }> = [
  { value: "general", label: "Chung" },
  { value: "profanity", label: "Từ ngữ tục tĩu" },
  { value: "fraud", label: "Lừa đảo" },
  { value: "abuse", label: "Quấy rối / lạm dụng" },
  { value: "security", label: "An toàn hệ thống" },
];

const languageOptions: Array<{ value: ModerationRuleLanguage; label: string }> = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "Tiếng Anh" },
];

const emptyForm: ModerationRuleRequest = {
  term: "",
  category: "general",
  language: "vi",
  severity: "HIGH",
  enabled: true,
};

const isKnownCategory = (value: string): value is ModerationRuleCategory =>
  categoryOptions.some((option) => option.value === value);

const isKnownLanguage = (value: string): value is ModerationRuleLanguage =>
  languageOptions.some((option) => option.value === value);

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

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const severityLabel = (severity: ViolationSeverity) => {
  switch (severity) {
    case "LOW":
      return "Thấp";
    case "MEDIUM":
      return "Trung bình";
    case "HIGH":
      return "Cao";
    case "CRITICAL":
      return "Rất cao";
    default:
      return severity;
  }
};

const categoryLabel = (category: string) =>
  categoryOptions.find((option) => option.value === category)?.label ?? category;

const languageLabel = (language: string) =>
  languageOptions.find((option) => option.value === language)?.label ?? language;

const buildPayload = (form: ModerationRuleRequest): ModerationRuleRequest => ({
  term: form.term.trim(),
  category: form.category,
  language: form.language,
  severity: form.severity,
  enabled: form.enabled ?? true,
});

const isValidForm = (form: ModerationRuleRequest) =>
  form.term.trim() !== "" &&
  categoryOptions.some((option) => option.value === form.category) &&
  languageOptions.some((option) => option.value === form.language) &&
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
      setError("Không thể tải danh sách quy tắc kiểm duyệt.");
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
    const category = isKnownCategory(rule.category) ? rule.category : "general";
    const language = isKnownLanguage(rule.language) ? rule.language : "vi";

    setEditingRuleId(rule.id);
    setForm({
      term: rule.term,
      category,
      language,
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
      setError("Vui lòng nhập từ khóa và chọn đầy đủ nhóm, ngôn ngữ, mức độ.");
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
      setNotice(editingRuleId ? "Đã cập nhật quy tắc." : "Đã thêm quy tắc.");
      setForm(emptyForm);
      setEditingRuleId(null);
    } catch (err) {
      console.error("Failed to save moderation rule", err);
      setError(
        err instanceof Error ? err.message : "Không thể lưu quy tắc kiểm duyệt.",
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
      setNotice(updated.enabled ? "Đã bật quy tắc." : "Đã tắt quy tắc.");
    } catch (err) {
      console.error("Failed to update moderation rule status", err);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái quy tắc.",
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
            Từ điển kiểm duyệt
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Quy tắc kiểm duyệt
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Các từ khóa được chuẩn hóa và nạp vào bộ quét trong bộ nhớ của
            moderation-service sau mỗi lần thêm hoặc cập nhật qua giao diện.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRules()}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Tải lại
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
                {editingRule ? "Chỉnh sửa quy tắc" : "Thêm quy tắc"}
              </h4>
              <p className="text-sm text-slate-500">
                {editingRule
                  ? `Đang chỉnh sửa ${editingRule.normalizedTerm}`
                  : "Tạo từ khóa dùng để quét tin nhắn văn bản theo thời gian gần thực."}
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
              Hủy
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_160px_150px_110px]">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Từ khóa
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
              Nhóm
            </span>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value as ModerationRuleCategory,
                }))
              }
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ngôn ngữ
            </span>
            <select
              value={form.language}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  language: event.target.value as ModerationRuleLanguage,
                }))
              }
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mức độ
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
                  {severityLabel(severity)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trạng thái
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
              {form.enabled ?? true ? "Bật" : "Tắt"}
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
            {editingRule ? "Lưu thay đổi" : "Thêm quy tắc"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Từ khóa
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Chuẩn hóa
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Nhóm
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Mức độ
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Cập nhật
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                Trạng thái
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải quy tắc kiểm duyệt...
                  </span>
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                  Chưa có quy tắc kiểm duyệt.
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
                    <div>{categoryLabel(rule.category)}</div>
                    <div className="mt-1 text-xs uppercase text-slate-400">
                      {languageLabel(rule.language)}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityClassName(rule.severity)}`}
                    >
                      {severityLabel(rule.severity)}
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
                      {rule.enabled ? "Đang bật" : "Đang tắt"}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => beginEdit(rule)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                        title="Chỉnh sửa quy tắc"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleRule(rule)}
                        disabled={togglingRuleId === rule.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title={rule.enabled ? "Tắt quy tắc" : "Bật quy tắc"}
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
