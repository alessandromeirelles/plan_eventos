
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = "h-10 w-auto", size = 'md' }) => {
  const [error, setError] = React.useState(false);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  if (error) {
    return (
      <div className={`flex items-center font-black tracking-tighter ${sizeClasses[size]} ${className}`}>
        <span className="text-brand-orange">Plan</span>
        <span className="text-brand-navy dark:text-white">Eventos</span>
      </div>
    );
  }

  return (
    <img 
      src="https://storage.googleapis.com/a1aa/image/q4zB851V_d9xXqIuWJ4qI_Z_e_Q-gV5f2kZqT404r4w.jpg" 
      alt="PlanEventos" 
      className={className}
      onError={() => setError(true)}
    />
  );
};

export default Logo;
