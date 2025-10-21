"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Facebook, Twitter, MessageCircle } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  slug: string;
  seo_title?: string;
  seo_description?: string;
  cover?: string | null;
  author: {
    name: string;
    email: string;
    avatar: string;
  };
  categories: Array<{
    name: string;
    slug: string;
  }>;
}

interface ArticleViewProps {
  post: BlogPost;
}

export default function ArticleView({ post }: ArticleViewProps) {
  const [tableOfContents, setTableOfContents] = useState<{id: string, title: string}[]>([]);

  // Generate table of contents from content (basic implementation)
  useEffect(() => {
    if (post.content) {
      // Simple regex to find headings in markdown/HTML content
      const headingRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
      const headings: {id: string, title: string}[] = [];
      let match;
      
      while ((match = headingRegex.exec(post.content)) !== null) {
        const title = match[1].replace(/<[^>]*>/g, ''); // Remove HTML tags
        const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        headings.push({ id, title });
      }
      
      setTableOfContents(headings);
    }
  }, [post.content]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post.title;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      default:
        navigator.clipboard.writeText(url);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header will be added here */}
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Article Header */}
        <header className="mb-8">
          {/* Categories */}
          {post.categories.length > 0 && (
            <div className="mb-4">
              {post.categories.map((category) => (
                <Badge key={category.slug} variant="secondary" className="mr-2">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(post.publishedAt)}
                </p>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('facebook')}
                className="flex items-center space-x-2"
              >
                <Facebook className="h-4 w-4" />
                <span>Facebook</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('twitter')}
                className="flex items-center space-x-2"
              >
                <Twitter className="h-4 w-4" />
                <span>Twitter</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('copy')}
                className="flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>複製連結</span>
              </Button>
            </div>
          </div>

          <Separator />
        </header>

        {/* Featured Image */}
        {post.cover && (
          <div className="mb-8">
            <img
              src={post.cover}
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-lg max-w-none">
          <div 
            dangerouslySetInnerHTML={{ __html: post.content }}
            className="text-foreground leading-relaxed"
          />
        </article>

        {/* Table of Contents (if available) */}
        {tableOfContents.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">目錄</h3>
              <ul className="space-y-2">
                {tableOfContents.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              最後更新：{formatDate(post.updatedAt)}
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                留言
              </Button>
            </div>
          </div>
        </footer>
      </main>
      
      <Footer />
    </div>
  );
}
