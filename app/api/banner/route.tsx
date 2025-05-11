import { banners } from "@/db/schema";
import { deleteFromR2, extractKeyFromR2Url, uploadBannerImageToR2 } from "@/lib/r2";
import { inArray, InferInsertModel } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";


interface BannerResponse {
  success: boolean;
  bannerId: string;
  message: string;
}

// Define the valid status types to match schema
type BannerStatus = "active" | "inactive";

interface ErrorResponse {
  message: string;
  error: string;
}


export async function GET() {
    try {
      const allBanners: any[] = await db.select().from(banners);
  
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

    // Extract and validate form data
    const title = formData.get('title')?.toString() || '';
    const start_date = formData.get('start_date')?.toString() || '';
    const end_date = formData.get('end_date')?.toString() || '';
    const type = formData.get('type')?.toString() || '';
    // Ensure status is strictly 'active' or 'inactive'
    const statusInput = formData.get('status')?.toString();
    const status = statusInput === 'active' ? 'active' : 'inactive';

    // Validate required fields
    if (!title) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Banner name is required', error: 'Missing name' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Type is required', error: 'Missing Type' },
        { status: 400 }
      );
    }

    // Handle image upload - note that formData.get('image') returns a File, not a string
    const imageFile = formData.get('image') as File;

    // Validate file
    if (!imageFile) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Banner image is required', error: 'Missing image' },
        { status: 400 }
      );
    }

    // Upload the image to R2
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadedImageUrl = await uploadBannerImageToR2( 
      type, 
      buffer, 
      imageFile.type, 
      imageFile.name
    );

    // Prepare banner data
    const bannerData: InferInsertModel<typeof banners> = {
      title,
      type,
      imageUrl: uploadedImageUrl,
      start_date,
      end_date,
      status: status as BannerStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert the banner into the database
    const [newBanner] = await db.insert(banners).values(bannerData).returning({ 
      id: banners.id 
    });

    const bannerId = newBanner.id;

    return NextResponse.json<BannerResponse>({
      success: true,
      bannerId,
      message: 'Banner created successfully',
    });
  } catch (error) {
    console.error('[BANNER_POST_ERROR]', error);
    return NextResponse.json<ErrorResponse>(
      {
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
    try {
      const body = await req.json();
      const { ids }: { ids: string[] } = body;
  
      // Validate input
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json<ErrorResponse>(
          { message: 'Banner IDs are required', error: 'Invalid IDs' },
          { status: 400 }
        );
      }
  
      // Fetch banners to get image URLs
      const bannerList = await db
        .select({ imageUrl: banners.imageUrl })
        .from(banners)
        .where(inArray(banners.id, ids));
  
      // Delete images from R2
      for (const banner of bannerList) {
        if (banner.imageUrl) {
          const key = extractKeyFromR2Url(banner.imageUrl);
          if (key) {
            try {
              await deleteFromR2(key);
            } catch (err) {
              console.error(`Failed to delete R2 object with key ${key}:`, err);
            }
          }
        }
      }
  
      // Delete banners
      const result = await db
        .delete(banners)
        .where(inArray(banners.id, ids))
        .returning();
  
      return NextResponse.json({
        message: 'Banners and associated images removed successfully',
        result,
      }, { status: 200 });
    } catch (error) {
      console.error('Error deleting banners:', error);
      return NextResponse.json<ErrorResponse>(
        { message: 'Failed to delete banners', error: String(error) },
        { status: 500 }
      );
    }
  }