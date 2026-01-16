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
    <div className="max-w-2xl mx-auto relative z-50">
      <div className="flex bg-white rounded-full shadow-lg overflow-visible">
        <div className="flex items-center pl-6 pr-3">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1 relative overflow-visible">
          <SearchDropdown
            placeholder={placeholder}
            className="w-full homepage-search"
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
          className="m-2 px-8 py-2 bg-[#FF4790] hover:bg-[#E6397A] text-white rounded-full transition-colors"
        >
          搜尋
        </Button>
      </div>
    </div>
  );
}
