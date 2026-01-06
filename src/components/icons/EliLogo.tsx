import React from "react";

interface IconProps {
    size?: number;
    className?: string; // Para clases de Tailwind
    color?: string; // No aplicará al PNG, pero se mantiene por compatibilidad
}

export const EliLogo: React.FC<IconProps> = ({
    size = 24,
    className = "",
}) => {
    return (
        <img
            src="/logoELI.png"
            alt="Logo ELI"
            width={size}
            height={size}
            className={`object-contain ${className}`}
            style={{
                width: size,
                height: size,
                display: "block"
            }}
        />
    );
};
