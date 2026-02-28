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
        destination: "/:locale/5-klass/equations",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/5-klass/uravneniya/:path*",
        destination: "/:locale/5-klass/equations/:path*",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/6-klass/otricatelnye-chisla",
        destination: "/:locale/6-klass/negative-numbers",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/6-klass/otricatelnye-chisla/:path*",
        destination: "/:locale/6-klass/negative-numbers/:path*",
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
