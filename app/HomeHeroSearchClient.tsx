"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchDropdown from "@/components/SearchDropdown";

export default function HomeHeroSearchClient({
  placeholder,
  inputId = "homepage-search-input",
}: {
  placeholder: string;
  inputId?: string;
}) {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto relative z-50 w-full min-w-0 px-2">
      <div className="flex bg-white rounded-full shadow-lg overflow-visible min-w-0">
        <div className="flex items-center pl-4 pr-2 flex-shrink-0 md:pl-6 md:pr-3">
          <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0 relative overflow-visible">
          <SearchDropdown
            placeholder={placeholder}
            className="w-full min-w-0 homepage-search"
            inputId={inputId}
          />
        </div>
        <Button
          type="button"
          onClick={() => {
            const input = document.getElementById(inputId) as HTMLInputElement | null;
            if (input?.value.trim()) {
              router.push(`/search?q=${encodeURIComponent(input.value.trim())}`);
            }
          }}
          className="m-1.5 md:m-2 px-4 md:px-8 py-2 text-sm bg-[#FF4790] hover:bg-[#E6397A] text-white rounded-full transition-colors flex-shrink-0"
        >
          搜尋
        </Button>
      </div>
    </div>
  );
}
