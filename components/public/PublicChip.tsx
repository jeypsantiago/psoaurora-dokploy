import React from 'react';

interface BaseProps {
  children: React.ReactNode;
  className?: string;
}

type ButtonChipProps = BaseProps & {
  href?: undefined;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

type LinkChipProps = BaseProps & {
  href: string;
  onClick?: undefined;
};

type PublicChipProps = ButtonChipProps | LinkChipProps;

const baseClass =
  'psa-focus-ring inline-flex items-center justify-center rounded-full border border-psa-line dark:border-zinc-700 bg-white dark:bg-black px-3 py-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:text-psa-blue dark:hover:text-blue-300';

export const PublicChip: React.FC<PublicChipProps> = (props) => {
  if ('href' in props && props.href) {
    return (
      <a href={props.href} className={`${baseClass} ${props.className ?? ''}`}>
        {props.children}
      </a>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={`${baseClass} ${props.className ?? ''}`}>
      {props.children}
    </button>
  );
};
