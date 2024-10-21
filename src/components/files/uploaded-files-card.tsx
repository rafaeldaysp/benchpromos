import { EmptyCard } from '@/components/empty-card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { FileCard } from './file-uploader'

interface UploadedFilesCardProps {
  uploadedFiles: File[]
}

export function UploadedFilesCard({ uploadedFiles }: UploadedFilesCardProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Arquivos carregados</DialogTitle>
        <DialogDescription>Veja os arquivos carregados aqui</DialogDescription>
      </DialogHeader>
      {uploadedFiles.length > 0 ? (
        <ScrollArea className="pb-4">
          <div className="flex w-max space-x-2.5">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative aspect-video w-64">
                <FileCard file={file} onRemove={() => console.log('removed')} />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <EmptyCard
          title="Não há arquivos carregados"
          description="Carregue alguns arquivos para vê-los por aqui"
          className="w-full"
        />
      )}
    </>
  )
}
