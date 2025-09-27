'use client'

import Link from 'next/link'
import * as React from 'react'

type SharedTransitionLinkProps = React.ComponentProps<typeof Link> & {
  viewTransitionName?: string
}

export function SharedTransitionLink({ viewTransitionName, children, ...props }: SharedTransitionLinkProps) {
  const spanRef = React.useRef<HTMLSpanElement>(null)

  const onClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (!document.startViewTransition || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

    e.preventDefault()
    const anchor = e.currentTarget
    const href = anchor.getAttribute('href') || ''
    document.startViewTransition(() => {
      window.history.pushState({}, '', href)
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
  }

  return (
    <Link {...props} onClick={onClick}>
      <span ref={spanRef} data-view-transition-name={viewTransitionName}>{children}</span>
    </Link>
  )
}


