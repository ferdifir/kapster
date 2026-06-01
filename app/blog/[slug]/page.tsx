import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedPostBySlug, getRelatedPosts, getAllPublishedSlugs } from "@/lib/blog";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

const siteUrl = "https://kapster.my.id";

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.meta_description || post.excerpt,
    alternates: { canonical: `${siteUrl}/blog/${post.slug}` },
    keywords: post.keywords,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.meta_description || post.excerpt,
      url: `${siteUrl}/blog/${post.slug}`,
      images: post.og_image_url ? [{ url: post.og_image_url, width: 1200, height: 630 }] : undefined,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      tags: post.keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description || post.excerpt,
      images: post.og_image_url ? [post.og_image_url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post);

  const wordsPerMinute = 200;
  const textContent = post.content_html.replace(/<[^>]*>/g, "");
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

  const headingMatches = post.content_html.match(/<h2[^>]*>(.*?)<\/h2>/g) ?? [];
  const tocItems = headingMatches.map((h) => ({
    text: h.replace(/<[^>]*>/g, ""),
    id: h.replace(/<[^>]*>/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  }));

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.og_image_url,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: "Kapster", url: siteUrl },
    publisher: { "@type": "Organization", name: "Kapster", url: siteUrl },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/blog/${post.slug}` },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 2, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-28 pb-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([articleSchema, breadcrumbSchema]),
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 text-sm text-dark-400">
            <Link href="/" className="hover:text-barber-400 transition-colors">Beranda</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-barber-400 transition-colors">Blog</Link>
            <span className="mx-2">/</span>
            <span className="text-dark-300">{post.title}</span>
          </nav>

          <article>
            {post.og_image_url && (
              <img
                src={post.og_image_url}
                alt={post.title}
                className="w-full aspect-video object-cover rounded-xl mb-8"
              />
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {post.topics.map((topic) => (
                <span
                  key={topic}
                  className="text-xs px-2 py-1 rounded-full bg-barber-400/10 text-barber-400"
                >
                  {topic}
                </span>
              ))}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dark-400 mb-8">
              <time dateTime={post.published_at!}>
                {new Date(post.published_at!).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.updated_at && post.updated_at !== post.published_at && (
                <span>
                  Diperbarui{" "}
                  <time dateTime={post.updated_at}>
                    {new Date(post.updated_at).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </span>
              )}
              <span>{readingTime} menit baca</span>
            </div>

            {tocItems.length > 3 && (
              <nav className="mb-10 p-5 rounded-xl bg-dark-800/50 border border-dark-700/30">
                <strong className="block text-white font-semibold mb-3">Daftar Isi</strong>
                <ul className="space-y-1.5">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-dark-400 hover:text-barber-400 transition-colors text-sm"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div
              className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:text-white prose-a:text-barber-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-barber-300 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{
                __html: post.content_html.replace(
                  /<h([23])\s*>(.*?)<\/h\1>/g,
                  (_, level, text) =>
                    `<h${level} id="${text
                      .replace(/<[^>]*>/g, "")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")}">${text}</h${level}>`
                ),
              }}
            />
          </article>

          {relatedPosts.length > 0 && (
            <section className="mt-16 pt-12 border-t border-dark-700/30">
              <h2 className="font-display text-2xl font-bold text-white mb-8">
                Artikel Terkait
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/blog/${rp.slug}`}
                    className="group bg-dark-800/50 border border-dark-700/30 rounded-xl p-5 hover:border-barber-400/30 transition-all duration-300"
                  >
                    <h3 className="font-display text-base font-semibold text-white group-hover:text-barber-400 transition-colors line-clamp-2 mb-2">
                      {rp.title}
                    </h3>
                    <p className="text-dark-400 text-sm line-clamp-2">{rp.excerpt}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-12 p-8 rounded-xl bg-gradient-to-r from-barber-400/10 to-barber-600/10 border border-barber-400/20 text-center">
            <h2 className="font-display text-2xl font-bold text-white mb-3">
              Kelola Barbershop Lebih Mudah dengan Kapster
            </h2>
            <p className="text-dark-300 mb-6 max-w-lg mx-auto">
              Atur antrian, terima booking online, dan kirim notifikasi WhatsApp otomatis. Hanya Rp10.000/bulan!
            </p>
            <a
              href={siteUrl}
              className="inline-block px-8 py-3 rounded-lg gold-gradient text-dark-900 font-semibold hover:shadow-lg hover:shadow-barber-400/25 transition-all duration-300"
            >
              Coba Kapster Gratis
            </a>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
