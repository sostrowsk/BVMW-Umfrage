import React from "react";
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}
const Card: React.FC<CardProps> = ({ 
  children, 
  className = "", 
  onClick,
  hover = true 
}) => {
  const hoverClass = hover && onClick ? "hover:shadow-lg hover:-translate-y-1" : hover ? "hover:shadow-lg" : "";
  const cursorClass = onClick ? "cursor-pointer" : "";
  
  return (
    <div 
      className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${hoverClass} ${cursorClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
export default Card;