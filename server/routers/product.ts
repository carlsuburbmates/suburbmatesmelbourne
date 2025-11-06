import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createProduct,
  updateProduct,
  listProductsByVendor,
  getProductById,
  deactivateProduct,
  countProductsByVendor,
  getVendorTierLimit,
  getAllCategories,
  createCategory,
  getProductsByCategory,
  updateProductCategories,
} from "../db";
import { PRODUCT_KINDS, FULFILLMENT_METHODS } from "@shared/const";

// Zod schemas for product operations
const productCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or greater").transform(p => p.toString()),
  category: z.string().optional(),
  kind: z.enum(PRODUCT_KINDS),
  fulfillmentMethod: z.enum(FULFILLMENT_METHODS),
  stockQuantity: z.number().int().min(0, "Stock must be 0 or greater").default(999),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

const productUpdateSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or greater").transform(p => p.toString()).optional(),
  category: z.string().optional(),
  kind: z.enum(PRODUCT_KINDS).optional(),
  fulfillmentMethod: z.enum(FULFILLMENT_METHODS).optional(),
  stockQuantity: z.number().int().min(0, "Stock must be 0 or greater").optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

const productListSchema = z.object({
  vendorId: z.number().int().positive(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/**
 * Product router - handles vendor product CRUD operations
 * Phase 5 Step 2 Packet 5.7
 */
export const productRouter = router({
  /**
   * Create a new product (vendor only)
   * Enforces tier limits: BASIC=12, FEATURED=48
   */
  create: protectedProcedure
    .input(productCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      // Check if user is vendor
      if (user.role !== "vendor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only vendors can create products",
        });
      }

      // Get vendor's business ID from vendorsMeta
      // For now, we'll use user.id as vendorId (assumes 1:1 user:business mapping)
      // TODO: Implement proper business lookup when multiple businesses per user supported
      const vendorId = user.id;

      // Check tier limit
      const { current, limit, canAdd } = await getVendorTierLimit(vendorId);
      if (!canAdd) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Product limit reached. Your tier allows ${limit} products, you have ${current}.`,
        });
      }

      // Create product
      const product = await createProduct(vendorId, input);

      return {
        success: true,
        product,
        tierInfo: {
          current: current + 1,
          limit,
          remaining: limit - (current + 1),
        },
      };
    }),

  /**
   * Update an existing product (vendor only, ownership enforced)
   */
  update: protectedProcedure
    .input(productUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { id, ...updateData } = input;

      // Check if user is vendor
      if (user.role !== "vendor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only vendors can update products",
        });
      }

      // Get product to verify ownership
      const existingProduct = await getProductById(id);
      if (!existingProduct) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Verify ownership (vendorId should match user.id)
      if (existingProduct.vendorId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own products",
        });
      }

      // Update product
      const updatedProduct = await updateProduct(id, updateData);

      return {
        success: true,
        product: updatedProduct,
      };
    }),

  /**
   * List products by vendor (public)
   * Returns active products only by default
   */
  listByVendor: publicProcedure
    .input(productListSchema)
    .query(async ({ input }) => {
      const { vendorId, limit, offset } = input;

      const products = await listProductsByVendor(vendorId, limit, offset);
      const total = await countProductsByVendor(vendorId);

      return {
        products,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  /**
   * Get single product by ID (public)
   */
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const product = await getProductById(input.id);

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return product;
    }),

  /**
   * Deactivate a product (soft delete, vendor only)
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      // Check if user is vendor
      if (user.role !== "vendor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only vendors can deactivate products",
        });
      }

      // Get product to verify ownership
      const existingProduct = await getProductById(input.id);
      if (!existingProduct) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Verify ownership
      if (existingProduct.vendorId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only deactivate your own products",
        });
      }

      // Deactivate product
      await deactivateProduct(input.id);

      return {
        success: true,
        message: "Product deactivated successfully",
      };
    }),

  /**
   * Check tier limit for current vendor
   * Useful for UI to show remaining product slots
   */
  checkTierLimit: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    // Check if user is vendor
    if (user.role !== "vendor") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only vendors can check tier limits",
      });
    }

    const vendorId = user.id;
    const tierInfo = await getVendorTierLimit(vendorId);

    return tierInfo;
  }),

  // ============ CATEGORIES ROUTER (Phase 5.9) ============

  /**
   * List all available categories
   * Public endpoint
   */
  categories: router({
    listAll: publicProcedure.query(async () => {
      return await getAllCategories();
    }),

    /**
     * Create a new category
     * Admin only
     */
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
          description: z.string().optional(),
          icon: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const category = await createCategory({
            name: input.name,
            slug: input.slug,
            description: input.description,
            icon: input.icon,
          });
          return { success: true, category };
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Failed to create category",
          });
        }
      }),

    /**
     * Get products by category slug with pagination
     * Public endpoint
     */
    getProductsByCategory: publicProcedure
      .input(
        z.object({
          slug: z.string().min(1),
          limit: z.number().int().min(1).max(100).default(20),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        const result = await getProductsByCategory(input.slug, input.limit, input.offset);

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }

        return result;
      }),

    /**
     * Update product category assignments
     * Protected: vendor can update own product categories
     */
    updateProductCategories: protectedProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          categoryIds: z.array(z.number().int().positive()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { user } = ctx;

        // Get product
        const product = await getProductById(input.productId);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        // Verify ownership
        if (product.vendorId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update categories for your own products",
          });
        }

        try {
          await updateProductCategories(input.productId, input.categoryIds);
          return { success: true, message: "Product categories updated" };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to update categories",
          });
        }
      }),
  }),
});
