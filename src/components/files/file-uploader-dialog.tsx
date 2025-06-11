'use client'

import { gql, useMutation, useQuery } from '@apollo/client'
import * as React from 'react'

import { FileUploader } from '@/components/files/file-uploader'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { env } from '@/env.mjs'
import {
  convertBase64,
  dataURLtoFile,
  getFileNameFromUrl,
  toDataURL,
} from '@/utils/files'
import { Icons } from '../icons'

const UPLOAD_FILES = gql`
  mutation UploadFile($file: FileInput!, $path: String) {
    uploadFile(file: $file, path: $path)
  }
`

const DELETE_FILE = gql`
  mutation DeleteFile($fileKey: String!) {
    deleteFile(fileKey: $fileKey)
  }
`

const UPLOADED_FILES = gql`
  query UploadedFiles($productSlug: String!) {
    productFiles(productSlug: $productSlug)
  }
`

interface FileUploadDialogProps {
  path: string
}

export function FileUploaderDialog({ path }: FileUploadDialogProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [isProcessingFiles, setIsProcessingFiles] = React.useState(false)

  const [uploadFile] = useMutation<{
    uploadFile: string
  }>(UPLOAD_FILES)

  const [deleteFile] = useMutation<{
    deleteFile: boolean
  }>(DELETE_FILE)

  const { data: uploadedFileUrls, loading: isFetchingFiles } = useQuery<{
    productFiles: string[]
  }>(UPLOADED_FILES, {
    errorPolicy: 'all',
    variables: {
      productSlug: path,
    },
  })

  React.useEffect(() => {
    if (!uploadedFileUrls?.productFiles.length) return
    setIsProcessingFiles(true)
    const fileArray: File[] = []
    uploadedFileUrls?.productFiles.forEach((url) => {
      toDataURL(url)
        .then((dataUrl) => {
          const fileData: File = dataURLtoFile(dataUrl, getFileNameFromUrl(url))
          const file = Object.assign(fileData, {
            preview: url,
          })
          fileArray.push(file)
        })
        .catch((error) => console.error('Error processing file:', error))
        .finally(() => {
          setFiles(fileArray)
          setIsProcessingFiles(false)
        })
    })
  }, [uploadedFileUrls])
  console.log(isProcessingFiles, isFetchingFiles)
  const onUpload = async (files: File[]) => {
    if (files.length === 0) return
    files.forEach(async (file) => {
      const fileb64 = await convertBase64(files[0])
      try {
        const result = await uploadFile({
          context: {
            headers: {
              'api-key': env.NEXT_PUBLIC_API_KEY,
            },
          },
          variables: {
            file: {
              filename: file.name,
              fileBase64: fileb64,
              mimetype: file.type,
            },
            path,
          },
        })

        console.log('Uploaded successfully:', result.data?.uploadFile)
      } catch (err) {
        console.error('Error uploading files:', err)
      }
    })
  }

  const onDelete = async (file: File) => {
    try {
      const result = await deleteFile({
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          fileKey: `${path}/${file.name}`,
        },
      })

      return result.data?.deleteFile ?? false
    } catch (err) {
      console.error('Error uploading files:', err)
      return false
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={isFetchingFiles || isProcessingFiles}
        >
          {(isFetchingFiles || isProcessingFiles) && (
            <Icons.Spinner
              className="mr-2 size-4 animate-spin"
              aria-hidden="true"
            />
          )}{' '}
          Arquivos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:w-full sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Carregar arquivos</DialogTitle>
          <DialogDescription>
            Arraste e solte sesu arquivos aqui ou clique para navegar.
          </DialogDescription>
        </DialogHeader>

        <FileUploader
          onUpload={onUpload}
          deleteFile={onDelete}
          maxFileCount={8}
          maxSize={50 * 1024 * 1024}
          onValueChange={setFiles}
          value={files}
        />
      </DialogContent>
    </Dialog>
  )
}
