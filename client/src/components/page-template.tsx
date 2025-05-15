import { Meta } from "@/lib/meta";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface PageTemplateProps {
  title: string;
  description: string;
  breadcrumbs?: Array<{ label: string; href: string }>;
  children: React.ReactNode;
}

export function PageTemplate({ 
  title, 
  description, 
  breadcrumbs,
  children 
}: PageTemplateProps) {
  return (
    <>
      <Meta
        title={`${title} - Echoverse`}
        description={description}
      />
      <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Breadcrumbs if provided */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center text-sm text-gray-400 mb-8 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center">
                  <ChevronRight className="h-4 w-4 mx-2" />
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-white">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-white transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Page Header */}
          <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {description}
            </p>
          </header>

          {/* Page Content */}
          <div className="mt-12">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
