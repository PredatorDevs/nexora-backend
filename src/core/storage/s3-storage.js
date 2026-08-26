import { randomUUID } from 'node:crypto';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../errors/app-error.js';
import { errorCodes } from '../errors/error-codes.js';

const imageExtensions = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
});
const purposePaths = Object.freeze({
  PRODUCT_IMAGE: 'products',
  COMPANY_LOGO: 'companies',
  BRAND_LOGO: 'brands',
});
const unavailable = () =>
  new AppError({
    code: errorCodes.serviceUnavailable,
    message: 'File storage is not configured.',
    statusCode: 503,
  });

function publicUrl(baseUrl, key) {
  if (!baseUrl) return null;
  return `${baseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export function createFileStorage(
  settings,
  {
    client: providedClient,
    createPost = createPresignedPost,
    signUrl = getSignedUrl,
    uuid = randomUUID,
    clock = () => Date.now(),
  } = {},
) {
  if (settings.driver !== 's3') {
    return {
      enabled: false,
      prepareImageUpload() {
        throw unavailable();
      },
      createReadUrl() {
        throw unavailable();
      },
    };
  }

  const client =
    providedClient ??
    new S3Client({
      region: settings.region,
      credentials: {
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
        ...(settings.sessionToken
          ? { sessionToken: settings.sessionToken }
          : {}),
      },
    });

  return {
    enabled: true,
    async prepareImageUpload({ companyId, purpose, contentType, sizeBytes }) {
      const extension = imageExtensions[contentType];
      if (!extension)
        throw new AppError({
          code: errorCodes.validation,
          message: 'Only JPEG, PNG, and WebP images are allowed.',
          statusCode: 400,
        });
      if (sizeBytes > settings.maxImageSizeBytes)
        throw new AppError({
          code: errorCodes.payloadTooLarge,
          message: 'The image exceeds the configured size limit.',
          statusCode: 413,
        });
      const key = `companies/${companyId}/${purposePaths[purpose]}/${uuid()}.${extension}`;
      const signed = await createPost(client, {
        Bucket: settings.bucket,
        Key: key,
        Expires: settings.uploadExpiresInSeconds,
        Fields: { 'Content-Type': contentType },
        Conditions: [
          ['eq', '$Content-Type', contentType],
          ['content-length-range', 1, settings.maxImageSizeBytes],
        ],
      });
      return {
        method: 'POST',
        uploadUrl: signed.url,
        fields: signed.fields,
        storageKey: key,
        publicUrl: publicUrl(settings.publicBaseUrl, key),
        expiresAt: new Date(
          clock() + settings.uploadExpiresInSeconds * 1000,
        ).toISOString(),
      };
    },
    async createReadUrl({ companyId, storageKey }) {
      if (!storageKey.startsWith(`companies/${companyId}/`))
        throw new AppError({
          code: errorCodes.forbidden,
          message: 'The file does not belong to the active company.',
          statusCode: 403,
        });
      const directUrl = publicUrl(settings.publicBaseUrl, storageKey);
      if (directUrl) return { url: directUrl, expiresAt: null };
      const expiresIn = settings.readExpiresInSeconds;
      const url = await signUrl(
        client,
        new GetObjectCommand({ Bucket: settings.bucket, Key: storageKey }),
        { expiresIn },
      );
      return {
        url,
        expiresAt: new Date(clock() + expiresIn * 1000).toISOString(),
      };
    },
  };
}
