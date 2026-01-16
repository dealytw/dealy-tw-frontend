"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Tag } from "lucide-react";

interface SpecialOffer {
  id: number;
  title: string;
  slug: string;
  intro?: string;
  seo_title?: string;
  seo_description?: string;
  link: string;
}

interface SpecialOffersIndexClientProps {
  specialOffers: SpecialOffer[];
}

const SpecialOffersIndexClient = ({ specialOffers }: SpecialOffersIndexClientProps) => {
  const [activeFilter, setActiveFilter] = useState("全部");

  const filters = ["全部", "最新優惠", "熱門優惠"];

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {filters.map((filter) => (
          <Badge
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            className={`cursor-pointer px-4 py-2 text-sm ${
              activeFilter === filter
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </Badge>
        ))}
      </div>

      {/* Special Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {specialOffers.map((specialOffer) => (
          <Link key={specialOffer.id} href={specialOffer.link} className="block">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    特別優惠
                  </Badge>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{specialOffer.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm line-clamp-3 mb-4">
                  {specialOffer.intro || specialOffer.seo_description || "精選特別優惠與限時活動"}
                </CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  type="button"
                >
                  查看優惠詳情
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <Link href="/submit-coupons">
          <Button
            variant="outline"
            className="text-sm flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground mx-auto"
            type="button"
          >
            <Plus className="w-4 h-4" />
            提交優惠券
          </Button>
        </Link>
      </div>
    </>
  );
};

export default SpecialOffersIndexClient;
