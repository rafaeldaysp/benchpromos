import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function BenchmarksPage() {
  // await new Promise((r) => setTimeout(r, 10000))
  return (
    <Card className="lg:col-span-4 lg:h-fit">
      <CardHeader className="px-3 text-center sm:px-8">
        <CardTitle className="text-sm sm:text-base">
          Selecione um benchmark
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pl-0 pt-0 text-center sm:px-8 sm:pb-6">
        Navegue pelos diretórios de benchmarks e selecione aquele que você
        gostaria de visualizar.
      </CardContent>
    </Card>
  )
}
