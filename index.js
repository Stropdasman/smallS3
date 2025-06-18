import express from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
dotenv.config();
// Read configuration including the expected API key
const {
  ACCESS_KEY_ID,
  SECRET_ACCESS_KEY,
  SPACES_ENDPOINT,
  REGION,
  BUCKET_NAME,
  PORT = 3000,
  API_KEY, // expected API key value
} = process.env;
// Exit if any required environment variable (including API_KEY) is missing
if (
  !ACCESS_KEY_ID ||
  !SECRET_ACCESS_KEY ||
  !SPACES_ENDPOINT ||
  !REGION ||
  !BUCKET_NAME ||
  !API_KEY
) {
  console.error('Missing required environment variables');
  process.exit(1);
}
const s3 = new S3Client({ region: REGION, endpoint: SPACES_ENDPOINT, credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY } });
const app = express();
app.use(express.json());
// Middleware to check the x-api-key header
app.use((req, res, next) => {
  const key = req.header('x-api-key');
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
app.post('/presign', async (req, res) => {
  const { key, expiresIn = 3600 } = req.body;
  if (!key) return res.status(400).json({ error: 'Missing "key"' });
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: Number(expiresIn) });
    res.json({ url });
  } catch (error) {
    console.error('Presign error:', error);
    res.status(500).json({ error: 'Error generating presigned URL' });
  }
});
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
