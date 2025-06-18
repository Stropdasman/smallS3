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
   - `PORT` (optional, defaults to `3000`)
3. Start the server:
   ```bash
   npm start
   ```
