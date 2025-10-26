"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FloatingButton } from "@/lib/floating-buttons";

interface FloatingActionButtonsProps {
  buttons: FloatingButton[];
}

export default function FloatingActionButtons({ buttons }: FloatingActionButtonsProps) {
  const router = useRouter();

  const handleClick = (button: FloatingButton) => {
    if (button.merchant) {
      router.push(`/shop/${button.merchant.slug}`);
    } else if (button.special_offer) {
      router.push(`/special-offers/${button.special_offer.slug}`);
    }
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
      style={{ 
        bottom: '24px',
        right: '24px',
      }}
    >
      {buttons.map((button) => {
        const iconUrl = button.icon?.url;
        const label = button.button_label;

        return (
          <button
            key={button.id}
            onClick={() => handleClick(button)}
            className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ease-in-out
                       bg-white text-gray-800 hover:scale-105
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 15px 15px -7px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
            }}
            aria-label={label || "Floating Action Button"}
            title={label || "Floating Action Button"}
          >
            {iconUrl ? (
              <Image 
                src={iconUrl} 
                alt={label || "icon"} 
                width={24} 
                height={24} 
                className="w-6 h-6" 
              />
            ) : (
              <span className="text-sm font-semibold">{label?.charAt(0).toUpperCase()}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

