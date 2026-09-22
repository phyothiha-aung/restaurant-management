import { BadRequestException } from '@nestjs/common';
import { StoredFilePurpose } from '../generated/prisma/enums.js';

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
export const MAX_EXPENSE_ATTACHMENTS = 5;
export const UPLOAD_EXPIRY_SECONDS = 15 * 60;
export const DOWNLOAD_EXPIRY_SECONDS = 5 * 60;

export const ALLOWED_FILE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
} as const;

const PURPOSE_PREFIX: Record<StoredFilePurpose, string> = {
  EXPENSE: 'expenses',
  RECIPE: 'recipes',
  PRODUCT: 'products',
};

export type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES;

export const getEnvironmentPrefix = (environment?: string) => {
  if (environment === 'production') return 'production';
  if (environment === 'test') return 'test';
  if (environment === 'staging') return 'staging';
  if (environment === 'uat') return 'uat';
  return 'development';
};

export const isAllowedMimeType = (value: string): value is AllowedMimeType =>
  Object.hasOwn(ALLOWED_FILE_TYPES, value);

export const sanitizeFileName = (fileName: string, mimeType: AllowedMimeType) => {
  const leafName = fileName.split(/[\\/]/).pop() ?? 'attachment';
  const withoutExtension = leafName.replace(/\.[^.]*$/, '');
  const safeBase = withoutExtension
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'attachment';
  return `${safeBase}.${ALLOWED_FILE_TYPES[mimeType]}`;
};

export const buildObjectKey = (input: {
  environment?: string;
  purpose: StoredFilePurpose;
  fileId: string;
  fileName: string;
  mimeType: string;
}) => {
  if (!isAllowedMimeType(input.mimeType)) {
    throw new BadRequestException('Unsupported attachment type');
  }
  return [
    getEnvironmentPrefix(input.environment),
    PURPOSE_PREFIX[input.purpose],
    input.fileId,
    sanitizeFileName(input.fileName, input.mimeType),
  ].join('/');
};

export const hasExpectedSignature = (
  mimeType: AllowedMimeType,
  bytes: Uint8Array,
) => {
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => bytes[index] === byte,
    );
  }
  if (mimeType === 'image/webp') {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  }
  return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
};
