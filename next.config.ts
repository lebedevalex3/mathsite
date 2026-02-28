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
        source: "/:locale(ru|en|de)/5-klass/proporcii",
        destination: "/:locale/topics/proporcii",
        permanent: true,
      },
      {
        source: "/:locale(ru|en|de)/5-klass/proporcii/:path*",
        destination: "/:locale/topics/proporcii/:path*",
        permanent: true,
      },
    ];
  },
};

export default withMDX(nextConfig);
