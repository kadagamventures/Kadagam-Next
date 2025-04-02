const { S3Client } = require("@aws-sdk/client-s3");
const { SESClient } = require("@aws-sdk/client-ses");

// Extract environment variables
const { AWS_REGION, AWS_S3_BUCKET_NAME, AWS_SES_SENDER_EMAIL } = process.env;

// Ensure required AWS configurations are available
if (!AWS_REGION || !AWS_S3_BUCKET_NAME || !AWS_SES_SENDER_EMAIL) {
  throw new Error("Missing required AWS configuration. Please check environment variables.");
}

// Configure AWS S3 Client
const s3 = new S3Client({ region: AWS_REGION });

// Configure AWS SES Client
const ses = new SESClient({ region: AWS_REGION });

module.exports = { s3, ses };
