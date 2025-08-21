'use client'

import Image from 'next/image'
import { useState } from 'react'

import { type Benchmark, type BenchmarkResult } from '@/types'
import { Icons } from './icons'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'

interface ProductBenchmarkCardProps {
  benchmark: Benchmark & {
    children: (Benchmark & { results: BenchmarkResult[] })[]
  }
}

export function ProductBenchmarkCard({ benchmark }: ProductBenchmarkCardProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string>()
  const testImage = 'https://edu.ceskatelevize.cz/storage/video/placeholder.jpg'
  return (
    <Dialog>
      <Card className="flex flex-1 cursor-pointer flex-col overflow-hidden border-none">
        <CardContent
          className="group relative p-0"
          onMouseEnter={() => {
            setShowInfo(true)
          }}
          onMouseLeave={() => {
            setShowInfo(false)
          }}
        >
          <div className="relative aspect-video w-full group-hover:opacity-30 group-hover:transition-opacity">
            <Image
              src={benchmark.imageUrl ?? testImage}
              alt={benchmark.name}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              fill
              className="object-contain"
            />
          </div>
          {showInfo && (
            <div className="absolute left-0 top-0 flex size-full flex-col items-center justify-center space-y-4 break-words p-2 text-center">
              <Badge className="text-sm"> {benchmark.name}</Badge>
              <ScrollArea className="h-max w-full">
                <div className="flex flex-col items-center justify-center gap-y-2 px-2.5 text-center">
                  {benchmark.children?.map((chield) => {
                    return chield.results?.map((resultData) => (
                      <DialogTrigger key={resultData.id}>
                        <Badge
                          onClick={() => setSelectedVideo(resultData.video)}
                          variant={'secondary'}
                          className="flex w-fit items-center justify-center"
                          key={resultData.id.concat('1')}
                        >
                          {chield.name
                            .replace(new RegExp(benchmark.name, 'ig'), '')
                            .replace('-', '')
                            .trim()
                            .concat(` [${resultData.result.toString()}]`)
                            .concat(` ${resultData.description?.toString()}`)}
                          {resultData.video && (
                            <Icons.ExternalLink className="ml-2 size-4" />
                          )}
                        </Badge>
                      </DialogTrigger>
                    ))
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVideo && (
        <DialogContent className="w-full sm:max-w-screen-xl">
          <div className="aspect-video p-2">
            <iframe
              width="100%"
              height="100%"
              src={selectedVideo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
