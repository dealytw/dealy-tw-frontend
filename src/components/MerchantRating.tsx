"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface MerchantRatingProps {
  merchantName: string;
  ratingCount: number; // Server-computed for hydration consistency
}

export default function MerchantRating({ merchantName, ratingCount }: MerchantRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  // Default rating display (fake 5/5)
  const defaultRating = 5;
  const displayRating = selectedRating ?? defaultRating;

  const handleStarClick = (rating: number) => {
    if (hasVoted) return;
    
    setSelectedRating(rating);
    setHasVoted(true);
    setHoveredStar(null);
  };

  const handleStarHover = (starIndex: number) => {
    if (hasVoted) return;
    setHoveredStar(starIndex);
  };

  const handleMouseLeave = () => {
    if (hasVoted) return;
    setHoveredStar(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      <span className="text-base font-medium text-gray-900 whitespace-nowrap">
        {merchantName}優惠代碼及折扣有用嗎?請評分:
      </span>
      
      <div 
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          // Determine if star should be filled (orange) or grey
          // When hovering: fill up to hovered star, grey out the rest
          // When not hovering: fill up to display rating
          const isFilled = hoveredStar !== null
            ? starIndex <= hoveredStar // When hovering, fill up to hovered star
            : starIndex <= displayRating; // Otherwise, fill up to display rating
          
          return (
            <button
              key={starIndex}
              type="button"
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
              className="focus:outline-none transition-all"
              disabled={hasVoted}
              aria-label={`Rate ${starIndex} out of 5`}
            >
              <Star
                className={`w-5 h-5 transition-all ${
                  isFilled
                    ? "fill-orange-500 text-orange-500"
                    : "fill-gray-300 text-gray-300"
                } ${hasVoted ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
              />
            </button>
          );
        })}
      </div>
      
      <span className="text-sm text-gray-500 whitespace-nowrap" suppressHydrationWarning>
        平均評分:{displayRating}/5 {ratingCount}人已評分
      </span>
      
      {hasVoted && (
        <span className="text-sm text-green-600 font-medium whitespace-nowrap">
          感謝評分
        </span>
      )}
    </div>
  );
}

