import sharp from 'sharp'

// WhatsApp sizes an image card from the image's own aspect ratio, so portrait
// product photos become very tall cards. Posting a square version (the photo
// fitted inside, sides filled with its backdrop colour) keeps cards compact.
const MAX_SIDE_PX = 1280
const FETCH_TIMEOUT_MS = 15000
const MAX_SOURCE_BYTES = 15 * 1024 * 1024
const JPEG_QUALITY = 85

interface Rgb {
  r: number
  g: number
  b: number
}

/** Average colour of the four corner pixels — usually the photo's backdrop. */
export async function sampleCornerColor(input: Buffer): Promise<Rgb> {
  const { data, info } = await sharp(input)
    .rotate()
    .flatten({ background: '#ffffff' })
    .toColourspace('srgb')
    .resize(16, 16, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const right = info.width - 1
  const bottom = info.height - 1
  const corners = [
    [0, 0],
    [right, 0],
    [0, bottom],
    [right, bottom],
  ]
  const sum = { r: 0, g: 0, b: 0 }

  for (const [x, y] of corners) {
    const offset = (y * info.width + x) * info.channels
    sum.r += data[offset]
    sum.g += data[offset + 1]
    sum.b += data[offset + 2]
  }

  return {
    r: Math.round(sum.r / 4),
    g: Math.round(sum.g / 4),
    b: Math.round(sum.b / 4),
  }
}

/**
 * Fits an image inside a square JPEG (no cropping, no upscaling beyond the
 * image's longest side, capped at 1280px), filling the empty sides with the
 * colour sampled from the image's corners.
 *
 * @example const square = await frameImageSquare(await response.arrayBuffer())
 */
export async function frameImageSquare(input: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(input).metadata()

  if (!width || !height) {
    throw new Error(
      `Imagem sem dimensões legíveis (width=${width}, height=${height}).`,
    )
  }

  const side = Math.min(Math.max(width, height), MAX_SIDE_PX)
  const background = await sampleCornerColor(input)

  return sharp(input)
    .rotate()
    .flatten({ background })
    .resize(side, side, { fit: 'contain', background })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer()
}

async function downloadImage(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl, {
    cache: 'no-store',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Download da imagem falhou (status=${response.status}).`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())

  if (bytes.length > MAX_SOURCE_BYTES) {
    throw new Error(
      `Imagem grande demais (${bytes.length} bytes, máximo ${MAX_SOURCE_BYTES}).`,
    )
  }

  return bytes
}

/**
 * Downloads and squares a post image for WhatsApp, in memory only. Returns
 * null on any failure so the caller can fall back to sending the original URL.
 */
export async function prepareSquareWhatsappImage(imageUrl: string) {
  try {
    return await frameImageSquare(await downloadImage(imageUrl))
  } catch (error) {
    console.error('whatsapp image framing failed, sending original', {
      imageUrl,
      error: error instanceof Error ? error.message : error,
    })
    return null
  }
}
