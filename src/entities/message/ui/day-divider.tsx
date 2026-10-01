type DayDividerProps = {
  label: string
}

export function DayDivider({ label }: DayDividerProps) {
  return (
    <div className="sticky top-2 z-10 flex justify-center py-2">
      <span className="bg-date-pill text-date-pill typo-label rounded-full px-3 py-1 font-medium">
        {label}
      </span>
    </div>
  )
}
