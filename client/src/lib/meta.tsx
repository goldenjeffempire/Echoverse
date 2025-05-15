import React from "react";
import { Helmet } from "react-helmet";

interface MetaProps {
  title: string;
  description: string;
  ogImage?: string;
  ogUrl?: string;
}

export const Meta: React.FC<MetaProps> = ({ 
  title, 
  description, 
  ogImage = "/og-image.jpg", 
  ogUrl 
}) => {
  const siteUrl = "https://echowebsitebuilder.com";
  const fullUrl = ogUrl ? `${siteUrl}${ogUrl}` : siteUrl;
  
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Add canonical link to prevent duplicate content issues */}
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
};
