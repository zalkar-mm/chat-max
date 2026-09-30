import type { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
  corner?: ReactNode
}

/** Экраны до входа: фон surface, карточка 400 без рамки; на mobile прижата к верху, чтобы не прыгала с клавиатурой. */
export function AuthLayout({ children, corner }: AuthLayoutProps) {
  return (
    <div className="relative min-h-dvh bg-surface">
      <div className="absolute top-4 right-4">{corner}</div>
      <main className="mx-auto flex min-h-dvh w-full max-w-(--auth-card-w) flex-col px-4 pt-12 pb-6 md:justify-center md:px-0 md:py-10">
        {children}
      </main>
    </div>
  )
}
