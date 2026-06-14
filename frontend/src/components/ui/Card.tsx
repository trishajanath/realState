import React from 'react';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', style, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      style={{
        backgroundColor: '#0A0A0A',
        border: '1px solid #1F1F1F',
        borderRadius: '8px',
        color: '#FFFFFF',
        ...style,
      }}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', style, ...props }, ref) => (
    <div ref={ref} className={`flex flex-col gap-1.5 p-5 ${className}`} style={style} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', style, ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-sm font-semibold leading-none tracking-tight ${className}`}
      style={{ color: '#FFFFFF', ...style }}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', style, ...props }, ref) => (
    <p ref={ref} className={`text-xs ${className}`} style={{ color: '#71717A', ...style }} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', style, ...props }, ref) => (
    <div ref={ref} className={`p-5 pt-0 ${className}`} style={style} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', style, ...props }, ref) => (
    <div ref={ref} className={`flex items-center p-5 pt-0 ${className}`} style={style} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
