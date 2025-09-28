import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { posts, Post } from '../../../src/data/posts';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | undefined>(undefined);

  useEffect(() => {
    const foundPost = posts.find((post) => post.slug === slug);
    setPost(foundPost);
  }, [slug]);

  if (!post) {
    return <div>Post não encontrado</div>;
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