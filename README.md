# smallS3

A simple Express service that generates presigned download URLs for DigitalOcean Spaces.

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the following environment variables:
   - `ACCESS_KEY_ID`
   - `SECRET_ACCESS_KEY`
   - `SPACES_ENDPOINT`
   - `REGION`
   - `BUCKET_NAME`
   - `API_KEY` (required API key for requests)
   - `PORT` (optional, defaults to `3000`)
3. Start the server:
   ```bash
   npm start
   ```

4. Make a request:
   ```bash
   curl -X POST http://localhost:$PORT/presign \
     -H "Content-Type: application/json" \
     -H "x-api-key: $API_KEY" \
     -d '{"key":"file.txt"}'
   ```
