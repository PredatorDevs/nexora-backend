# S3 file storage

Nexora stores object keys in business entities and obtains URLs only when they
are needed. Browser uploads go directly to S3 through a short-lived presigned
POST, so image payloads do not pass through the Vercel function.

## Environment

Use only the canonical variables below. Do not configure `AWS_PUBLIC_KEY` or
`AWS_MY_SECRET_KEY`; they duplicate the standard AWS credential variables.

```env
STORAGE_DRIVER=s3
AWS_REGION=us-east-2
AWS_S3_BUCKET=nexora-assets
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
AWS_S3_PUBLIC_BASE_URL=
S3_UPLOAD_EXPIRES_IN_SECONDS=300
S3_READ_EXPIRES_IN_SECONDS=900
S3_MAX_IMAGE_SIZE_BYTES=5000000
```

`AWS_SESSION_TOKEN` is only required for temporary credentials.
`AWS_S3_PUBLIC_BASE_URL` is optional and should normally remain empty while the
bucket is private. It may later contain a CloudFront/custom-domain base URL.
Configure the same variables in Vercel, scoped independently for Production and
Preview, and never commit real credentials.

## IAM policy

Create a dedicated IAM principal for Nexora. Replace the bucket name and grant
only the object operations currently used:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::nexora-assets/companies/*"
    }
  ]
}
```

Keep S3 Block Public Access enabled. No `s3:PutObjectAcl`, bucket listing, or
bucket administration permission is required. `s3:GetObject` also authorizes
the `HeadObject` verification performed before a product image is registered.

## Bucket CORS

Direct browser uploads require bucket CORS. Replace the origins with the exact
frontend URLs; do not use `*` for production:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "https://nexorasv.vercel.app"],
    "AllowedMethods": ["POST", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## API flow

Request an upload form:

```http
POST /api/v1/files/image-upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "purpose": "PRODUCT_IMAGE",
  "fileName": "front.webp",
  "contentType": "image/webp",
  "sizeBytes": 245812
}
```

The response contains `uploadUrl`, `fields`, `storageKey`, and `expiresAt`.
Create a `FormData`, append every returned field, append the image as `file`
last, and POST it directly to `uploadUrl`. Persist only `storageKey` after S3
returns success.

For a private object, request a temporary display URL:

```http
POST /api/v1/files/read-url

{ "storageKey": "companies/7/products/<uuid>.webp" }
```

Both endpoints require an active company and reject keys outside that tenant.
Supported image types are JPEG, PNG, and WebP. The presigned POST enforces the
configured maximum size and exact content type at S3, not only in the API.
