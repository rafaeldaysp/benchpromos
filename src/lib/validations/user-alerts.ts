import * as z from 'zod'

export const userAlertsSchema = z.object({
  selectedCategories: z.array(z.string()),
  subscribedProducts: z.array(
    z.object({
      product: z.object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        imageUrl: z.string(),
        deals: z.array(
          z.object({
            price: z.number(),
          }),
        ),
      }),
      subscribedPrice: z.coerce.number().int(),
    }),
  ),
})
