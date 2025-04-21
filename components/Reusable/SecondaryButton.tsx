'use client'
import React, { ReactNode, MouseEventHandler } from 'react';

interface SecondaryButtonProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  [key: string]: any;  // To accept any other props like data attributes, aria roles, etc.
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  icon = null,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        px-4 py-2 rounded-md
        bg-transparent
        border
        font-medium
        hover:bg-black
        cursor-pointer
        hover:text-primary-light
        transition-all duration-200 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </button>
  );
};

export default SecondaryButton;
