import React from "react";

interface IconProps {
    size?: number;
    className?: string; // Para clases de Tailwind
    color?: string;
}

export const EliLogo: React.FC<IconProps> = ({
    size = 24,
    className = "",
    color = "currentColor",
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24" // <--- AJUSTA ESTO SEGÚN TU SVG ORIGINAL (ej. 0 0 512 512)
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* 
        INSTRUCCIONES:
        1. Abre tu logo SVG en un editor de texto o VSCode.
        2. Copia todo lo que esté dentro de las etiquetas <svg>...</svg> (paths, circles, etc).
        3. Pégalos aquí abajo.
      */}

            {/* Ejemplo (círculo temporal): Reemplazar con tus <path d="..." /> */}
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />

        </svg>
    );
};
