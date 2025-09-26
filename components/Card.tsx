
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:border dark:border-slate-700 p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
};

export default Card;