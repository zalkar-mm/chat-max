export function NoChatSelected() {
  return (
    <section className="flex h-full items-center justify-center bg-chat p-4" aria-label="Чат">
      <p className="rounded-full bg-tertiary px-4 py-2 typo-detail text-secondary">
        Выберите чат или начните новый
      </p>
    </section>
  )
}
