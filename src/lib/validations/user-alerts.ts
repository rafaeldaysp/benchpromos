import * as z from 'zod'

export const userAlertsSchema = z.object({
  selectedCategories: z.array(z.string()),
  subscribedProducts: z.array(
    z.object({
      productId: z.string(),
      price: z.number(),
    }),
  ),
})
