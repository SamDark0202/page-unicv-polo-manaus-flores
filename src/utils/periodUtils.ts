export type PeriodType = "todos" | "mes" | "ano";

export function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getPreviousMonthValue() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getCurrentYearValue() {
  return String(new Date().getFullYear());
}

export function getPreviousYearValue() {
  return String(new Date().getFullYear() - 1);
}

function toDatePart(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function isInPeriod(
  dateValue: string | null | undefined,
  periodType: PeriodType,
  month: string,
  year: string,
) {
  if (periodType === "todos") return true;

  const datePart = toDatePart(dateValue);
  if (!datePart) return false;

  if (periodType === "mes") {
    if (!month) return true;
    return datePart.startsWith(`${month}-`);
  }

  if (!year) return true;
  return datePart.startsWith(`${year}-`);
}
