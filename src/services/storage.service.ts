import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFileSync } from 'fs';

export interface UploadResult {
  url: string;
  key: string;
}

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('storage.accessKeyId');
    const secretAccessKey = this.configService.get<string>('storage.secretAccessKey');
    const region = this.configService.get<string>('storage.region');
    const endpoint = this.configService.get<string>('storage.endpoint');
    this.bucket = this.configService.getOrThrow('storage.bucket');

    if (!accessKeyId || !secretAccessKey || !this.bucket) {
      throw new Error('Missing required storage configuration. Please set SUPABASE_STORAGE_ACCESS_KEY_ID, SUPABASE_STORAGE_SECRET_ACCESS_KEY, and SUPABASE_STORAGE_BUCKET environment variables.');
    }

    this.s3Client = new S3Client({
      region: region || 'us-east-1',
      endpoint: endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadPdf(filePath: string, key: string): Promise<UploadResult> {
    const fileContent = readFileSync(filePath);
    const s3Key = `receipts/${key}.pdf`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/pdf',
    });

    await this.s3Client.send(command);

    const url = this.publicUrl
      ? `${this.publicUrl}/${s3Key}`
      : s3Key;

    return {
      url,
      key: s3Key,
    };
  }

  async generateSignedUrl(key: string, expiresIn: number = 604800): Promise<string> {
    const s3Key = key.startsWith('receipts/') ? key : `receipts/${key}`;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    return signedUrl;
  }
}
