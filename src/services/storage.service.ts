import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class StorageService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('cloudinary.cloudName'),
      api_key: this.configService.get('cloudinary.apiKey'),
      api_secret: this.configService.get('cloudinary.apiSecret'),
    });
  }

  async uploadPdf(filePath: string, publicId: string): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
      public_id: publicId,
      folder: 'receipts',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  generateSignedUrl(publicId: string, expiresIn: number = 604800): string {
    const timestamp = Math.round(Date.now() / 1000) + expiresIn;
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      sign_url: true,
      type: 'authenticated',
      expires_at: timestamp,
    });
  }
}
