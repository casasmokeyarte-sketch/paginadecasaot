import { supabase } from '@/lib/customSupabaseClient';

const slugify = (value) =>
  String(value || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const uploadFileToBucket = async ({ file, bucket, folder = 'uploads' }) => {
  if (!file) throw new Error('No file selected');
  if (!bucket) throw new Error('Bucket is required');

  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const safeName = slugify(baseName);
  const fileName = `${Date.now()}-${safeName}.${extension}`;
  const path = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    const statusCode = uploadError?.statusCode || uploadError?.status;
    const message = String(uploadError?.message || '').toLowerCase();
    const bucketNotFound = statusCode === '404' || statusCode === 404 || message.includes('bucket not found');

    if (bucketNotFound) {
      throw new Error(
        `No existe el bucket "${bucket}". Ejecuta docs/storage-buckets-setup.sql en Supabase SQL Editor.`
      );
    }

    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
