"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Blog {
  id: number;
  title: string;
  page_slug: string;
  createdAt: string;
  updatedAt: string;
  sections: any[];
  related_merchants: Array<{
    id: number;
    name: string;
    slug: string;
    logo: string | null;
  }>;
  related_blogs: Array<{
    id: number;
    title: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    thumbnail: string | null;
  }>;
}

interface BlogViewProps {
  blog: Blog;
}

export default function BlogView({ blog }: BlogViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date(blog.updatedAt).toLocaleDateString('zh-TW')}
        </p>
        
        {/* Basic content - design will be added later */}
        <div className="prose max-w-none">
          <p>Blog content will be rendered here. Design to be implemented.</p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

