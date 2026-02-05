"use client";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, X, Mail, Share2, Copy, Check, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

export function ShareDialog({ open, onOpenChange, url, title }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // url is server-rendered from parent - no client resolution needed

  const effectiveUrl = url;

  // Check if scrolling is needed
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowRightArrow(scrollWidth > clientWidth);
      }
    };
    
    if (open) {
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }
  }, [open]);

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(effectiveUrl);
      setCopied(true);
      toast({
        title: "已複製",
        description: "連結已複製到剪貼簿",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "複製失敗",
        description: "無法複製連結",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(effectiveUrl);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'x':
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodedTitle}&body=${encodedUrl}`, '_blank');
        break;
      case 'threads':
        window.open(`https://threads.net/intent/post?text=${encodedTitle}%20${encodedUrl}`, '_blank');
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Share Options - Single Row with Scroll */}
          <div className="relative">
            <div 
              ref={scrollContainerRef}
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
            >
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-full shadow-md hover:shadow-lg transition-shadow"
                onClick={() => handleShare('whatsapp')}
              >
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .96 4.534.96 10.09c0 1.744.413 3.379 1.144 4.826L.06 24l9.305-2.533a11.714 11.714 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.89a11.898 11.898 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <span className="text-[10px] leading-tight">WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-full shadow-md hover:shadow-lg transition-shadow"
                onClick={() => handleShare('facebook')}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Facebook className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] leading-tight">Facebook</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-full shadow-md hover:shadow-lg transition-shadow"
                onClick={() => handleShare('threads')}
              >
                <div className="w-8 h-8 rounded-full bg-[#101010] flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16.3 11.3c-.1 0-.2-.1-.2-.1-.1-2.6-1.5-4-3.9-4-1.4 0-2.6.6-3.3 1.7l1.3.9c.5-.8 1.4-1 2-1 .8 0 1.4.2 1.7.7.3.3.5.8.5 1.3-.7-.1-1.4-.2-2.2-.1-2.2.1-3.7 1.4-3.6 3.2 0 .9.5 1.7 1.3 2.2.7.4 1.5.6 2.4.6 1.2-.1 2.1-.5 2.7-1.3.5-.6.8-1.4.9-2.4.6.3 1 .8 1.2 1.3.4.9.4 2.4-.8 3.6-1.1 1.1-2.3 1.5-4.3 1.5-2.1 0-3.8-.7-4.8-2S5.7 14.3 5.7 12c0-2.3.5-4.1 1.5-5.4 1.1-1.3 2.7-2 4.8-2 2.2 0 3.8.7 4.9 2 .5.7.9 1.5 1.2 2.5l1.5-.4c-.3-1.2-.8-2.2-1.5-3.1-1.3-1.7-3.3-2.6-6-2.6-2.6 0-4.7.9-6 2.6C4.9 7.2 4.3 9.3 4.3 12s.6 4.8 1.9 6.4c1.4 1.7 3.4 2.6 6 2.6 2.3 0 4-.6 5.3-2 1.8-1.8 1.7-4 1.1-5.4-.4-.9-1.2-1.7-2.3-2.3zm-4 3.8c-1 .1-2-.4-2-1.3 0-.7.5-1.5 2.1-1.6h.5c.6 0 1.1.1 1.6.2-.2 2.3-1.3 2.7-2.2 2.7z"/>
                  </svg>
                </div>
                <span className="text-[10px] leading-tight">Threads</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-full shadow-md hover:shadow-lg transition-shadow"
                onClick={() => handleShare('x')}
              >
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] leading-tight">X</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-full shadow-md hover:shadow-lg transition-shadow"
                onClick={() => handleShare('email')}
              >
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] leading-tight">電子郵件</span>
              </Button>
            </div>
            
            {/* Right Arrow - Show when content overflows */}
            {showRightArrow && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-1.5 shadow-md z-10 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            )}
          </div>

          {/* Link Copy Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={effectiveUrl}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={handleCopy}
                variant={copied ? "default" : "outline"}
                size="sm"
                className="min-w-[80px]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    已複製
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    複製
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

