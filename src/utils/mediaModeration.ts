import type { Message, MessageMediaWarning } from "../types/message.type";

const NON_BLOCKING_WARNING_SOURCES = new Set(["rekognition_error"]);
const NON_BLOCKING_WARNING_REASONS = new Set([
  "moderation_unavailable",
  "moderation_timeout",
  "moderation_service_error",
]);

const normalizeWarningIndex = (warning: MessageMediaWarning) =>
  Number(warning.index ?? 0);

const normalizeText = (value: unknown) =>
  String(value || "").trim().toLowerCase();

export const isBlockingMediaWarning = (warning?: MessageMediaWarning | null) => {
  if (!warning) return false;

  const source = normalizeText(warning.source);
  const reason = normalizeText(warning.reason);

  if (NON_BLOCKING_WARNING_SOURCES.has(source)) return false;
  if (NON_BLOCKING_WARNING_REASONS.has(reason)) return false;

  return true;
};

export const isMessageMediaFlagged = (message: Message, index = 0) => {
  const warnings = message.system_meta?.media_warnings || [];
  const matchingWarnings = warnings.filter(
    (warning) => normalizeWarningIndex(warning) === index,
  );

  if (matchingWarnings.length > 0) {
    return matchingWarnings.some(isBlockingMediaWarning);
  }

  return (
    warnings.length === 0 &&
    normalizeText(message.system_meta?.media_policy_status) === "flagged"
  );
};
