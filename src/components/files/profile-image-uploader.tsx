'use client'

import { gql, useMutation } from '@apollo/client'
import * as React from 'react'

import { FileUploader } from '@/components/files/file-uploader'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { env } from '@/env.mjs'
import { convertBase64 } from '@/utils/files'
import { Icons } from '../icons'
import { UserAvatar } from '../user-avatar'

const UPLOAD_PROFILE_IMAGE = gql`
  mutation UploadFile($file: FileInput!, $path: String) {
    uploadFile(file: $file, path: $path)
  }
`

interface ProfileImageUploaderProps {
  userId: string
  user: {
    name: string
    image?: string | null
  }
  maxSize?: number
  onImageUploaded?: (imageUrl: string) => void
  disabled?: boolean
  className?: string
}

export function ProfileImageUploader({
  userId,
  user,
  maxSize = 5 * 1024 * 1024, // 5MB
  onImageUploaded,
  disabled = false,
  className,
}: ProfileImageUploaderProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [isUploading, setIsUploading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  const [uploadFile] = useMutation<{
    uploadFile: string
  }>(UPLOAD_PROFILE_IMAGE)

  const onUpload = async (uploadedFiles: File[]) => {
    if (uploadedFiles.length === 0) return

    setIsUploading(true)
    const file = uploadedFiles[0] // Só pega o primeiro arquivo

    try {
      const fileBase64 = await convertBase64(file)

      const result = await uploadFile({
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          file: {
            filename: file.name,
            fileBase64,
            mimetype: file.type,
          },
          path: `users/${userId}/profile`,
        },
      })

      const imageUrl = result.data?.uploadFile
      if (imageUrl) {
        console.log('Profile image uploaded successfully:', imageUrl)
        onImageUploaded?.(imageUrl)
        setFiles([]) // Limpa os arquivos após upload bem-sucedido
        setIsOpen(false) // Fecha o modal
      }
    } catch (err) {
      console.error('Error uploading profile image:', err)
    } finally {
      setIsUploading(false)
    }
  }

  // Reset files when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setFiles([])
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="group relative cursor-pointer">
          <UserAvatar
            user={{
              name: user.name || null,
              image: user.image || null,
            }}
            className={className}
          />
          {/* Overlay com hover effect */}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {isUploading ? (
              <Icons.Spinner
                className="size-5 animate-spin text-white"
                aria-hidden="true"
              />
            ) : (
              <Icons.Image className="size-5 text-white" aria-hidden="true" />
            )}
          </div>
          {disabled && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-muted/80">
              <Icons.Lock className="size-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:w-full sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Alterar foto de perfil</DialogTitle>
          <DialogDescription>
            Selecione uma imagem para usar como sua foto de perfil.
          </DialogDescription>
        </DialogHeader>

        <FileUploader
          onUpload={onUpload}
          maxFileCount={1}
          maxSize={maxSize}
          multiple={false}
          onValueChange={setFiles}
          value={files}
          accept={{
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
          }}
          disabled={isUploading}
        />
      </DialogContent>
    </Dialog>
  )
}
