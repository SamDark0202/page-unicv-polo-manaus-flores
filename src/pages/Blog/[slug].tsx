import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Post } from '@/types/post';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fetchPostBySlug } from '@/lib/supabaseClient';

const PostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    async function loadPost() {
      try {
        setLoading(true);
        const data = await fetchPostBySlug(slug);
        setPost(data || undefined);
      } catch (err) {
        console.error("Erro ao carregar post:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-3xl px-4 py-8 text-center">
          <div className="text-gray-600">Carregando...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-3xl px-4 py-8 text-center">
          <div className="text-gray-600">Post não encontrado</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Container centralizado */}
      <div className="container mx-auto max-w-3xl px-4 py-8 text-center">
        {/* Título */}
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

        {/* Data */}
        <p className="text-gray-600 text-sm mb-10 ">{post.date}</p>

        {/* Imagem */}
        <div className="flex justify-center mb-8">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="max-w-full h-auto rounded-lg shadow"
          />
        </div>

        {/* Conteúdo */}
        <div
          className="text-gray-800 leading-relaxed text-justify"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      <Footer />
    </div>
  );
};

export default PostPage;