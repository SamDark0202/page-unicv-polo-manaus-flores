import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from '../components/BlogCard';
import { posts } from '../data/posts';
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [noResults, setNoResults] = useState(false);

  const sortedPosts = useMemo(() => {
    let filtered = [...posts];
    setNoResults(false);

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date
    if (filterDate) {
      filtered = filtered.filter(post => post.date.startsWith(filterDate));
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filtered.length === 0) {
      setNoResults(true);
    }

    return filtered;
  }, [posts, searchTerm, filterDate]);

  // Get unique years for date filter
  const years = useMemo(() => {
    const allYears = posts.map(post => post.date.split('-')[0]);
    return [...new Set(allYears)]; // Remove duplicates
  }, [posts]);

  // Get unique months for date filter
  const months = useMemo(() => {
    const allMonths = posts.map(post => post.date.substring(0, 7)); // YYYY-MM
    return [...new Set(allMonths)]; // Remove duplicates
  }, [posts]);

  // Get unique days for date filter
  const days = useMemo(() => {
    const allDays = posts.map(post => post.date); // YYYY-MM-DD
    return [...new Set(allDays)]; // Remove duplicates
  }, [posts]);

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

      <div className="min-h-screen bg-background" >
        <Header />
        <main className="container mx-auto py-8 px-4">
          <section className="mb-12">
            <h1 className="text-4xl font-bold mb-6 text-center">Blog UniCV</h1>
            <p className="text-xl text-gray-600 text-center mb-8">
              Conteúdo exclusivo para sua jornada acadêmica
            </p>
          </section>

          {/* Search and Filter */}
          <section className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Pesquisar por assunto..."
              className="w-full md:w-1/2 px-4 py-2 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="w-full md:w-auto px-4 py-2 border rounded"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="">Filtrar por data</option>
              <option value="">Filtrar por ano</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
              <option value="">Filtrar por mês</option>
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
              <option value="">Filtrar por dia</option>
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {noResults ? (
              <p className="text-center text-gray-500">Artigo não encontrado</p>
            ) : (
              sortedPosts.map((post) => (
                <article key={post.slug} className="h-full">
                  <BlogCard post={post} />
                </article>
              ))
            )}
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Blog;