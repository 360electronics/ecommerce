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

export const uploadProductImageToR2 = async (
  productName: string,
  variantId: string,
  file: Buffer | Uint8Array | Blob | string,
  mimeType: string,
  fileName: string
) => {
  try {
    const sanitizedProductName = productName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const key = `products/${sanitizedProductName}/variants/${variantId}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await r2Client.send(command);

    // Return the URL from your R2 public bucket
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('[R2_UPLOAD_ERROR]', error);
    throw new Error('Failed to upload file to R2.');
  }
};

export const uploadBannerImageToR2 = async (
  type: string,
  file: Buffer | Uint8Array | Blob | string,
  mimeType: string,
  fileName: string
) => {
  try {

    const key = `promotional-banners/${type}/${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });
    
    await r2Client.send(command);
    
    // Return the URL from your R2 public bucket or custom domain
    // If using public bucket access via Cloudflare R2
    return `${process.env.R2_PUBLIC_URL}/${key}`;
    
    // If using Cloudflare Workers or custom domain for R2
    // return `${process.env.CLOUDFLARE_WORKER_URL}/${key}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to R2.");
  }
}

export const uploadCartOffProductImageToR2 = async (
  type: string,
  file: Buffer | Uint8Array | Blob | string,
  mimeType: string,
  fileName: string
) => {
  try {

    const key = `cart-val-off/${type}/${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });
    
    await r2Client.send(command);
    
    // Return the URL from your R2 public bucket or custom domain
    // If using public bucket access via Cloudflare R2
    return `${process.env.R2_PUBLIC_URL}/${key}`;
    
    // If using Cloudflare Workers or custom domain for R2
    // return `${process.env.CLOUDFLARE_WORKER_URL}/${key}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to R2.");
  }
}



export const getFromR2 = async (key: string): Promise<Buffer> => {
  try {
    // Get bucket name directly from environment each time the function is called
    const bucketName = process.env.R2_BUCKET_NAME;
    console.log("ENV R2_BUCKET_NAME:", bucketName);

    // Check if bucket name is available
    if (!bucketName) {
      console.error('R2_BUCKET_NAME environment variable is not defined');
      throw new Error('R2 bucket name is not configured');
    }
    
    console.log(`Fetching from R2 with bucket: ${bucketName}, key: ${key}`);
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await r2Client.send(command);
    const stream = response.Body as Readable;

    // Convert stream to Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
    }

    // Return the full buffer
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error fetching from R2:', error);
    throw error;
  }
};
// Helper function to extract the key from a full R2 URL
export const extractKeyFromR2Url = (url: string): string | null => {
  try {
    // Parse the URL to extract the path
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // First part is empty, second is bucket name, rest is the key
    if (pathParts.length < 4) {
      throw new Error("Invalid R2 URL format");
    }
    
    // Skip the first empty string and bucket name
    console.log(pathParts.slice(1).join('/'))
    return pathParts.slice(1).join('/');


  } catch (error) {
    console.error("Error parsing R2 URL:", error);
    return null;
  }
};


// Function to delete a file from Cloudflare R2 (optional, if you need to delete files)
export const deleteFromR2 = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    const result = await r2Client.send(command);
    console.log(`Attempted to delete key: ${key}`);
    console.log("Delete result:", result);
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