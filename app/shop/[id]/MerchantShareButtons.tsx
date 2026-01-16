"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/ShareDialog";
import { Facebook, Share2 } from "lucide-react";

export default function MerchantShareButtons({ title }: { title: string }) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const handleShare = (platform: "facebook" | "whatsapp" | "share-dialog") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, "_blank");
        break;
      case "share-dialog":
        setIsShareDialogOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <Button variant="outline" size="sm" className="rounded-full h-7 w-7 p-0" onClick={() => handleShare("facebook")}>
          <Facebook className="w-3.5 h-3.5 text-blue-600" />
        </Button>
        <Button variant="outline" size="sm" className="rounded-full h-7 w-7 p-0" onClick={() => handleShare("whatsapp")}>
          <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .96 4.534.96 10.09c0 1.744.413 3.379 1.144 4.826L.06 24l9.305-2.533a11.714 11.714 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.89a11.898 11.898 0 00-3.48-8.413Z" />
          </svg>
        </Button>
        <Button variant="outline" size="sm" className="rounded-full h-7 w-7 p-0" onClick={() => handleShare("share-dialog")}>
          <Share2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={title}
      />
    </>
  );
}
