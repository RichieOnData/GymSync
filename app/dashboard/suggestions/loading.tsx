export default function SuggestionsLoading() {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-zinc-800 rounded-md animate-pulse"></div>
            <div className="h-4 w-96 bg-zinc-800 rounded-md animate-pulse mt-2"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-zinc-800 rounded-md animate-pulse"></div>
            <div className="h-10 w-32 bg-zinc-800 rounded-md animate-pulse"></div>
          </div>
        </div>
  
        <div className="h-10 w-full bg-zinc-800 rounded-md animate-pulse"></div>
  
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-zinc-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }
  
  