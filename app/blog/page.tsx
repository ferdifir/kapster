import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Tips & Inspirasi Barbershop",
  description:
    "Baca artikel seputar barbershop, gaya rambut, perawatan, dan tips bisnis untuk mengembangkan usahamu. Lengkap dengan rekomendasi dari Kapster.",
};

export default async function BlogPage() {
  const { posts, total, page, pageSize } = await getPublishedPosts(1);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-28 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Blog <span className="text-gold-gradient">Kapster</span>
            </h1>
            <p className="text-dark-300 max-w-2xl mx-auto">
              Tips, inspirasi, dan panduan seputar barbershop, gaya rambut, dan bisnis untuk mengembangkan usahamu.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-dark-400 text-lg">Belum ada artikel. Nantikan artikel menarik kami!</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group bg-dark-800/50 border border-dark-700/30 rounded-xl overflow-hidden hover:border-barber-400/30 transition-all duration-300"
                  >
                    {post.og_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.og_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="text-xs px-2 py-1 rounded-full bg-barber-400/10 text-barber-400"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                      <h2 className="font-display text-lg font-semibold text-white group-hover:text-barber-400 transition-colors mb-2 line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-dark-400 text-sm line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                      <time className="text-xs text-dark-500">
                        {new Date(post.published_at!).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={p === 1 ? "/blog" : `/blog/page/${p}`}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-barber-400 text-dark-900"
                          : "bg-dark-800 text-dark-300 hover:bg-dark-700"
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
