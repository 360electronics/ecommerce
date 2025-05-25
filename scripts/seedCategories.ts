// scripts/seedCategories.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { categories, attributeTemplates, subcategories } from '../db/schema';
import { eq } from 'drizzle-orm';

// Define the type for attributes to match the schema
type Attribute = {
  name: string | null;
  type: 'text' | 'number' | 'boolean' | 'select' | null;
  options?: string[] | null;
  unit?: string | null;
  isFilterable: boolean | null;
  isRequired: boolean | null;
  displayOrder: number | null;
};

// Define the computerCategoryPresets with stricter typing
const computerCategoryPresets: Record<
  string,
  { attributes: Attribute[]; subcategories: string[] }
> = {
  laptops: {
    attributes: [
      { name: 'processor', type: 'text', isFilterable: true, isRequired: true, displayOrder: 1 },
      { name: 'series', type: 'text', isFilterable: true, isRequired: true, displayOrder: 2 },
      { name: 'ram', type: 'text', isFilterable: true, isRequired: true, displayOrder: 3 },
      { name: 'storage', type: 'text', isFilterable: true, isRequired: true, displayOrder: 4 },
      { name: 'graphics', type: 'text', isFilterable: true, isRequired: true, displayOrder: 5 },
      { name: 'display_size', type: 'text', isFilterable: true, isRequired: true, displayOrder: 6 },
      { name: 'resolution', type: 'text', isFilterable: true, isRequired: true, displayOrder: 7 },
      { name: 'operating_system', type: 'text', isFilterable: true, isRequired: true, displayOrder: 8 },
      { name: 'battery_life', type: 'text', isFilterable: true, isRequired: true, displayOrder: 9 },
      { name: 'weight', type: 'text', isFilterable: true, isRequired: true, displayOrder: 10 },
    ],
    subcategories: [
      'Gaming Laptops',
      'Business Laptops',
      'Ultrabooks',
      'Budget Laptops',
      'Student Laptops',
      'Workstation Laptops',
    ],
  },
  monitors: {
    attributes: [
      { name: 'display_size', type: 'text', isFilterable: true, isRequired: true, displayOrder: 1 },
      { name: 'resolution', type: 'text', isFilterable: true, isRequired: true, displayOrder: 2 },
      { name: 'panel_type', type: 'text', isFilterable: true, isRequired: true, displayOrder: 3 },
      { name: 'refresh_rate', type: 'text', isFilterable: true, isRequired: true, displayOrder: 4 },
      { name: 'response_time', type: 'text', isFilterable: true, isRequired: true, displayOrder: 5 },
      { name: 'connectivity', type: 'text', isFilterable: true, isRequired: true, displayOrder: 6 },
      { name: 'adaptive_sync', type: 'text', isFilterable: true, isRequired: false, displayOrder: 7 },
      { name: 'hdr_support', type: 'text', isFilterable: true, isRequired: false, displayOrder: 8 },
    ],
    subcategories: [
      'Gaming Monitors',
      'UltraWide Monitors',
      'Professional Monitors',
      'Budget Monitors',
      '4K Monitors',
      'Curved Monitors',
    ],
  },
  processors: {
    attributes: [
      { name: 'series', type: 'text', isFilterable: true, isRequired: true, displayOrder: 1 },
      { name: 'socket', type: 'text', isFilterable: true, isRequired: true, displayOrder: 2 },
      { name: 'cores', type: 'text', isFilterable: true, isRequired: true, displayOrder: 3 },
      { name: 'threads', type: 'text', isFilterable: true, isRequired: true, displayOrder: 4 },
      { name: 'base_clock', type: 'text', isFilterable: true, isRequired: true, displayOrder: 5 },
      { name: 'boost_clock', type: 'text', isFilterable: true, isRequired: true, displayOrder: 6 },
      { name: 'cache', type: 'text', isFilterable: true, isRequired: true, displayOrder: 7 },
      { name: 'tdp', type: 'text', isFilterable: true, isRequired: true, displayOrder: 8 },
    ],
    subcategories: [
      'Intel Core',
      'AMD Ryzen',
      'Server Processors',
      'Budget Processors',
      'High-End Processors',
    ],
  },
  graphics_cards: {
    attributes: [
      { name: 'chipset', type: 'text', isFilterable: true, isRequired: true, displayOrder: 1 },
      { name: 'memory_size', type: 'text', isFilterable: true, isRequired: true, displayOrder: 2 },
      { name: 'memory_type', type: 'text', isFilterable: true, isRequired: true, displayOrder: 3 },
      { name: 'core_clock', type: 'text', isFilterable: true, isRequired: true, displayOrder: 4 },
      { name: 'boost_clock', type: 'text', isFilterable: true, isRequired: true, displayOrder: 5 },
      { name: 'interface', type: 'text', isFilterable: true, isRequired: true, displayOrder: 6 },
      { name: 'tdp', type: 'text', isFilterable: true, isRequired: true, displayOrder: 7 },
      { name: 'power_connectors', type: 'text', isFilterable: true, isRequired: true, displayOrder: 8 },
    ],
    subcategories: [
      'NVIDIA GeForce',
      'AMD Radeon',
      'Workstation Graphics',
      'Entry-Level Graphics Cards',
      'Mid-Range Graphics Cards',
      'High-End Graphics Cards',
    ],
  },
  storage: {
    attributes: [
      { name: 'type', type: 'text', isFilterable: true, isRequired: true, displayOrder: 1 },
      { name: 'capacity', type: 'text', isFilterable: true, isRequired: true, displayOrder: 2 },
      { name: 'interface', type: 'text', isFilterable: true, isRequired: true, displayOrder: 3 },
      { name: 'read_speed', type: 'text', isFilterable: true, isRequired: true, displayOrder: 4 },
      { name: 'write_speed', type: 'text', isFilterable: true, isRequired: true, displayOrder: 5 },
      { name: 'form_factor', type: 'text', isFilterable: true, isRequired: true, displayOrder: 6 },
      { name: 'cache', type: 'text', isFilterable: true, isRequired: false, displayOrder: 7 },
    ],
    subcategories: [
      'SSD',
      'HDD',
      'NVMe SSDs',
      'External Storage',
      'USB Flash Drives',
      'Memory Cards',
    ],
  },
  cabinets: {
    attributes: [
      { name: 'form_factor', type: 'text', isFilterable: true, isRequired: true, displayOrder: 1 },
      { name: 'motherboard_support', type: 'text', isFilterable: true, isRequired: true, displayOrder: 2 },
      { name: 'drive_bays', type: 'text', isFilterable: true, isRequired: true, displayOrder: 3 },
      { name: 'expansion_slots', type: 'text', isFilterable: true, isRequired: true, displayOrder: 4 },
      { name: 'cooling_options', type: 'text', isFilterable: true, isRequired: true, displayOrder: 5 },
      { name: 'front_panel_ports', type: 'text', isFilterable: true, isRequired: true, displayOrder: 6 },
      { name: 'gpu_clearance', type: 'text', isFilterable: true, isRequired: true, displayOrder: 7 },
      { name: 'psu_support', type: 'text', isFilterable: true, isRequired: true, displayOrder: 8 },
    ],
    subcategories: [
      'Mid Tower',
      'Full Tower',
      'Mini Tower',
      'Micro ATX',
      'ITX Cases',
      'Gaming Cases',
    ],
  },
  accessories: {
    attributes: [
      { name: 'connectivity', type: 'text', isFilterable: true, isRequired: true, displayOrder: 1 },
      { name: 'compatibility', type: 'text', isFilterable: true, isRequired: true, displayOrder: 2 },
      { name: 'color', type: 'text', isFilterable: true, isRequired: true, displayOrder: 3 },
    ],
    subcategories: [
      'Keyboards',
      'Mice',
      'Headsets',
      'Webcams',
      'Microphones',
      'Controllers',
      'Cables',
      'Adapters',
    ],
  },
};

