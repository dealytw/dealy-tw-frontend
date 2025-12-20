"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Eye } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Dummy data - will be replaced with real data later
const dummyCategories = [
  { id: 1, name: "Beauty 美妝", slug: "beauty" },
  { id: 2, name: "Fashion 時尚", slug: "fashion" },
  { id: 3, name: "Health and Fitness 健康瘦身", slug: "health" },
  { id: 4, name: "Lifestyle 生活", slug: "lifestyle" },
  { id: 5, name: "Girl's Talk 女生密語", slug: "girls-talk" },
  { id: 6, name: "Trendy 人氣熱話", slug: "trendy" },
];

const dummySliderPosts = [
  {
    id: 1,
    title: "2026美妝大勢!18款口碑爆棚胭脂大合集",
    subtitle: "韓系唇頰泥vs高訂皮革,顯白減齡必收!教你畫出氛圍感~",
    image: "/placeholder.svg",
    category: "Beauty 美妝",
    date: "13 hours ago",
    slug: "blush-collection-2026",
  },
  {
    id: 2,
    title: "25款顯小臉減齡法式劉海髮型推薦",
    subtitle: "短髮/中長髮/長捲髮專屬提案!修飾圓臉高顴骨~",
    image: "/placeholder.svg",
    category: "Hair and Body Care 美髮及身體",
    date: "7 hours ago",
    slug: "french-bangs-hairstyles",
  },
  {
    id: 3,
    title: "告別蒜頭鼻菱形鼻!爆紅「盒型鼻」修容畫法",
    subtitle: "4步重塑鼻頭輪廓,不動刀也能告別扁平臉打造混血感小顏",
    image: "/placeholder.svg",
    category: "Beauty 美妝",
    date: "5 hours ago",
    slug: "nose-contouring-method",
  },
];

const dummyLatestPost = {
  id: 4,
  title: "24歲GENZ從會計系到電繪戰場",
  subtitle: "Rokku小鎖 | Teto | 用畫筆衝撞世界",
  image: "/placeholder.svg",
  category: "GenzGlowingStar",
  date: "5 hours ago",
  slug: "genz-accounting-to-digital-art",
};

const dummyPosts = [
  {
    id: 5,
    title: "告別蒜頭鼻菱形鼻!爆紅「盒型鼻」修容畫法",
    subtitle: "4步重塑鼻頭輪廓,不動刀也能告別扁平臉打造混血感小顏",
    image: "/placeholder.svg",
    category: "Beauty 美妝 • Makeup 彩妝",
    date: "5 hours ago",
    slug: "nose-contouring-box",
  },
  {
    id: 6,
    title: "25款顯小臉減齡法式劉海髮型推薦",
    subtitle: "短髮/中長髮/長捲髮專屬提案!修飾圓臉高顴骨~",
    image: "/placeholder.svg",
    category: "Hair and Body Care 美髮及身體",
    date: "7 hours ago",
    slug: "french-bangs-25",
  },
  {
    id: 7,
    title: "2026美妝大勢! 18款口碑爆棚胭脂大合集",
    subtitle: "韓系唇頰泥vs高訂皮革,顯白減齡必收!教你畫出氛圍感~",
    image: "/placeholder.svg",
    category: "Beauty 美妝 • Makeup 彩妝",
    date: "7 hours ago",
    slug: "blush-trend-2026",
  },
];

const dummyHottestPosts = [
  {
    id: 8,
    title: "6款足部護理產品推薦告別死皮與疲勞",
    subtitle: "去角質、修護乾裂、舒緩痠痛,告別死皮...",
    image: "/placeholder.svg",
    date: "14 Dec",
    slug: "foot-care-products",
    rank: 1,
  },
  {
    id: 9,
    title: "15款「貓眼光療指甲」範本推薦2026",
    subtitle: "氣質百搭款 | 月光銀、寶寶藍、...",
    image: "/placeholder.svg",
    date: "17 Dec",
    slug: "cat-eye-gel-nails",
    rank: 2,
  },
  {
    id: 10,
    title: "手殘黨必收!韓系「整容級」鼻影修容技巧大公開",
    subtitle: "【鼻影畫法全攻略】亞洲人必學!",
    image: "/placeholder.svg",
    date: "12 Dec",
    slug: "nose-shadow-korean",
    rank: 3,
  },
];

export default function BlogHomeView() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % dummySliderPosts.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + dummySliderPosts.length) % dummySliderPosts.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Container with same width as blog posts (max-w-5xl) */}
      <div className="container mx-auto px-4 py-8 max-w-full lg:max-w-5xl">
        {/* Blog Menu / Categories */}
        <div className="mb-8 border-b border-gray-200 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-semibold text-gray-900 mr-1">最新文章</span>
            {dummyCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Image Slider with Title */}
        <div className="relative mb-8 h-[400px] lg:h-[500px] rounded-lg overflow-hidden group">
          {dummySliderPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                  <div className="text-white">
                    <div className="text-sm mb-2 opacity-90">{post.category}</div>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-2 line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm lg:text-base opacity-90 line-clamp-2">{post.subtitle}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {/* Slider Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {/* Pagination Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {dummySliderPosts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? "bg-white w-6" : "bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Column - Main Articles */}
          <div className="lg:col-span-3 space-y-8">
            {/* Latest Article - Large */}
            <Link href={`/blog/${dummyLatestPost.slug}`} className="block group">
              <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-64 lg:h-80">
                  <Image
                    src={dummyLatestPost.image}
                    alt={dummyLatestPost.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-2">{dummyLatestPost.category}</div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">
                    {dummyLatestPost.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">{dummyLatestPost.subtitle}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{dummyLatestPost.date}</span>
                  </div>
                </div>
              </article>
            </Link>

            {/* 3 Smaller Articles */}
            <div className="grid md:grid-cols-3 gap-6">
              {dummyPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                  <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="relative h-48">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-gray-500 mb-2 line-clamp-1">{post.category}</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.subtitle}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Another Large Article + 3 Small (1 Set) */}
            <div className="space-y-6">
              {/* Large Article */}
              <Link href={`/blog/${dummyLatestPost.slug}`} className="block group">
                <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="md:flex">
                    <div className="relative w-full md:w-1/2 h-64 md:h-auto">
                      <Image
                        src={dummyLatestPost.image}
                        alt={dummyLatestPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6 md:w-1/2 flex flex-col justify-center">
                      <div className="text-sm text-gray-500 mb-2">{dummyLatestPost.category}</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">
                        {dummyLatestPost.title}
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-3">{dummyLatestPost.subtitle}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{dummyLatestPost.date}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>

              {/* 3 Small Articles */}
              <div className="grid md:grid-cols-3 gap-6">
                {dummyPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                    <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full">
                      <div className="relative h-48">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-gray-500 mb-2 line-clamp-1">{post.category}</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.subtitle}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{post.date}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Hottest Articles */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Hottest Articles
                <span className="block text-sm font-normal text-gray-500 mt-1">最熱文章</span>
              </h2>
              <div className="space-y-6">
                {dummyHottestPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                    <article className="space-y-3">
                      <div className="relative h-40 rounded-lg overflow-hidden">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 bg-pink-600 text-white text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center">
                          {post.rank}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-pink-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{post.subtitle}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{post.date}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

