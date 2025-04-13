import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

// Initialize S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: process.env.R2_REGION || "auto", 
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const uploadToR2 = async (key: string, file: Buffer | Uint8Array | Blob | string, mimeType: string) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await r2Client.send(command);
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${key}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to R2.");
  }
};

// Function to fetch a file and convert stream to a Buffer
export const getFromR2 = async (key: string): Promise<Buffer> => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    const response = await r2Client.send(command);
    const stream = response.Body as Readable;

    // Convert stream to Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    // Return the full buffer
    return Buffer.concat(chunks.map(chunk => new Uint8Array(chunk)));
  } catch (error) {
    console.error('Error fetching from R2:', error);
    throw error;
  }
};

// Function to delete a file from Cloudflare R2 (optional, if you need to delete files)
export const deleteFromR2 = async (key: string): Promise<void> => {
  try {
    // Create the command to delete a file
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    // Send the command to delete the file
    await r2Client.send(command);
    console.log(`File with key ${key} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw new Error("Failed to delete file from R2.");
  }
};

export const getR2ObjectMetadata = async (objectUrl:string)=> {
  try {
    const url = new URL(objectUrl)
    const bucketName = process.env.R2_BUCKET_NAME!
    const objectKey = decodeURIComponent(url.pathname.slice(1));
    console.log(objectKey);
    
    const command = new HeadObjectCommand({
      Bucket:bucketName,
      Key:objectKey
    })

    const metadata = await r2Client.send(command)

    return {
      contentType:  metadata.ContentType,
      contentLength : metadata.ContentLength,
      lastModified : metadata.LastModified,
      metadata : metadata.Metadata
    }
  } catch (error) {
    console.error("Error retrieving metadata:",error)
    throw error;
  }
}

export const downloadFromR2 = async (key: string): Promise<Blob> => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      throw new Error('Response body is empty');
    }

    // Assuming response.Body is a ReadableStream
    const stream = response.Body as ReadableStream<Uint8Array>;
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    let done = false;
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      if (value) {
        chunks.push(value);
      }
      done = streamDone;
    }

    // Combine chunks into a single Uint8Array
    const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert Uint8Array to Blob
    return new Blob([buffer], { type: response.ContentType || 'application/octet-stream' });
  } catch (error) {
    console.error('Error downloading from R2:', error);
    throw new Error('Failed to download file from R2.');
  }
};