import { Fragment, type ReactNode } from 'react'

export type ReceiveBannerItem = {
  key: string
  isVisible: boolean
  render: () => ReactNode
}

type ReceiveBannerListProps = {
  /** В порядке приоритета: первый — самый важный. */
  items: ReceiveBannerItem[]
  /** Сколько баннеров показать; остальные ждут, пока закроются верхние. */
  limit: number
}

export function ReceiveBannerList({ items, limit }: ReceiveBannerListProps) {
  const visible = items.filter((item) => item.isVisible).slice(0, Math.max(0, limit))

  return visible.map((item) => <Fragment key={item.key}>{item.render()}</Fragment>)
}
