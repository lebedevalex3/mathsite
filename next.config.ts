import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  async redirects() {
    return [
      {
        source: "/:locale(ru|en|de)/5-klass/uravneniya",
        destination: "/:locale/topics/equations",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/5-klass/uravneniya/:path*",
        destination: "/:locale/topics/equations/:path*",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/5-klass/equations",
        destination: "/:locale/topics/equations",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/5-klass/equations/:path*",
        destination: "/:locale/topics/equations/:path*",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/6-klass/otricatelnye-chisla",
        destination: "/:locale/topics/negative-numbers",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/6-klass/otricatelnye-chisla/:path*",
        destination: "/:locale/topics/negative-numbers/:path*",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/6-klass/negative-numbers",
        destination: "/:locale/topics/negative-numbers",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/6-klass/negative-numbers/:path*",
        destination: "/:locale/topics/negative-numbers/:path*",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/5-klass/proportion",
        destination: "/:locale/topics/proportion",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/5-klass/proportion/:path*",
        destination: "/:locale/topics/proportion/:path*",
        permanent: true,
      },
    ];
  },
};

export default withMDX(nextConfig);
