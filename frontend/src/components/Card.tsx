import React from "react";

type CardProps = {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  hover?: boolean;
};

export default function Card({
  children,
  onClick,
  style,
  className = "",
  hover = false,
}: CardProps) {
  const cardStyle: React.CSSProperties = {
    ...style,
    cursor: onClick || hover ? "pointer" : "default",
  };

  return (
    <div
      className={`card ${hover ? "card-hover" : ""} ${className} fade-in`}
      style={cardStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
