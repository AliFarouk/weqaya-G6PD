import React from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'compact' | 'emblem';
  className?: string;
  href?: string;
}

export function EmblemSvg({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      role="img"
      aria-label="شعار وقاية G6PD: درع واقٍ يحتضن قطرة دم وورقة نبات خضراء"
      viewBox="0 0 200 224"
      width={size}
      height={Math.round((size * 224) / 200)}
      className={`shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Protective Shield */}
      <path
        d="M100 8 C130 27 160 33 186 33 L186 110 C186 162 148 195 100 216 C52 195 14 162 14 110 L14 33 C40 33 70 27 100 8 Z"
        fill="#5E72E4"
      />
      {/* Inner White Shield */}
      <path
        d="M100 8 C130 27 160 33 186 33 L186 110 C186 162 148 195 100 216 C52 195 14 162 14 110 L14 33 C40 33 70 27 100 8 Z"
        transform="translate(100 112) scale(0.8) translate(-100 -112)"
        fill="#FFFFFF"
      />
      {/* Crimson Blood Drop */}
      <path
        d="M100 76 C100 76 68 112 68 134 A32 32 0 0 0 132 134 C132 112 100 76 100 76 Z"
        fill="#F5365C"
      />
      {/* Blood Drop Specular Highlight */}
      <path
        d="M84 138 A17 17 0 0 0 98 153"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Green Leaf */}
      <path
        d="M103 88 C108 60 132 46 158 46 C160 74 142 98 103 88 Z"
        fill="#2DCE89"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Leaf Central Vein */}
      <path
        d="M108 84 C124 76 140 64 152 52"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({ variant = 'compact', className = '', href = '/' }: LogoProps) {
  const innerContent = (
    <>
      {variant === 'emblem' ? (
        <EmblemSvg size={44} />
      ) : variant === 'compact' ? (
        <>
          <EmblemSvg size={36} className="w-[30px] h-[34px] sm:w-[36px] sm:h-[40px] shrink-0" />
          <span className="flex flex-col text-start">
            <span className="flex items-center gap-1 sm:gap-1.5 leading-none">
              <span className="font-nunito font-black text-base sm:text-xl text-[#5E72E4] tracking-[-0.5px] sm:tracking-[-1px]">
                Weqaya
              </span>
              <span className="font-nunito font-black text-base sm:text-xl text-[#F5365C] tracking-[-0.5px] sm:tracking-[-1px]">
                G6PD
              </span>
            </span>
            <span className="font-cairo font-bold text-xs text-[#5E72E4] hidden sm:block mt-1">
              وقاية انيميا الفول
            </span>
          </span>
        </>
      ) : (
        /* Full variant (used in hero or footer) */
        <>
          <EmblemSvg size={54} />
          <span className="flex flex-col text-start">
            <span className="flex items-center gap-2 leading-none">
              <span className="font-nunito font-black text-2xl md:text-3xl text-[#5E72E4] tracking-[-1px]">
                Weqaya
              </span>
              <span className="font-nunito font-black text-2xl md:text-3xl text-[#F5365C] tracking-[-1px]">
                G6PD
              </span>
            </span>
            <span className="font-cairo font-bold text-sm md:text-base text-[#5E72E4] mt-1">
              وقاية انيميا الفول — دليلك السريع
            </span>
          </span>
        </>
      )}
    </>
  );

  const containerClasses = `inline-flex items-center gap-3 select-none ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={`${containerClasses} transition-transform hover:scale-[1.02] active:scale-[0.98]`}
      >
        {innerContent}
      </Link>
    );
  }

  return <span className={containerClasses}>{innerContent}</span>;
}
