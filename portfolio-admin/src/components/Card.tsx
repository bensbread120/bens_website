export function Card({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white p-6 shadow-xl ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatTile({ label, value, detail, children }: { label: string; value: string; detail?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-xl">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-gray-900">{value}</div>
      {detail && <div className="mt-1 text-sm text-gray-600">{detail}</div>}
      {children}
    </div>
  )
}
