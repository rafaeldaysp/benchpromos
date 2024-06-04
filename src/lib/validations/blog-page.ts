import * as z from 'zod'

export const blogPageSchema = z.object({
  id: z.string(),
  created_time: z.string(),
  properties: z.object({
    thumbnail: z.object({
      files: z.array(
        z.object({
          external: z
            .object({
              url: z.string(),
            })
            .optional(),
          file: z
            .object({
              url: z.string(),
            })
            .optional(),
        }),
      ),
    }),
    title: z.object({
      title: z.array(
        z.object({
          plain_text: z.string(),
        }),
      ),
    }),
    summary: z.object({
      rich_text: z.array(
        z.object({
          plain_text: z.string(),
        }),
      ),
    }),
    slug: z.object({
      rich_text: z.array(
        z.object({
          plain_text: z.string(),
        }),
      ),
    }),
    productSlug: z
      .object({
        rich_text: z.array(
          z.object({
            plain_text: z.string(),
          }),
        ),
      })
      .optional(),
    tags: z.object({
      multi_select: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        }),
      ),
    }),
    author: z.object({
      people: z.array(
        z.object({
          id: z.string(),
        }),
      ),
    }),
    category: z.object({
      select: z.object({
        name: z.string(),
      }),
    }),
  }),
})
