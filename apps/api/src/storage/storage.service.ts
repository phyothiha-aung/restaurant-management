import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StoredFilePurpose } from '../generated/prisma/enums.js';
import {
  DOWNLOAD_EXPIRY_SECONDS,
  MAX_UPLOAD_SIZE,
  UPLOAD_EXPIRY_SECONDS,
  buildObjectKey,
  hasExpectedSignature,
  isAllowedMimeType,
} from './storage.constants.js';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly environment: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('AWS_S3_BUCKET');
    this.environment = this.config.get<string>('NODE_ENV') ?? 'development';
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.client = new S3Client({
      region: this.config.getOrThrow<string>('AWS_REGION'),
      ...(accessKeyId && secretAccessKey && {
        credentials: { accessKeyId, secretAccessKey },
      }),
    });
  }

  buildKey(input: {
    purpose: StoredFilePurpose;
    fileId: string;
    fileName: string;
    mimeType: string;
  }) {
    return buildObjectKey({ ...input, environment: this.environment });
  }

  async createUpload(input: {
    objectKey: string;
    mimeType: string;
  }) {
    return createPresignedPost(this.client, {
      Bucket: this.bucket,
      Key: input.objectKey,
      Expires: UPLOAD_EXPIRY_SECONDS,
      Fields: {
        'Content-Type': input.mimeType,
        'x-amz-tagging': 'retention=pending',
      },
      Conditions: [
        ['content-length-range', 1, MAX_UPLOAD_SIZE],
        ['eq', '$Content-Type', input.mimeType],
        ['eq', '$x-amz-tagging', 'retention=pending'],
      ],
    });
  }

  async verifyObject(input: {
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
  }) {
    if (!isAllowedMimeType(input.mimeType)) {
      throw new BadRequestException('Unsupported attachment type');
    }
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: input.objectKey }),
      );
      if (head.ContentLength !== input.sizeBytes || head.ContentType !== input.mimeType) {
        throw new BadRequestException('Uploaded file metadata does not match');
      }
      const object = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: input.objectKey,
          Range: 'bytes=0-15',
        }),
      );
      const bytes = await object.Body?.transformToByteArray();
      if (!bytes || !hasExpectedSignature(input.mimeType, bytes)) {
        throw new BadRequestException('Uploaded file content is invalid');
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Uploaded file could not be verified');
    }
  }

  async retainObject(objectKey: string) {
    await this.client.send(
      new PutObjectTaggingCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Tagging: { TagSet: [{ Key: 'retention', Value: 'retained' }] },
      }),
    );
  }

  async deleteObject(objectKey: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
  }

  async createAccessUrl(input: {
    objectKey: string;
    originalName: string;
  }) {
    const encodedName = encodeURIComponent(input.originalName);
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: input.objectKey,
        ResponseContentDisposition: `inline; filename*=UTF-8''${encodedName}`,
      }),
      { expiresIn: DOWNLOAD_EXPIRY_SECONDS },
    );
    return {
      url,
      expiresAt: new Date(Date.now() + DOWNLOAD_EXPIRY_SECONDS * 1000).toISOString(),
    };
  }
}
