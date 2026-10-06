export const formatTimestamp = (
  value: string | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
) =>
  new Intl.DateTimeFormat(undefined, { ...options, timeZone }).format(
    typeof value === "string" ? new Date(value) : value,
  );

export const formatDateOnly = (
  value: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) =>
  new Intl.DateTimeFormat(undefined, { ...options, timeZone: "UTC" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00.000Z`),
  );

export const getBusinessDate = (timeZone: string, instant = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};
