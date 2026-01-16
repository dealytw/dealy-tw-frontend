"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast as sonnerToast } from "sonner";

export default function ContactFormClient({ merchantName }: { merchantName: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
      merchantName: merchantName,
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

