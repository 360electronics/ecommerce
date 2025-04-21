'use client'
import React, { ReactNode, MouseEventHandler } from 'react';

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  [key: string]: any; 
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
        bg-[var(--color-primary)]
        cursor-pointer
        text-white font-medium
        hover:bg-[var(--color-primary-hover)]
        transition-colors duration-200 ease-in-out
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

export default PrimaryButton;
