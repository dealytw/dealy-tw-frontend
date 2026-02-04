"use client";

import { useRef, useState, useEffect } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast as sonnerToast } from "sonner";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function ContactFormClient({ merchantName }: { merchantName: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const pageLoadTsRef = useRef<number>(Date.now());

  const resetTurnstile = () => {
    if (typeof window !== "undefined" && (window as any).turnstile && turnstileWidgetIdRef.current) {
      try {
        (window as any).turnstile.reset(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
        setTurnstileToken(null);
      } catch {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && (window as any).turnstile && turnstileWidgetIdRef.current) {
        try {
          (window as any).turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      sonnerToast.error("提交失敗", {
        description: "請稍候，驗證尚未完成。",
        duration: 5000,
      });
      return;
    }
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
      merchantName: merchantName,
      turnstileToken: turnstileToken || undefined,
      pageLoadTs: pageLoadTsRef.current,
      company_website: formData.get("company_website") as string | undefined,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = "請稍後再試。";
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        sonnerToast.error("提交失敗", { description: errorMessage, duration: 5000 });
        return;
      }

      const result = await response.json();
      sonnerToast.success("✅ 提交成功！", {
        description: result?.message || "我們會盡快回覆您的訊息。",
        duration: 5000,
      });

      if (formRef.current) formRef.current.reset();
      resetTurnstile();
    } catch (error) {
      sonnerToast.error("提交失敗", {
        description: error instanceof Error ? error.message : "網路錯誤，請檢查連線後再試。",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot - hidden from users, bots will fill it */}
      <div className="absolute -left-[9999px] w-1 h-1 overflow-hidden" aria-hidden="true">
        <label htmlFor="company_website">請勿填寫</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {TURNSTILE_SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="lazyOnload"
            onLoad={() => {
              if (
                typeof window !== "undefined" &&
                (window as any).turnstile &&
                turnstileContainerRef.current &&
                !turnstileWidgetIdRef.current
              ) {
                const w = (window as any).turnstile.render(turnstileContainerRef.current, {
                  sitekey: TURNSTILE_SITE_KEY,
                  callback: (token: string) => {
                    setTurnstileToken(token);
                  },
                  "error-callback": () => setTurnstileToken(null),
                  "expired-callback": () => setTurnstileToken(null),
                });
                turnstileWidgetIdRef.current = w;
              }
            }}
          />
          <div ref={turnstileContainerRef} />
        </>
      )}
      <div>
        <Label htmlFor="contact-name" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          ✍️ 你的名字 *
        </Label>
        <Input id="contact-name" name="name" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          💗 你的電郵 *
        </Label>
        <Input id="contact-email" name="email" type="email" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="contact-message" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          ✍️ 你的信息 （歡迎任何意見或問題） *
        </Label>
        <Textarea id="contact-message" name="message" rows={6} required className="mt-1" />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 disabled:opacity-50"
      >
        {isSubmitting ? "提交中..." : "📧提交"}
      </Button>
    </form>
  );
}
