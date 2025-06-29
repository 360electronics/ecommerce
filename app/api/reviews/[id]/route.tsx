import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { reviews, products, variants, users } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { uploadProductReviewImageToR2 } from '@/lib/r2';
import { z } from 'zod';

// Validation schemas
const createReviewSchema = z.object({
  rating: z.number().min(0).max(5),
  title: z.string().max(255).optional(),
  comment: z.string().optional(),
  variantId: z.string().uuid().optional(),
  images: z
    .array(
      z.object({
        file: z.string(),
        alt: z.string().max(255),
        mimeType: z.string(),
        fileName: z.string(),
      })
    )
    .optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().min(0).max(5).optional(),
  title: z.string().max(255).optional(),
  comment: z.string().optional(),
  images: z
    .array(
      z.object({
        file: z.string().optional(),
        alt: z.string().max(255),
        mimeType: z.string().optional(),
        fileName: z.string().optional(),
      })
    )
    .optional(),
});

const getReviewsSchema = z.object({
  variantId: z.string().uuid().optional(),
  limit: z.string().transform(Number).refine(val => Number.isInteger(val) && val > 0, {
    message: 'Limit must be a positive integer',
  }).optional(),
  offset: z.string().transform(Number).refine(val => Number.isInteger(val) && val >= 0, {
    message: 'Offset must be a non-negative integer',
  }).optional(),
});

// Helper function to check authentication
async function checkAuth(request: NextRequest) {
  try {
    const response = await fetch(new URL('/api/auth/status', request.url), {
      credentials: 'include',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });
    const data = await response.json();
    return {
      isAuthenticated: data.isAuthenticated,
      user: data.user,
    };
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { isAuthenticated: false, user: null };
  }
}

// Helper function to update product rating and distribution
async function updateProductRating(productId: string) {
  const productReviews = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  const ratingCount = productReviews.length;
  const averageRating =
    ratingCount > 0
      ? productReviews.reduce((sum, review) => sum + parseFloat(review.rating), 0) / ratingCount
      : 0;

  // Calculate rating distribution
  const distributionMap: { [key: number]: number } = {
    1.0: 0,
    2.0: 0,
    3.0: 0,
    4.0: 0,
    5.0: 0,
  };

  productReviews.forEach((review) => {
    const ratingValue = Math.round(parseFloat(review.rating) * 10) / 10; // Round to nearest 0.1
    if (distributionMap[ratingValue] !== undefined) {
      distributionMap[ratingValue]++;
    }
  });

  const ratingDistribution = Object.entries(distributionMap).map(([value, count]) => ({
    value: parseFloat(value),
    count,
  }));

  await db
    .update(products)
    .set({
      averageRating: averageRating.toFixed(1),
      ratingCount: ratingCount.toString(),
      ratingDistribution,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
}

type Params = Promise<{ id: string }>;


// GET: Fetch reviews for a product or a specific review
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { variantId, limit = 10, offset = 0 } = getReviewsSchema.parse({
      variantId: searchParams.get('variantId'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    const { isAuthenticated, user } = await checkAuth(request);
    const { id: productId } = await params;

    // Verify product exists
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // If variantId is provided, verify it exists
    if (variantId) {
      const variant = await db
        .select()
        .from(variants)
        .where(and(
          eq(variants.id, variantId),
          eq(variants.productId, productId)
        ))
        .limit(1);

      if (!variant.length) {
        return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
      }
    }

    const query = db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        variantId: reviews.variantId,
        userId: reviews.userId,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        images: reviews.images,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        canEdit: isAuthenticated && user?.id ? eq(reviews.userId, user.id) : sql`false`,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(
        and(
          eq(reviews.productId, productId),
          variantId ? eq(reviews.variantId, variantId) : sql`reviews.variant_id IS NULL OR reviews.variant_id = ANY(SELECT id FROM variants WHERE product_id = ${productId})`
        )
      )
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, productId),
          variantId ? eq(reviews.variantId, variantId) : sql`reviews.variant_id IS NULL OR reviews.variant_id = ANY(SELECT id FROM variants WHERE product_id = ${productId})`
        )
      );

    const [reviewsData, [{ count }]] = await Promise.all([query, totalQuery]);

    return NextResponse.json({
      reviews: reviewsData,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { isAuthenticated, user } = await checkAuth(request);
    if (!isAuthenticated || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // Verify product exists
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify variant exists if provided
    if (body.variantId) {
      const variant = await db
        .select()
        .from(variants)
        .where(and(
          eq(variants.id, body.variantId),
          eq(variants.productId, productId)
        ))
        .limit(1);

      if (!variant.length) {
        return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
      }
    }

    // Handle image uploads
    let uploadedImages: { url: string; alt: string; displayOrder: number }[] = [];
    if (validatedData.images?.length) {
      uploadedImages = await Promise.all(
        validatedData.images.map(async (image, index) => {
          const buffer = Buffer.from(image.file, 'base64');
          const url = await uploadProductReviewImageToR2(
            productId,
            body.variantId || 'default',
            buffer,
            image.mimeType,
            image.fileName
          );
          return {
            url,
            alt: image.alt,
            displayOrder: index,
          };
        })
      );
    }

    // Create review
    const [newReview] = await db
      .insert(reviews)
      .values({
        productId,
        variantId: body.variantId,
        userId: user.id,
        rating: validatedData.rating.toFixed(1),
        title: validatedData.title,
        comment: validatedData.comment,
        images: uploadedImages,
      })
      .returning();

    // Update product's rating and distribution
    await updateProductRating(productId);

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an existing review
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { isAuthenticated, user } = await checkAuth(request);
    if (!isAuthenticated || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reviewId } = await params;
    const body = await request.json();
    const validatedData = updateReviewSchema.parse(body);

    // Verify review exists and belongs to user
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.id, reviewId),
        eq(reviews.userId, user.id)
      ))
      .limit(1);

    if (!existingReview.length) {
      return NextResponse.json({ error: 'Review not found or unauthorized' }, { status: 404 });
    }

    // Handle image uploads
    let updatedImages = existingReview[0].images || [];
    if (validatedData.images?.length) {
      const newImages = await Promise.all(
        validatedData.images
          .filter(img => img.file)
          .map(async (image, index) => {
            const buffer = Buffer.from(image.file!, 'base64');
            const url = await uploadProductReviewImageToR2(
              existingReview[0].productId,
              existingReview[0].variantId || 'default',
              buffer,
              image.mimeType!,
              image.fileName!
            );
            return {
              url,
              alt: image.alt,
              displayOrder: updatedImages.length + index,
            };
          })
      );
      updatedImages = [...updatedImages, ...newImages];
    }

    // Update review
    const [updatedReview] = await db
      .update(reviews)
      .set({
        rating: validatedData.rating?.toFixed(1),
        title: validatedData.title,
        comment: validatedData.comment,
        images: updatedImages,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning();

    // Update product's rating and distribution
    await updateProductRating(existingReview[0].productId);

    return NextResponse.json(updatedReview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { isAuthenticated, user } = await checkAuth(request);
    if (!isAuthenticated || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reviewId } = await params;

    // Verify review exists and belongs to user
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.id, reviewId),
        eq(reviews.userId, user.id)
      ))
      .limit(1);

    if (!existingReview.length) {
      return NextResponse.json({ error: 'Review not found or unauthorized' }, { status: 404 });
    }

    // Delete review
    await db.delete(reviews).where(eq(reviews.id, reviewId));

    // Update product's rating and distribution
    await updateProductRating(existingReview[0].productId);

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}