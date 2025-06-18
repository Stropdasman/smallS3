import express from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
// Read configuration including the expected API key
// Pull needed environment variables
const {
  ACCESS_KEY_ID,
  SECRET_ACCESS_KEY,
  SPACES_ENDPOINT,
  REGION,
  BUCKET_NAME,
  PORT = 3000,
  API_KEY, // expected API key value
  ALLOWED_IPS, // optional comma separated list of allowed IPs
} = process.env;
// Exit if any required environment variable (including API_KEY) is missing
if (
  !ACCESS_KEY_ID ||
  !SECRET_ACCESS_KEY ||
  !SPACES_ENDPOINT ||
  !REGION ||
  !API_KEY
) {
  console.error('Missing required environment variables');
  process.exit(1);
}
const s3 = new S3Client({ region: REGION, endpoint: SPACES_ENDPOINT, credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY } });
const app = express();
app.set('trust proxy', true);
app.use(express.json());
// Apply global rate limiting to protect the API
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per IP
  message: { error: 'Too many requests' },
});
app.use(limiter);
// Parse allowed IPs from environment variable
const allowedIps = (ALLOWED_IPS || '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);
// Middleware to restrict requests based on IP address
app.use((req, res, next) => {
  if (allowedIps.length) {
    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '')
      .split(',')[0]
      .trim();
    if (!allowedIps.includes(ip)) {
      return res.status(403).json({ error: 'Forbidden: IP not allowed' });
    }
  }
  next();
});
// Middleware to check the x-api-key header
app.use((req, res, next) => {
  const key = req.header('x-api-key');
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
// Log requests to presign endpoints for observability
app.use(['/presign', '/presign-upload'], (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '')
    .split(',')[0]
    .trim();
  const { key, bucket } = req.body || {};
  res.on('finish', () => {
    const bucketName = bucket || BUCKET_NAME;
    const status = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'error';
    console.log(
      JSON.stringify({ timestamp, ip, key, bucket: bucketName, status })
    );
  });
  next();
});
// Route to generate a presigned URL
app.post('/presign', async (req, res) => {
  const { key, expiresIn, bucket } = req.body;
  if (!key) return res.status(400).json({ error: 'Missing "key"' });
  // Determine which bucket to use
  const bucketName = bucket || BUCKET_NAME;
  if (!bucketName) return res.status(400).json({ error: 'Missing "bucket"' });
  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    // Use provided expiration or default to one hour
    const url = await getSignedUrl(s3, command, {
      expiresIn: Number(expiresIn) || 3600,
    });
    res.json({ url });
  } catch (error) {
    console.error('Presign error:', error);
    res.status(500).json({ error: 'Error generating presigned URL' });
  }
});
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
}

export default app;
