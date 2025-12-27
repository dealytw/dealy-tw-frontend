"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
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
  createdAt?: string;
  publishedAt?: string;
}

interface Category {
  id: number | string;
  name: string;
  slug: string;
}

interface BlogHomeViewProps {
  blogPosts: BlogPost[];
  categories: Category[];
}

export default function BlogHomeView({ blogPosts = [], categories = [] }: BlogHomeViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return '剛剛';
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };

  // Get slider posts (first 3 newest posts)
  const sliderPosts = useMemo(() => {
    return blogPosts.slice(0, 3);
  }, [blogPosts]);

  // Get remaining posts (newest first, already sorted from API)
  const remainingPosts = useMemo(() => {
    return blogPosts.slice(3);
  }, [blogPosts]);

  // Get hottest posts (top 3 by some metric - using first 3 for now)
  const hottestPosts = useMemo(() => {
    return blogPosts.slice(0, 3).map((post, index) => ({
      ...post,
      rank: index + 1,
    }));
  }, [blogPosts]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderPosts.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderPosts.length) % sliderPosts.length);
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
            {categories.map((cat) => (
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
        {sliderPosts.length > 0 && (
          <div className="relative mb-8 h-[400px] lg:h-[500px] rounded-lg overflow-hidden group">
            {sliderPosts.map((post, index) => (
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
                      <div className="text-sm mb-2 opacity-90">{post.category || '最新優惠'}</div>
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
            {sliderPosts.length > 1 && (
              <>
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
                  {sliderPosts.map((_, index) => (
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
              </>
            )}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Column - Main Articles */}
          <div className="lg:col-span-3 space-y-8">
            {/* Display all remaining posts (newest first, top to down) */}
            {remainingPosts.length > 0 ? (
              <div className="space-y-6">
                {remainingPosts.map((post, index) => {
                  // First post: large layout
                  if (index === 0) {
                    return (
                      <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                        <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <div className="md:flex">
                            <div className="relative w-full md:w-1/2 h-64 md:h-auto">
                              <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="p-6 md:w-1/2 flex flex-col justify-center">
                              <div className="text-sm text-gray-500 mb-2">{post.category || '最新優惠'}</div>
                              <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">
                                {post.title}
                              </h2>
                              <p className="text-gray-600 mb-4 line-clamp-3">{post.subtitle}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(post.publishedAt || post.createdAt || post.date)}</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  }
                  // After first post, show in groups of 3
                  const groupIndex = Math.floor((index - 1) / 3);
                  const positionInGroup = (index - 1) % 3;
                  
                  // Only render the first item of each group (which will render all 3)
                  if (positionInGroup === 0) {
                    const gridPosts = remainingPosts.slice(index, index + 3);
                    return (
                      <div key={`grid-${index}`} className="grid md:grid-cols-3 gap-6">
                        {gridPosts.map((gridPost) => (
                          <Link key={gridPost.id} href={`/blog/${gridPost.slug}`} className="block group">
                            <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full">
                              <div className="relative h-48">
                                <Image
                                  src={gridPost.image}
                                  alt={gridPost.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="p-4">
                                <div className="text-xs text-gray-500 mb-2 line-clamp-1">{gridPost.category || '最新優惠'}</div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                                  {gridPost.title}
                                </h3>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{gridPost.subtitle}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDate(gridPost.publishedAt || gridPost.createdAt || gridPost.date)}</span>
                                </div>
                              </div>
                            </article>
                          </Link>
                        ))}
                      </div>
                    );
                  }
                  return null; // Skip posts that are already rendered in grid
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>目前沒有文章</p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Hottest Articles */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Hottest Articles
                <span className="block text-sm font-normal text-gray-500 mt-1">最熱文章</span>
              </h2>
              <div className="space-y-6">
                {hottestPosts.length > 0 ? (
                  hottestPosts.map((post) => (
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
                            <span>{formatDate(post.publishedAt || post.createdAt || post.date)}</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <p>目前沒有熱門文章</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

