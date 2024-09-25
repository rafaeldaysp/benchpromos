'use client'

import { gql, useQuery } from '@apollo/client'
import * as React from 'react'

import { FileCard } from './file-uploader'
import { dataURLtoFile, getFileNameFromUrl, toDataURL } from '@/utils/files'
import { Icons } from '../icons'

const UPLOADED_FILES = gql`
  query UploadedFiles($productSlug: String!) {
    productFiles(productSlug: $productSlug)
  }
`

interface ProductFilesProps {
  productSlug: string
}

export function ProductFiles({ productSlug }: ProductFilesProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [isProcessingFiles, setIsProcessingFiles] = React.useState(false)

  const { data: uploadedFileUrls, loading: isFetchingFiles } = useQuery<{
    productFiles: string[]
  }>(UPLOADED_FILES, {
    errorPolicy: 'all',
    variables: {
      productSlug,
    },
  })
  React.useEffect(() => {
    setIsProcessingFiles(true)
    uploadedFileUrls?.productFiles.forEach((url) => {
      toDataURL(url)
        .then((dataUrl) => {
          const fileData: File = dataURLtoFile(dataUrl, getFileNameFromUrl(url))
          const file = Object.assign(fileData, {
            preview: url,
          })
          setFiles((prev) => [...prev, file])
        })
        .catch((error) => console.error('Error processing file:', error))
    })
    setIsProcessingFiles(false)
  }, [uploadedFileUrls, isProcessingFiles])

  const onDownload = (file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isProcessingFiles || isFetchingFiles)
    return (
      <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
    )

  return (
    <div className="space-y-4">
      {files.map((file, i) => (
        <FileCard key={i} file={file} onDownload={onDownload}></FileCard>
      ))}
    </div>
  )
}
