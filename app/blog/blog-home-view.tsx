"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BlogPost {
  id: number | string;
  title: string;
  subtitle: string;
  image: string;
  category: string;
  date: string;
  slug: string;
}

interface Category {
  id: number | string;
  name: string;
  slug: string;
}

interface BlogHomeViewProps {
  blogPosts: BlogPost[];
  categories: Category[];
  currentPage: number;
  totalPages: number;
  selectedCategory: string | null;
}

export default function BlogHomeView({
  blogPosts = [],
  categories = [],
  currentPage,
  totalPages,
  selectedCategory,
}: BlogHomeViewProps) {
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);

  const defaultCategoryNames = ["旅遊", "服飾", "護膚", "美妝", "網購平台", "家電"];

  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => defaultCategoryNames.includes(cat.name));
  }, [categories]);

  const hiddenCategories = useMemo(() => {
    return categories.filter((cat) => !defaultCategoryNames.includes(cat.name));
  }, [categories]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "剛剛";
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString("zh-TW", { month: "short", day: "numeric" });
  };

  const buildBlogHref = (opts: { page?: number; category?: string | null }) => {
    const params = new URLSearchParams();
    if (opts.category) params.set("category", opts.category);
    if (opts.page && opts.page > 1) params.set("page", String(opts.page));
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  };

  const pageNumbers = useMemo(() => {
    if (!totalPages || totalPages <= 1) return [];
    const maxAll = 15;
    if (totalPages <= maxAll) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const windowSize = 2;
    const start = Math.max(2, currentPage - windowSize);
    const end = Math.min(totalPages - 1, currentPage + windowSize);
    const nums = [1];
    for (let i = start; i <= end; i++) nums.push(i);
    nums.push(totalPages);
    return Array.from(new Set(nums));
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-full lg:max-w-5xl">
        {/* Blog Menu / Categories */}
        <div className="mb-8 border-b border-gray-200 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Link
              href="/blog"
              className={`text-sm font-semibold mr-1 ${
                !selectedCategory ? "text-pink-600" : "text-gray-900 hover:text-pink-600"
              }`}
            >
              最新文章
            </Link>

            {visibleCategories.map((cat) => (
              <Link
                key={cat.id}
                href={buildBlogHref({ category: cat.slug || null, page: 1 })}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  selectedCategory === cat.slug
                    ? "text-pink-700 bg-pink-50"
                    : "text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                }`}
              >
                {cat.name}
              </Link>
            ))}

            {hiddenCategories.length > 0 && (
              <button
                onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-all flex items-center gap-1"
              >
                {isCategoriesExpanded ? (
                  <>
                    <span>收起</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>更多</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {isCategoriesExpanded &&
              hiddenCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildBlogHref({ category: cat.slug || null, page: 1 })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    selectedCategory === cat.slug
                      ? "text-pink-700 bg-pink-50"
                      : "text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
          </div>
        </div>

        {/* Blog listings */}
        <div className="grid gap-5 md:grid-cols-2">
          {blogPosts.length === 0 ? (
            <div className="text-gray-500 text-center py-8 md:col-span-2">目前沒有文章</div>
          ) : (
            blogPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full">
                  <div className="relative h-44 md:h-48">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-gray-500 mb-2">{post.category || "最新優惠"}</div>
                    <h2 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.subtitle}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(post.date)}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Blog pagination">
            <Link
              href={buildBlogHref({ category: selectedCategory, page: Math.max(1, currentPage - 1) })}
              className={`px-3 py-2 text-sm rounded-md border ${
                currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-gray-50"
              }`}
              aria-disabled={currentPage <= 1}
            >
              上一頁
            </Link>

            <div className="flex items-center gap-1">
              {pageNumbers.map((p, idx) => {
                const prev = pageNumbers[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <span key={`page-${p}`} className="flex items-center gap-1">
                    {showEllipsis && <span className="px-1 text-gray-400">…</span>}
                    <Link
                      href={buildBlogHref({ category: selectedCategory, page: p })}
                      className={`px-3 py-2 text-sm rounded-md border ${
                        p === currentPage ? "bg-pink-50 text-pink-700 border-pink-200" : "hover:bg-gray-50"
                      }`}
                      aria-current={p === currentPage ? "page" : undefined}
                    >
                      {p}
                    </Link>
                  </span>
                );
              })}
            </div>

            <Link
              href={buildBlogHref({ category: selectedCategory, page: Math.min(totalPages, currentPage + 1) })}
              className={`px-3 py-2 text-sm rounded-md border ${
                currentPage >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-gray-50"
              }`}
              aria-disabled={currentPage >= totalPages}
            >
              下一頁
            </Link>
          </nav>
        )}
      </div>

      <Footer />
    </div>
  );
}

