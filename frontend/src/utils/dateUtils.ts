export const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: 0 },
  { value: "Europe/Berlin", label: "Berlin (UTC+01:00)", offset: 60 },
  { value: "Europe/London", label: "London (UTC+00:00)", offset: 0 },
  { value: "Europe/Paris", label: "Paris (UTC+01:00)", offset: 60 },
  { value: "Europe/Moscow", label: "Moscow (UTC+03:00)", offset: 180 },
  { value: "America/New_York", label: "New York (UTC-05:00)", offset: -300 },
  { value: "America/Chicago", label: "Chicago (UTC-06:00)", offset: -360 },
  { value: "America/Denver", label: "Denver (UTC-07:00)", offset: -420 },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-08:00)", offset: -480 },
  { value: "America/Sao_Paulo", label: "São Paulo (UTC-03:00)", offset: -180 },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+09:00)", offset: 540 },
  { value: "Asia/Shanghai", label: "Shanghai (UTC+08:00)", offset: 480 },
  { value: "Asia/Dubai", label: "Dubai (UTC+04:00)", offset: 240 },
  { value: "Asia/Kolkata", label: "Kolkata (UTC+05:30)", offset: 330 },
  { value: "Australia/Sydney", label: "Sydney (UTC+10:00)", offset: 600 },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12:00)", offset: 720 },
];
export const getUserTimezone = (preferences?: Record<string, any>): string => {
  if (preferences?.timezone) {
    return preferences.timezone;
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
};
export const formatDateForDisplay = (
  dateString: string | null | undefined,
  timezone?: string,
  format: "full" | "date" | "time" | "datetime" = "datetime"
): string => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const userTimezone = timezone || getUserTimezone();
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: userTimezone,
  };
  
  switch (format) {
    case "date":
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      break;
    case "time":
      options.hour = "2-digit";
      options.minute = "2-digit";
      break;
    case "full":
      options.weekday = "long";
      options.year = "numeric";
      options.month = "long";
      options.day = "numeric";
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.timeZoneName = "short";
      break;
    default:
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      options.hour = "2-digit";
      options.minute = "2-digit";
  }
  
  return new Intl.DateTimeFormat("de-DE", options).format(date);
};
export const formatDateForInput = (
  dateString: string | null | undefined,
  timezone?: string
): string => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const userTimezone = timezone || getUserTimezone();
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const dateParts: Record<string, string> = {};
  
  parts.forEach((part) => {
    if (part.type !== "literal") {
      dateParts[part.type] = part.value;
    }
  });
  
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}`;
};
export const convertLocalToUTC = (
  localDateTimeString: string,
  timezone?: string
): string => {
  if (!localDateTimeString) return "";

  const userTimezone = timezone || getUserTimezone();
  const [datePart, timePart] = localDateTimeString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  const zonedBase = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetMinutes = getOffsetForTimezone(userTimezone, zonedBase);
  const utcTimestamp = zonedBase.getTime() - offsetMinutes * 60 * 1000;

  return new Date(utcTimestamp).toISOString();
};

const getOffsetForTimezone = (timezone: string, date: Date): number => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const zoneName = parts.find((part) => part.type === "timeZoneName")?.value;

  if (zoneName) {
    const match = zoneName.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/i);
    if (match) {
      const sign = match[1].startsWith("-") ? -1 : 1;
      const hours = Math.abs(parseInt(match[1], 10));
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      return sign * (hours * 60 + minutes);
    }
  }

  // Fallback based on locale conversion if timeZoneName parsing fails
  const localised = date.toLocaleString("en-US", { timeZone: timezone });
  const parsedDate = new Date(localised);
  return (parsedDate.getTime() - date.getTime()) / 60000;
};
export const getTimezoneLabel = (timezone: string): string => {
  const tz = TIMEZONES.find((t) => t.value === timezone);
  return tz ? tz.label : timezone;
};
