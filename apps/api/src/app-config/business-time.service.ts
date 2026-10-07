import { Injectable } from '@nestjs/common';
import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

@Injectable()
export class BusinessTimeService {
  startOfBusinessDate(value: string, timeZone: string): Date {
    return fromZonedTime(`${value}T00:00:00`, timeZone);
  }

  endExclusiveOfBusinessDate(value: string, timeZone: string): Date {
    const calendarDate = new Date(`${value}T00:00:00.000Z`);
    const nextDate = addDays(calendarDate, 1).toISOString().slice(0, 10);
    return this.startOfBusinessDate(nextDate, timeZone);
  }

  currentBusinessDate(timeZone: string, instant = new Date()): string {
    return formatInTimeZone(instant, timeZone, 'yyyy-MM-dd');
  }

  firstDateOfMonth(value: string): string {
    return `${value.slice(0, 7)}-01`;
  }

  businessDates(dateFrom: string, dateTo: string): string[] {
    const dates: string[] = [];
    let current = new Date(`${dateFrom}T00:00:00.000Z`);
    const end = new Date(`${dateTo}T00:00:00.000Z`);
    while (current <= end) {
      dates.push(current.toISOString().slice(0, 10));
      current = addDays(current, 1);
    }
    return dates;
  }
}
