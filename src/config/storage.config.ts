import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  accessKeyId: process.env.SUPABASE_STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY,
  region: process.env.SUPABASE_STORAGE_REGION || 'us-east-1',
  bucket: process.env.SUPABASE_STORAGE_BUCKET,
  endpoint: process.env.SUPABASE_STORAGE_ENDPOINT,
}));
