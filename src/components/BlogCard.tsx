import React from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '@/types/post';

interface BlogCardProps {
  post: Post;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
      <div className="relative">
        <img 
          src={post.imageUrl} 
          alt={post.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {post.category && (
          <div className="absolute top-2 right-2">
            <span 
              className="bg-primary/80 text-white text-xs px-3 py-1 rounded-full"
            >
              {post.category}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="text-xl font-semibold mb-2 line-clamp-2 dark:text-gray-100">
          {post.title}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {new Date(post.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}
        </p>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        
        <Link 
          to={`/Blog/${post.slug}`}
          className="mt-auto inline-flex items-center text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Ler mais
          <svg 
            className="w-4 h-4 ml-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M14 5l7 7m0 0l-7 7m7-7H3" 
            />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default BlogCard;