// Initialize database connection for Neon HTTP
const sql = neon('postgresql://neondb_owner:npg_g8t6oRqCKOWj@ep-orange-credit-a5tovk1v-pooler.us-east-2.aws.neon.tech/360electronics?sslmode=require');
const db = drizzle(sql, { schema: { categories, attributeTemplates, subcategories } });

async function seedCategories() {
  try {
    console.log('Starting category seeding...');

    // Clear existing data (optional, comment out to keep existing data)
    await db.delete(subcategories);
    await db.delete(attributeTemplates);
    await db.delete(categories);
    console.log('Cleared existing data.');

    // Seed each category
    for (const [key, preset] of Object.entries(computerCategoryPresets)) {
      try {
        // Capitalize the category name
        const name = key.charAt(0).toUpperCase() + key.slice(1);
        const slug = key.toLowerCase().replace(/\s+/g, '-');

        // Check if category slug already exists
        const existingCategory = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, slug))
          .limit(1);

        if (existingCategory.length > 0) {
          console.log(`Category with slug '${slug}' already exists, skipping...`);
          continue;
        }

        // Insert category
        const [newCategory] = await db
          .insert(categories)
          .values({
            name,
            slug,
            isActive: true,
            displayOrder: '0',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log(`Inserted category: ${name} (ID: ${newCategory.id})`);

        // Insert attribute template
        if (preset.attributes.length > 0) {
          try {
            await db.insert(attributeTemplates).values({
              categoryId: newCategory.id,
              name: `${name} Attributes`,
              attributes: preset.attributes.map((attr) => ({
                name: attr.name,
                type: attr.type as 'text' | 'number' | 'boolean' | 'select', // Explicitly cast type
                options: attr.options ?? null,
                unit: attr.unit ?? null,
                isFilterable: attr.isFilterable,
                isRequired: attr.isRequired,
                displayOrder: attr.displayOrder,
              })),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            console.log(`Inserted attributes for category: ${name}`);
          } catch (attrError) {
            console.error(`Failed to insert attributes for category ${name}:`, attrError);
            // Cleanup: Delete the category to avoid partial data
            await db.delete(categories).where(eq(categories.id, newCategory.id));
            console.log(`Cleaned up category ${name} due to attribute insertion failure.`);
            throw attrError;
          }
        }

        // Insert subcategories
        if (preset.subcategories.length > 0) {
          try {
            const subcategoryValues = preset.subcategories.map((name, index) => {
              const slug = name.toLowerCase().replace(/\s+/g, '-');
              if (!name.trim()) {
                throw new Error(`Subcategory name cannot be empty for category: ${name}`);
              }
              if (!slug) {
                throw new Error(`Invalid slug generated for subcategory: ${name}`);
              }
              return {
                categoryId: newCategory.id,
                name,
                slug,
                displayOrder: index.toString(),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            });

            await db.insert(subcategories).values(subcategoryValues);
            console.log(`Inserted ${subcategoryValues.length} subcategories for category: ${name}`);
          } catch (subError) {
            console.error(`Failed to insert subcategories for category ${name}:`, subError);
            // Cleanup: Delete the category and attributes
            await db.delete(attributeTemplates).where(eq(attributeTemplates.categoryId, newCategory.id));
            await db.delete(categories).where(eq(categories.id, newCategory.id));
            console.log(`Cleaned up category ${name} and attributes due to subcategory insertion failure.`);
            throw subError;
          }
        }
      } catch (categoryError) {
        console.error(`Failed to seed category ${key}:`, categoryError);
        continue; // Skip to the next category
      }
    }

    console.log('Category seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding categories:', error);
    // if (error.message.includes('unique constraint')) {
    //   console.error('A unique constraint violation occurred. Ensure category and subcategory slugs are unique.');
    // }
    throw error;
  }
}

// Run the seed function
seedCategories()
  .then(() => {
    console.log('Seeding finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });