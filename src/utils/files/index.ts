export const convertBase64 = (file: File) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.readAsDataURL(file)

    fileReader.onload = () => {
      resolve(fileReader.result)
    }

    fileReader.onerror = (error) => {
      reject(error)
    }
  })
}

export const toDataURL = async (url: string): Promise<string> => {
  try {
    const response: Response = await fetch(url)
    const blob: Blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader: FileReader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string) // Casting result to string
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error fetching image:', error)
    throw error
  }
}

export const dataURLtoFile = (dataUrl: string, filename: string): File => {
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = header.match(/:(.*?);/)
  if (!mimeMatch) {
    throw new Error('Invalid data URL format')
  }
  const mime = mimeMatch[1]
  const binary = atob(base64)
  const length = binary.length
  const u8arr = new Uint8Array(length)

  for (let i = 0; i < length; i++) {
    u8arr[i] = binary.charCodeAt(i)
  }

  return new File([u8arr], filename, { type: mime })
}

export const getFileNameFromUrl = (url: string): string => {
  // Use URL constructor to safely parse the URL
  try {
    const parsedUrl = new URL(url)
    const pathSegments = parsedUrl.pathname.split('/')
    // Return the last segment of the path which should be the file name
    return pathSegments[pathSegments.length - 1]
  } catch (error) {
    console.error('Invalid URL:', error)
    throw new Error('Could not extract filename from URL')
  }
}
