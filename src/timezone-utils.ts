// Common timezones to ensure they're always available
export const COMMON_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland"
];

/**
 * Get all available timezones using the Intl API
 * @returns Array of timezone strings
 */
export function getAvailableTimezones(): string[] {
  try {
    const timezones = new Set<string>(Intl.supportedValuesOf('timeZone'));
    
    // Ensure common timezones are always included
    COMMON_TIMEZONES.forEach(tz => timezones.add(tz));
    
    return Array.from(timezones).sort();
  } catch (error) {
    console.error("Error getting timezones from Intl API:", error);
    // Fallback to common timezones if the Intl API fails
    return COMMON_TIMEZONES;
  }
}

/**
 * Format the list of available timezones as a string
 * @param prefix Optional prefix text to include before the list (default: "Available timezones")
 * @returns Formatted string with timezone count and comma-separated list
 */
export function getFormattedTimezoneList(prefix: string = "Available timezones"): string {
  const timezones = getAvailableTimezones();
  return `${prefix} (${timezones.length}): ${timezones.join(', ')}`;
}

/**
 * Check if a timezone is valid
 * @param timezone Timezone string to validate
 * @returns boolean indicating if the timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Try to use the timezone with Intl.DateTimeFormat
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the current system timezone
 * @returns The current system timezone string, or "UTC" as fallback
 */
export function getCurrentTimezone(): string {
  try {
    // Get the timezone from the system
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Verify it's a valid timezone
    if (isValidTimezone(timezone)) {
      return timezone;
    } else {
      console.warn(`System timezone ${timezone} is not valid, falling back to UTC`);
      return "UTC";
    }
  } catch (error) {
    console.error("Error getting current timezone:", error);
    return "UTC"; // Default to UTC if there's an error
  }
}

/**
 * Format the current date and time for a given timezone in ISO8601 format
 * @param timezone Timezone string
 * @returns Formatted date-time string in ISO8601 format
 */
export function getCurrentTimeInTimezone(timezone: string): string {
  try {
    const date = new Date();
    
    // Create a formatter that includes the timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      timeZoneName: 'short'
    };
    
    // Get the timezone offset from the formatter
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formattedDate = formatter.format(date);
    const timezonePart = formattedDate.split(' ').pop() || '';
    
    // Format the date in ISO8601 format with the timezone
    // First get the date in the specified timezone
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      fractionalSecondDigits: 3
    });
    
    const parts = tzFormatter.formatToParts(date);
    const dateParts: Record<string, string> = {};
    
    parts.forEach(part => {
      if (part.type !== 'literal') {
        dateParts[part.type] = part.value;
      }
    });
    
    // Format as YYYY-MM-DDTHH:MM:SS.sss±HH:MM (ISO8601)
    const isoDate = `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}.${dateParts.fractionalSecond || '000'}`;
    
    // For proper ISO8601, we need to add the timezone offset
    // We can use the Intl.DateTimeFormat to get the timezone offset
    const tzOffset = new Date().toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'longOffset' }).split(' ').pop() || '';
    
    // Format the final ISO8601 string
    return `${isoDate}${tzOffset.replace('GMT', '')}`;
  } catch (error) {
    console.error(`Error formatting time for timezone ${timezone}:`, error);
    return 'Invalid timezone';
  }
} 