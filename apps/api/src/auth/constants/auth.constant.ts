export const REQUEST_USER_KEY = 'user';

export const AUTH_TYPE_KEY = 'AUTH_TYPE';
export const AUTH_ROLE_KEY = 'AUTH_ROLE';
export enum AuthType {
  NONE = 'NONE',
  BEARER = 'BEARER',
}

export enum TokenType {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
}

export const REFRESH_TOKENS_PATH = '/api/auth/';
