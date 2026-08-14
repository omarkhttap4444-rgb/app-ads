'use client';

import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { getTrackedPlayStoreUrl, type PlayStorePlacement } from '@/lib/app-store';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  placement?: PlayStorePlacement;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export default function PlayStoreLink({
  placement = 'unknown',
  onClick,
  children,
  target = '_blank',
  rel = 'noopener noreferrer',
  ...props
}: Props) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const eventData = {
      app_store: 'google_play',
      placement,
      page_path: window.location.pathname,
    };

    if (window.gtag) {
      window.gtag('event', 'app_store_click', eventData);
    } else {
      window.dataLayer?.push({ event: 'app_store_click', ...eventData });
    }

    onClick?.(event);
  };

  return (
    <a
      {...props}
      href={getTrackedPlayStoreUrl(placement)}
      target={target}
      rel={rel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

