import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from '../components/BlogCard';
import { Post } from '../data/posts';
import { posts } from '../data/posts';
import React from 'react';
import { Helmet } from 'react-helmet';

const Blog = () => {
  return (
    <>
      <Helmet>
        <title>Blog UniCV Polo Flores - Educação e Desenvolvimento</title>
        <meta name="description" content="Blog com dicas, novidades e informações sobre educação à distância, desenvolvimento profissional e vida acadêmica." />
        <meta name="keywords" content="educação à distância, ead, unicv, graduação, pós-graduação, estudos, desenvolvimento profissional" />
        <meta property="og:title" content="Blog UniCV Polo Flores" />
        <meta property="og:description" content="Conteúdo educacional e dicas para sua jornada acadêmica" />
        <meta property="og:type" content="blog" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <section className="mb-12">
            <h1 className="text-4xl font-bold mb-6 text-center">Blog UniCV</h1>
            <p className="text-xl text-gray-600 text-center mb-8">
              Conteúdo exclusivo para sua jornada acadêmica
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.slug} className="h-full">
                <BlogCard post={post} />
              </article>
            ))}
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Blog;