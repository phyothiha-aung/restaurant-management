import { describe, expect, it } from 'vitest';
import { AUTH_ROLE_KEY } from '../auth/constants/auth.constant.js';
import { UserRole } from '../generated/prisma/enums.js';
import { RestaurantSettingsController } from './restaurant-settings.controller.js';

describe('RestaurantSettingsController permissions', () => {
  it('allows managers to read but only owner and above to update', () => {
    const readRoles = Reflect.getMetadata(
      AUTH_ROLE_KEY,
      RestaurantSettingsController.prototype.findOne,
    );
    const updateRoles = Reflect.getMetadata(
      AUTH_ROLE_KEY,
      RestaurantSettingsController.prototype.update,
    );

    expect(readRoles).toEqual([
      UserRole.SUPERADMIN,
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.MANAGER,
    ]);
    expect(updateRoles).toEqual([
      UserRole.SUPERADMIN,
      UserRole.ADMIN,
      UserRole.OWNER,
    ]);
  });
});
