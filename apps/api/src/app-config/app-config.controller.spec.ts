import { describe, expect, it } from 'vitest';
import { AppConfigController } from './app-config.controller.js';
import type { BusinessTimeService } from './business-time.service.js';

describe('AppConfigController', () => {
  it('returns the stable public application config contract', () => {
    const businessTime = { timeZone: 'Asia/Yangon' } as BusinessTimeService;
    expect(new AppConfigController(businessTime).getConfig()).toEqual({
      timeZone: 'Asia/Yangon',
    });
  });
});
