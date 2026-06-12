import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export const Pagination: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <nav className={`mx-auto flex w-full justify-center ${className}`} aria-label="pagination">
      {children}
    </nav>
  );
};

export const PaginationContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <ul className={`flex flex-row items-center gap-1 ${className}`}>
      {children}
    </ul>
  );
};

export const PaginationItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return <li className={className}>{children}</li>;
};

export const PaginationLink: React.FC<{
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ children, isActive, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const PaginationPrevious: React.FC<{ onClick?: () => void; className?: string }> = ({
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 px-3 items-center gap-1 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer ${className}`}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </button>
  );
};

export const PaginationNext: React.FC<{ onClick?: () => void; className?: string }> = ({
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 px-3 items-center gap-1 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer ${className}`}
    >
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </button>
  );
};

export const PaginationEllipsis: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span className={`flex h-9 w-9 items-center justify-center ${className}`}>
      <MoreHorizontal className="h-4 w-4 text-slate-400" />
    </span>
  );
};
