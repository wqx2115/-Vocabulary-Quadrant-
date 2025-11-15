
import React from 'react';

interface QuadrantProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Quadrant: React.FC<QuadrantProps> = ({ title, icon, children, className }) => {
  return (
    <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 md:p-6 flex flex-col min-h-[300px] ${className}`}>
      <div className="flex items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
        {icon}
        <h2 className="text-lg md:text-xl font-bold text-slate-700 dark:text-slate-200 ml-3">
          {title}
        </h2>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {children}
      </div>
    </div>
  );
};

export default Quadrant;
