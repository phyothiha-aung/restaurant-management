export const isCalendarDate = (value: string | null): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const addCalendarDays = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const daysBetween = (from: string, to: string) =>
  Math.round(
    (new Date(`${to}T00:00:00.000Z`).getTime() -
      new Date(`${from}T00:00:00.000Z`).getTime()) /
      86_400_000,
  );

export const currentMonthRange = (today: string) => ({
  dateFrom: `${today.slice(0, 7)}-01`,
  dateTo: today,
});

export const currentWeekRange = (today: string) => {
  const day = new Date(`${today}T00:00:00.000Z`).getUTCDay();
  return { dateFrom: addCalendarDays(today, -(day === 0 ? 6 : day - 1)), dateTo: today };
};

export const isValidReportRange = (dateFrom: string, dateTo: string) =>
  isCalendarDate(dateFrom) &&
  isCalendarDate(dateTo) &&
  dateFrom <= dateTo &&
  daysBetween(dateFrom, dateTo) <= 365;
