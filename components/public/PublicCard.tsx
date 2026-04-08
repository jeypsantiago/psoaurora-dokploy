import React from 'react';

type Elevation = 'none' | 'soft' | 'medium';

interface PublicCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  elevation?: Elevation;
}

const elevationClass: Record<Elevation, string> = {
  none: '',
  soft: 'public-shadow-soft',
  medium: 'public-shadow-medium',
};

export const PublicCard: React.FC<PublicCardProps> = ({
  children,
  className = '',
  elevated = false,
  elevation = 'soft',
}) => {
  return (
    <div
      className={`${elevated ? 'psa-elevate' : ''} border border-psa-line dark:border-zinc-800 bg-white dark:bg-black ${elevationClass[elevation]} ${className}`}
    >
      {children}
    </div>
  );
};
