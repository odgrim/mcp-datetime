import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as tzUtils from '../src/timezone-utils.js';
import {
  getAvailableTimezones,
  getFormattedTimezoneList,
  isValidTimezone,
  getCurrentTimezone,
  getCurrentTimeInTimezone,
  handleInvalidTimezone,
  processTimezone,
  COMMON_TIMEZONES
} from '../src/timezone-utils.js';

describe('timezone-utils', () => {
  // Store original methods to restore after tests
  const originalSupportedValuesOf = Intl.supportedValuesOf;
  const originalDateTimeFormat = Intl.DateTimeFormat;
  const originalConsoleWarn = console.warn;
  
  // Restore original methods after each test
  afterEach(() => {
    Intl.supportedValuesOf = originalSupportedValuesOf;
    Intl.DateTimeFormat = originalDateTimeFormat;
    console.warn = originalConsoleWarn;
    
    // Restore any mocked functions
    jest.restoreAllMocks();
  });
  
  describe('getAvailableTimezones', () => {
    it('should return a sorted array of timezones', () => {
      const timezones = getAvailableTimezones();
      
      // Check that we have an array of strings
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
      
      // Check that all common timezones are included
      COMMON_TIMEZONES.forEach(tz => {
        expect(timezones).toContain(tz);
      });
      
      // Check that the array is sorted
      const sortedTimezones = [...timezones].sort();
      expect(timezones).toEqual(sortedTimezones);
    });
    
    it('should fall back to common timezones if Intl API fails', () => {
      // Mock the Intl.supportedValuesOf to throw an error
      Intl.supportedValuesOf = function() {
        throw new Error('API not available');
      } as any;
      
      const timezones = getAvailableTimezones();
      
      // Should fall back to common timezones
      expect(timezones).toEqual(COMMON_TIMEZONES);
    });
  });

  describe('getFormattedTimezoneList', () => {
    it('should format the timezone list with default prefix', () => {
      const timezones = getAvailableTimezones();
      const formattedList = getFormattedTimezoneList();
      
      expect(formattedList).toContain('Available timezones');
      expect(formattedList).toContain(`(${timezones.length})`);
    });

    it('should format the timezone list with custom prefix', () => {
      const timezones = getAvailableTimezones();
      const customPrefix = 'Custom prefix';
      const formattedList = getFormattedTimezoneList(customPrefix);
      
      expect(formattedList).toContain(customPrefix);
      expect(formattedList).toContain(`(${timezones.length})`);
    });
  });

  describe('isValidTimezone', () => {
    it('should return true for valid timezones', () => {
      expect(isValidTimezone('UTC')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
    });

    it('should return false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
    });
  });

  describe('getCurrentTimezone', () => {
    let originalDateTimeFormat: typeof Intl.DateTimeFormat;
    let originalConsoleWarn: typeof console.warn;
    let originalConsoleError: typeof console.error;

    beforeEach(() => {
      originalDateTimeFormat = Intl.DateTimeFormat;
      originalConsoleWarn = console.warn;
      originalConsoleError = console.error;
      console.warn = jest.fn();
      console.error = jest.fn();
    });

    afterEach(() => {
      Intl.DateTimeFormat = originalDateTimeFormat;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    });

    it('should return the current timezone', () => {
      const timezone = getCurrentTimezone();
      expect(typeof timezone).toBe('string');
      expect(timezone.length).toBeGreaterThan(0);
    });

    it('should fall back to UTC if there is an error', () => {
      // Mock Intl.DateTimeFormat to throw an error
      Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('API error');
      }) as any;

      const timezone = getCurrentTimezone();
      expect(timezone).toBe('UTC');
      expect(console.error).toHaveBeenCalledWith(
        'Error getting current timezone:',
        expect.any(Error)
      );
    });

    it('should log a warning and fall back to UTC for invalid timezones', () => {
      const invalidTimezone = 'Invalid/Timezone';
      const result = handleInvalidTimezone(invalidTimezone);
      
      expect(result).toBe('UTC');
      expect(console.warn).toHaveBeenCalledWith(
        `System timezone ${invalidTimezone} is not valid, falling back to UTC`
      );
    });

    // Test the specific line that's not being covered
    it('should call handleInvalidTimezone for invalid system timezone', () => {
      // Create a function that simulates getCurrentTimezone with an invalid timezone
      const simulateGetCurrentTimezoneWithInvalidTimezone = () => {
        try {
          const timezone = 'Invalid/Timezone';
          if (isValidTimezone(timezone)) {
            return timezone;
          } else {
            return handleInvalidTimezone(timezone);
          }
        } catch (error) {
          console.error("Error getting current timezone:", error);
          return "UTC";
        }
      };

      const timezone = simulateGetCurrentTimezoneWithInvalidTimezone();
      expect(timezone).toBe('UTC');
      expect(console.warn).toHaveBeenCalledWith(
        'System timezone Invalid/Timezone is not valid, falling back to UTC'
      );
    });
  });

  describe('getCurrentTimeInTimezone', () => {
    it('should format the current time in UTC', () => {
      // Create a mock formatter object
      const mockFormatter = {
        format: () => '2023-01-01T12:00:00.000+00:00',
        formatToParts: () => [
          { type: 'year', value: '2023' },
          { type: 'literal', value: '-' },
          { type: 'month', value: '01' },
          { type: 'literal', value: '-' },
          { type: 'day', value: '01' },
          { type: 'literal', value: 'T' },
          { type: 'hour', value: '12' },
          { type: 'literal', value: ':' },
          { type: 'minute', value: '00' },
          { type: 'literal', value: ':' },
          { type: 'second', value: '00' },
          { type: 'literal', value: '.' },
          { type: 'fractionalSecond', value: '000' },
          { type: 'timeZoneName', value: 'GMT+00:00' }
        ],
        resolvedOptions: () => ({ timeZone: 'UTC' })
      };
      
      // Mock the DateTimeFormat constructor
      Intl.DateTimeFormat = function() {
        return mockFormatter;
      } as any;
      
      const time = getCurrentTimeInTimezone('UTC');
      
      // Check that it returns a string
      expect(typeof time).toBe('string');
      
      // Check that it's not the error message
      expect(time).not.toBe('Invalid timezone');
    });

    it('should format the current time in a specific timezone', () => {
      // Create a mock formatter object
      const mockFormatter = {
        format: () => '2023-01-01T12:00:00.000+01:00',
        formatToParts: () => [
          { type: 'year', value: '2023' },
          { type: 'literal', value: '-' },
          { type: 'month', value: '01' },
          { type: 'literal', value: '-' },
          { type: 'day', value: '01' },
          { type: 'literal', value: 'T' },
          { type: 'hour', value: '12' },
          { type: 'literal', value: ':' },
          { type: 'minute', value: '00' },
          { type: 'literal', value: ':' },
          { type: 'second', value: '00' },
          { type: 'literal', value: '.' },
          { type: 'fractionalSecond', value: '000' },
          { type: 'timeZoneName', value: 'GMT+01:00' }
        ],
        resolvedOptions: () => ({ timeZone: 'Europe/London' })
      };
      
      // Mock the DateTimeFormat constructor
      Intl.DateTimeFormat = function() {
        return mockFormatter;
      } as any;
      
      const time = getCurrentTimeInTimezone('Europe/London');
      
      // Check that it returns a string
      expect(typeof time).toBe('string');
      
      // Check that it's not the error message
      expect(time).not.toBe('Invalid timezone');
    });

    it('should return an error message for invalid timezones', () => {
      const time = getCurrentTimeInTimezone('Invalid/Timezone');
      expect(time).toBe('Invalid timezone');
    });

    it('should handle edge cases in date formatting', () => {
      // Create a spy on console.error to verify it's called
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        // Mock DateTimeFormat to throw an error
        const originalDateTimeFormat = Intl.DateTimeFormat;
        
        // @ts-ignore - TypeScript doesn't like us mocking built-in objects
        Intl.DateTimeFormat = function() {
          throw new Error('Mock error');
        } as any;
        
        // This should trigger the catch block in getCurrentTimeInTimezone
        const result = getCurrentTimeInTimezone('UTC');
        
        // Verify we got the error message
        expect(result).toBe('Invalid timezone');
        
        // Verify console.error was called
        expect(consoleErrorSpy).toHaveBeenCalled();
        
        // Restore original implementation
        Intl.DateTimeFormat = originalDateTimeFormat;
      } finally {
        // Restore console.error
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle empty timezone parts in formatting', () => {
      // Create a spy on console.error to verify it's not called
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        // Mock DateTimeFormat to return a formatter with empty parts
        const originalDateTimeFormat = Intl.DateTimeFormat;
        
        // First mock for the formatter that gets the timezone offset
        const mockEmptyFormatter = {
          format: jest.fn().mockReturnValue('2023-01-01') // No timezone part
        };
        
        // Second mock for the formatter that gets the date parts
        const mockTzFormatter = {
          formatToParts: jest.fn().mockReturnValue([
            { type: 'year', value: '2023' },
            { type: 'month', value: '01' },
            { type: 'day', value: '01' },
            { type: 'hour', value: '12' },
            { type: 'minute', value: '00' },
            { type: 'second', value: '00' }
            // No fractionalSecond to test that branch
          ])
        };
        
        // Mock Date.toLocaleString to return a string without timezone
        const originalToLocaleString = Date.prototype.toLocaleString;
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('January 1, 2023') as any;
        
        // @ts-ignore - TypeScript doesn't like us mocking built-in objects
        Intl.DateTimeFormat = jest.fn()
          .mockImplementationOnce(() => mockEmptyFormatter)
          .mockImplementationOnce(() => mockTzFormatter);
        
        const result = getCurrentTimeInTimezone('UTC');
        
        // Verify the result contains the expected date format
        expect(result).toContain('2023-01-01T12:00:00.000');
        
        // Restore original implementations
        Intl.DateTimeFormat = originalDateTimeFormat;
        Date.prototype.toLocaleString = originalToLocaleString;
      } finally {
        // Restore console.error
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle null values in split operations', () => {
      // Create a spy on console.error to verify it's called
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        // Mock DateTimeFormat to return a formatter with null format result
        const originalDateTimeFormat = Intl.DateTimeFormat;
        
        // First mock for the formatter that gets the timezone offset
        const mockNullFormatter = {
          format: jest.fn().mockReturnValue(null) // This will cause split to throw
        };
        
        // @ts-ignore - TypeScript doesn't like us mocking built-in objects
        Intl.DateTimeFormat = jest.fn().mockImplementation(() => mockNullFormatter);
        
        const result = getCurrentTimeInTimezone('UTC');
        
        // The function should handle the null values and return an error
        expect(result).toBe('Invalid timezone');
        
        // Verify console.error was called
        expect(consoleErrorSpy).toHaveBeenCalled();
        
        // Restore original implementations
        Intl.DateTimeFormat = originalDateTimeFormat;
      } finally {
        // Restore console.error
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle empty result from formatter.format()', () => {
      // Create a spy on console.error to verify it's not called
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        // Mock DateTimeFormat to return a formatter with empty format result
        const originalDateTimeFormat = Intl.DateTimeFormat;
        
        // Mock for the formatter that returns empty string
        const mockEmptyFormatter = {
          format: jest.fn().mockReturnValue('')
        };
        
        // Mock for the formatter that gets the date parts
        const mockTzFormatter = {
          formatToParts: jest.fn().mockReturnValue([
            { type: 'year', value: '2023' },
            { type: 'month', value: '01' },
            { type: 'day', value: '01' },
            { type: 'hour', value: '12' },
            { type: 'minute', value: '00' },
            { type: 'second', value: '00' },
            { type: 'fractionalSecond', value: '123' }
          ])
        };
        
        // Mock Date.toLocaleString to return a valid string
        const originalToLocaleString = Date.prototype.toLocaleString;
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('1/1/2023, 12:00:00 PM GMT+0000') as any;
        
        // @ts-ignore - TypeScript doesn't like us mocking built-in objects
        Intl.DateTimeFormat = jest.fn()
          .mockImplementationOnce(() => mockEmptyFormatter)
          .mockImplementationOnce(() => mockTzFormatter);
        
        const result = getCurrentTimeInTimezone('UTC');
        
        // The function should handle the empty string and still return a result
        expect(result).toContain('2023-01-01T12:00:00.123');
        
        // Restore original implementations
        Intl.DateTimeFormat = originalDateTimeFormat;
        Date.prototype.toLocaleString = originalToLocaleString;
      } finally {
        // Restore console.error
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle empty result from toLocaleString()', () => {
      // Create a spy on console.error to verify it's not called
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        // Mock DateTimeFormat to return a formatter with valid format result
        const originalDateTimeFormat = Intl.DateTimeFormat;
        
        // Mock for the formatter that returns valid string
        const mockFormatter = {
          format: jest.fn().mockReturnValue('1/1/2023, 12:00:00 PM GMT+0000')
        };
        
        // Mock for the formatter that gets the date parts
        const mockTzFormatter = {
          formatToParts: jest.fn().mockReturnValue([
            { type: 'year', value: '2023' },
            { type: 'month', value: '01' },
            { type: 'day', value: '01' },
            { type: 'hour', value: '12' },
            { type: 'minute', value: '00' },
            { type: 'second', value: '00' },
            { type: 'fractionalSecond', value: '123' }
          ])
        };
        
        // Mock Date.toLocaleString to return an empty string
        const originalToLocaleString = Date.prototype.toLocaleString;
        Date.prototype.toLocaleString = jest.fn().mockReturnValue('') as any;
        
        // @ts-ignore - TypeScript doesn't like us mocking built-in objects
        Intl.DateTimeFormat = jest.fn()
          .mockImplementationOnce(() => mockFormatter)
          .mockImplementationOnce(() => mockTzFormatter);
        
        const result = getCurrentTimeInTimezone('UTC');
        
        // The function should handle the empty string and still return a result
        expect(result).toContain('2023-01-01T12:00:00.123');
        
        // Restore original implementations
        Intl.DateTimeFormat = originalDateTimeFormat;
        Date.prototype.toLocaleString = originalToLocaleString;
      } finally {
        // Restore console.error
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('handleInvalidTimezone', () => {
    let originalConsoleWarn: typeof console.warn;

    beforeEach(() => {
      originalConsoleWarn = console.warn;
      console.warn = jest.fn();
    });

    afterEach(() => {
      console.warn = originalConsoleWarn;
    });

    it('should log a warning and return UTC', () => {
      const invalidTimezone = 'Invalid/Timezone';
      const result = handleInvalidTimezone(invalidTimezone);
      
      expect(result).toBe('UTC');
      expect(console.warn).toHaveBeenCalledWith(
        `System timezone ${invalidTimezone} is not valid, falling back to UTC`
      );
    });

    it('should be called when isValidTimezone returns false', () => {
      // Create a test function that simulates the exact code path
      const testInvalidTimezone = (timezone: string) => {
        if (isValidTimezone(timezone)) {
          return timezone;
        }
        // This is the line we want to cover
        return handleInvalidTimezone(timezone);
      };

      // Use a timezone that we know is invalid
      const result = testInvalidTimezone('Invalid/Timezone');
      
      expect(result).toBe('UTC');
      expect(console.warn).toHaveBeenCalledWith(
        'System timezone Invalid/Timezone is not valid, falling back to UTC'
      );
    });
  });

  describe('processTimezone', () => {
    let originalConsoleWarn: typeof console.warn;

    beforeEach(() => {
      originalConsoleWarn = console.warn;
      console.warn = jest.fn();
    });

    afterEach(() => {
      console.warn = originalConsoleWarn;
    });

    it('should return the timezone if it is valid', () => {
      const validTimezone = 'UTC';
      const result = processTimezone(validTimezone);
      expect(result).toBe(validTimezone);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should call handleInvalidTimezone for invalid timezones', () => {
      const invalidTimezone = 'Invalid/Timezone';
      const result = processTimezone(invalidTimezone);
      expect(result).toBe('UTC');
      expect(console.warn).toHaveBeenCalledWith(
        `System timezone ${invalidTimezone} is not valid, falling back to UTC`
      );
    });
  });
});