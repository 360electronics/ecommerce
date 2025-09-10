// /api/banner.ts
import { banners } from "@/db/schema";
import { deleteFromR2, extractKeyFromR2Url, uploadBannerImageToR2 } from "@/lib/r2";
import { inArray, InferInsertModel } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";

interface BannerResponse {
  success: boolean;
  bannerId: string;
  message: string;
  imageUrls: {
    default: string;
    sm?: string;
    lg?: string;
  };
}

interface ErrorResponse {
  message: string;
  error: string;
}

type BannerStatus = "active" | "inactive";

export async function GET(req: Request) {

  // //API Proxy
  // const apiKey = req.headers.get('x-super-secure-key'); 
  // if (apiKey !== process.env.API_SECRET_KEY) {
  //   return NextResponse.json(
  //     { message: 'Unauthorized' },
  //     { status: 401 }
  //   );
  // }
  // //

  try {
    const allBanners = await db.select().from(banners);
    return NextResponse.json({
      success: true,
      data: allBanners,
    });
  } catch (error) {
    console.error("[BANNER_GET_ERROR]", error);
    return NextResponse.json<ErrorResponse>(
      {
        message: "Failed to fetch banners",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  
  try {
    const formData = await req.formData();
    console.log('FormData keys:', Array.from(formData.keys())); // Debug
    const title = formData.get('title')?.toString() || '';
    const start_date = formData.get('start_date')?.toString() || '';
    const end_date = formData.get('end_date')?.toString() || '';
    const type = formData.get('type')?.toString() || '';
    const status = formData.get('status')?.toString() === 'active' ? 'active' : 'inactive';

    // Validate required fields
    if (!title || !type) {
      console.log('Validation failed: Missing title or type', { title, type });
      return NextResponse.json<ErrorResponse>(
        { message: 'Title and type are required', error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const defaultImage = formData.get('image');
    const smImage = formData.get('imageSm');
    const lgImage = formData.get('imageLg');

    if (!(defaultImage instanceof File)) {
      console.log('Validation failed: Invalid or missing default image', defaultImage);
      return NextResponse.json<ErrorResponse>(
        { message: 'Default banner image or video is required', error: 'Missing default file' },
        { status: 400 }
      );
    }

    // Validate file types
    const validFileTypes = type === 'hero-secondary'
      ? ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
      : ['image/jpeg', 'image/png', 'image/webp'];
    if (!validFileTypes.includes(defaultImage.type)) {
      console.log('Validation failed: Invalid default file type', defaultImage.type, validFileTypes);
      return NextResponse.json<ErrorResponse>(
        { message: `Invalid default file format. Use JPEG, PNG, WebP${type === 'hero-secondary' ? ', or MP4, WebM, OGG, MOV, AVI' : ''}.`, error: 'Invalid file type' },
        { status: 400 }
      );
    }
    if (smImage && !(smImage instanceof File)) {
      console.log('Validation failed: Invalid sm file', smImage);
      return NextResponse.json<ErrorResponse>(
        { message: 'Invalid sm file', error: 'Invalid file' },
        { status: 400 }
      );
    }
    if (smImage && !(smImage instanceof File)) {
      console.log('Validation failed: Invalid sm file', smImage);
      return NextResponse.json<ErrorResponse>(
        { message: `Invalid sm file format. Use JPEG, PNG, WebP${type === 'hero-secondary' ? ', or MP4, WebM, OGG, MOV, AVI' : ''}.`, error: 'Invalid file type' },
        { status: 400 }
      );
    }
    if (lgImage && !(lgImage instanceof File)) {
      console.log('Validation failed: Invalid lg file', lgImage);
      return NextResponse.json<ErrorResponse>(
        { message: 'Invalid lg file', error: 'Invalid file' },
        { status: 400 }
      );
    }
    if (lgImage instanceof File && !validFileTypes.includes(lgImage.type)) {
      console.log('Validation failed: Invalid lg file type', lgImage.type);
      return NextResponse.json<ErrorResponse>(
        { message: `Invalid lg file format. Use JPEG, PNG, WebP${type === 'hero-secondary' ? ', or MP4, WebM, OGG, MOV, AVI' : ''}.`, error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSizeMB = 50;
    if (defaultImage.size > maxSizeMB * 1024 * 1024) {
      console.log('Validation failed: Default file too large', defaultImage.size);
      return NextResponse.json<ErrorResponse>(
        { message: `Default file size must be less than ${maxSizeMB}MB`, error: 'File too large' },
        { status: 400 }
      );
    }
    if (smImage && smImage instanceof File && smImage.size > maxSizeMB * 1024 * 1024) {
      console.log('Validation failed: Sm file too large', smImage.size);
      return NextResponse.json<ErrorResponse>(
        { message: `Sm file size must be less than ${maxSizeMB}MB`, error: 'File too large' },
        { status: 400 }
      );
    }
    if (lgImage && lgImage instanceof File && lgImage.size > maxSizeMB * 1024 * 1024) {
      console.log('Validation failed: Lg file too large', lgImage.size);
      return NextResponse.json<ErrorResponse>(
        { message: `Lg file size must be less than ${maxSizeMB}MB`, error: 'File too large' },
        { status: 400 }
      );
    }

    // Upload images/videos to R2
    const files = {
      default: Buffer.from(await (defaultImage as File).arrayBuffer()),
      sm: smImage ? Buffer.from(await (smImage as File).arrayBuffer()) : undefined,
      lg: lgImage ? Buffer.from(await (lgImage as File).arrayBuffer()) : undefined,
    };

    const imageUrls = await uploadBannerImageToR2(type, files, defaultImage.type, defaultImage.name);

    const bannerData: InferInsertModel<typeof banners> = {
      id: crypto.randomUUID(),
      title,
      type,
      imageUrls,
      start_date: start_date || null, // Handle empty strings as null
      end_date: end_date || null, // Handle empty strings as null
      status: status as BannerStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newBanner] = await db.insert(banners).values(bannerData).returning({ id: banners.id });

    return NextResponse.json<BannerResponse>({
      success: true,
      bannerId: newBanner.id,
      message: 'Banner created successfully',
      imageUrls,
    });
  } catch (error) {
    console.error('[BANNER_POST_ERROR]', error);
    return NextResponse.json<ErrorResponse>(
      {
        message: 'Failed to create banner',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { ids }: { ids: string[] } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Banner IDs are required', error: 'Invalid IDs' },
        { status: 400 }
      );
    }

    // Fetch banners to delete images
    const bannerList = await db
      .select({ imageUrls: banners.imageUrls })
      .from(banners)
      .where(inArray(banners.id, ids));

    // Delete images from R2
    for (const banner of bannerList) {
      const { default: defaultUrl, sm, lg } = banner.imageUrls;
      const keys = [defaultUrl, sm, lg].filter((url): url is string => !!url).map(extractKeyFromR2Url);
      for (const key of keys) {
        if (key) await deleteFromR2(key).catch((err) => console.error(`Failed to delete R2 object ${key}:`, err));
      }
    }

    // Delete banners from database
    const result = await db.delete(banners).where(inArray(banners.id, ids)).returning();

    return NextResponse.json({
      success: true,
      message: 'Banners deleted successfully',
      result,
    });
  } catch (error) {
    console.error('[BANNER_DELETE_ERROR]', error);
    return NextResponse.json<ErrorResponse>(
      { message: 'Failed to delete banners', error: String(error) },
      { status: 500 }
    );
  }
}