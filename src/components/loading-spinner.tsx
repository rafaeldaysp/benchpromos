export function LoadingSpinner() {
  return (
    <div className="flex h-[90vh] items-center justify-center opacity-50">
      <div className="size-24 animate-spin rounded-full border-y-2 border-primary ease-linear" />
    </div>
  )
}
