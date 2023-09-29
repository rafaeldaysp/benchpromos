import * as z from 'zod'

export const userAlertsSchema = z.object({
  selectedCategories: z.array(z.string()),
  notification: z.string(),
})
