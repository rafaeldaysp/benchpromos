import { Client } from '@notionhq/client'
import {
  type BlockObjectResponse,
  type PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'
import { NotionAPI } from 'notion-client'
import { cache } from 'react'

import { env } from '@/env.mjs'

export const notionClient = new Client({
  auth: env.NOTION_TOKEN,
})

export const notionClientUnofficial = new NotionAPI()

export async function getRecordMap(pageId: string) {
  return notionClientUnofficial.getPage(pageId)
}

export const getUser = cache((userId: string) => {
  return notionClient.users.retrieve({
    user_id: userId,
  })
})

export const getPages = cache((cursor?: string, limit?: number) => {
  return notionClient.databases.query({
    filter: {
      and: [
        {
          property: 'published',
          checkbox: {
            equals: true,
          },
        },
      ],
    },
    page_size: limit,
    start_cursor: cursor,
    sorts: [
      {
        timestamp: 'last_edited_time',
        direction: 'descending',
      },
    ],
    database_id: env.NOTION_DATABASE_ID,
  })
})

export const getPageContent = cache((pageId: string) => {
  return notionClient.blocks.children
    .list({ block_id: pageId })
    .then((res) => res.results as BlockObjectResponse[])
})

export const getPageBySlug = cache((slug: string) => {
  return notionClient.databases
    .query({
      database_id: env.NOTION_DATABASE_ID,
      filter: {
        property: 'slug',
        rich_text: {
          equals: slug,
        },
      },
    })
    .then((res) => res.results[0] as PageObjectResponse | undefined)
})
