import MiniCssExtractPlugin from 'mini-css-extract-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,
    
    // Configure API proxy to avoid CORS issues during development
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007/api/:path*',
        },
      ];
    },
    
    // Optimize build output
    swcMinify: true,
    
    // Configure image domains if you're using next/image
    images: {
      domains: [
        // Add domains you need to load images from
        'example.com',
      ],
    },
  };
  
  export default nextConfig;