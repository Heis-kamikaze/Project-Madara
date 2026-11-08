interface Props {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onClick: () => void
}

export default function LoadMore({ hasNextPage, isFetchingNextPage, onClick }: Props) {
  if (!hasNextPage) return null
  return (
    <button type="button" onClick={onClick} disabled={isFetchingNextPage}>
      {isFetchingNextPage ? 'Loading…' : 'Load more'}
    </button>
  )
}
