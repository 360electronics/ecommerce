/**
 * Dumps all categories, subcategories, and attributes
 * into a static JSON file at /data/categories.json
 */

import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { categories, attributeTemplates, subcategories } from '../db/schema';


// Where to save the output
const OUTPUT_PATH = path.join(process.cwd(), "data", "categories.json");

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const sql = neon(DB_URL);
const db = drizzle(sql, { schema: { categories, attributeTemplates, subcategories } });


async function dumpCategories() {
  try {
    console.log("🔄 Fetching categories from database...");

    // 1️⃣ Fetch all categories
    const allCategories = await db.select().from(categories);

    // 2️⃣ For each category, fetch its attributes + subcategories
    const enrichedCategories = await Promise.all(
      allCategories.map(async (category) => {
        // Fetch related attribute template
        const [attrTemplate] = await db
          .select()
          .from(attributeTemplates)
          .where(eq(attributeTemplates.categoryId, category.id))
          .limit(1);

        // Fetch related subcategories
        const subs = await db
          .select()
          .from(subcategories)
          .where(eq(subcategories.categoryId, category.id));

        return {
          ...category,
          attributes: attrTemplate?.attributes ?? [],
          subcategories: subs.map((sub) => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            displayOrder: sub.displayOrder,
            isActive: sub.isActive,
          })),
        };
      })
    );

    // 3️⃣ Ensure /data folder exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 4️⃣ Write to JSON file
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enrichedCategories, null, 2));
    console.log(`✅ Successfully dumped ${enrichedCategories.length} categories.`);
    console.log(`📁 File created at: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error("❌ Error dumping categories:", error);
    process.exit(1);
  }
}

// Run the dump
dumpCategories();
