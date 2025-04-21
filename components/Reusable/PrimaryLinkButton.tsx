'use client';
import Link from 'next/link';
import React from 'react';
import type { LinkProps } from 'next/link';

interface PrimaryLinkButtonProps
  extends Omit<LinkProps, 'href'>,
    React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  href: string;
  className?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

const PrimaryLinkButton: React.FC<PrimaryLinkButtonProps> = ({
  href,
  children,
  icon = null,
  className = '',
  target = '_self',
  ...props
}) => {
  return (
    <Link
      href={href}
      target={target}
      className={`
        inline-flex items-center justify-center gap-2
        px-4 py-2 rounded-md
        bg-[var(--color-primary)]
        text-white font-medium
        hover:bg-[var(--color-primary-hover)]
        transition-colors duration-200 ease-in-out
        ${className}
      `}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </Link>
  );
};

export default PrimaryLinkButton;
