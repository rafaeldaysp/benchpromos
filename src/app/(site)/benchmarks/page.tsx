import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function BenchmarksPage() {
  return (
    <Card className="text-sm sm:text-base lg:col-span-4 lg:h-fit">
      <CardHeader className="px-3 text-center sm:px-8">
        <CardTitle>Selecione um benchmark</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pl-0 pt-0 sm:px-8 sm:pb-6">
        <p className="px-2 text-center">
          Navegue pelos diretórios de benchmarks e selecione aquele que você
          gostaria de visualizar.
        </p>
      </CardContent>
    </Card>
  )
}
