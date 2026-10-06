import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { addDays } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

@Injectable()
export class BusinessTimeService {
  readonly timeZone: string;

  constructor(config: ConfigService) {
    this.timeZone = config.getOrThrow<string>('RESTAURANT_TIME_ZONE');
  }

  startOfBusinessDate(value: string): Date {
    return fromZonedTime(`${value}T00:00:00`, this.timeZone);
  }

  endExclusiveOfBusinessDate(value: string): Date {
    const calendarDate = new Date(`${value}T00:00:00.000Z`);
    const nextDate = addDays(calendarDate, 1).toISOString().slice(0, 10);
    return this.startOfBusinessDate(nextDate);
  }
}
