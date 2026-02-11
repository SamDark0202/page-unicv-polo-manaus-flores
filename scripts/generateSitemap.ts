/**
 * Script para gerar sitemap.xml automaticamente
 * Inclui: páginas principais, cursos e posts do blog
 * 
 * Execute: npm run sitemap
 * 
 * Certifique-se de ter arquivo .env.local com:
 * VITE_SUPABASE_URL=sua_url
 * VITE_SUPABASE_ANON_KEY=sua_chave
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { seedCourses } from "./courseSeedData";

// Tentar carregar .env.local se existir
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const envLines = envContent.split("\n");
  
  envLines.forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️  Aviso: Variáveis de ambiente não encontradas.");
  console.warn("⚠️  Gerando sitemap SEM posts do blog (apenas páginas estáticas e cursos).\n");
  console.warn("Para incluir posts do blog, crie arquivo .env.local com:");
  console.warn("VITE_SUPABASE_URL=sua_url");
  console.warn("VITE_SUPABASE_ANON_KEY=sua_chave\n");
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Função para converter nome do curso em slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Função para gerar XML do sitemap
async function generateSitemap() {
  console.log("🚀 Iniciando geração do sitemap...\n");

  const today = new Date().toISOString().split("T")[0];
  const baseUrl = "https://www.unicvpoloam.com.br";

  // Buscar posts publicados do blog
  console.log("📰 Buscando posts do blog...");
  let posts: Array<{ slug: string; updated_at: string }> | null = null;
  
  if (supabase) {
    const { data, error } = await supabase
      .from("posts")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("❌ Erro ao buscar posts:", error.message);
    } else {
      posts = data;
      console.log(`✅ ${posts?.length || 0} posts encontrados\n`);
    }
  } else {
    console.log("⚠️  Supabase não configurado - pulando posts do blog\n");
  }

  // Agrupar cursos por modalidade
  const bacharelado = seedCourses.filter(c => c.modality === "bacharelado");
  const licenciatura = seedCourses.filter(c => c.modality === "licenciatura");
  const tecnologo = seedCourses.filter(c => c.modality === "tecnologo");

  console.log(`📚 Cursos registrados:`);
  console.log(`   - Bacharelado: ${bacharelado.length}`);
  console.log(`   - Licenciatura: ${licenciatura.length}`);
  console.log(`   - Tecnólogo: ${tecnologo.length}`);
  console.log(`   - Total: ${seedCourses.length}\n`);

  // Iniciar XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- ==================== PÁGINAS PRINCIPAIS ==================== -->
  
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>${baseUrl}/bacharelado</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/licenciatura</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/tecnologo</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/pos-graduacao</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${baseUrl}/form-parceria-mt</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

`;

  // Adicionar cursos de BACHARELADO
  xml += `  <!-- ==================== BACHARELADO (${bacharelado.length} CURSOS) ==================== -->\n\n`;
  
  for (const curso of bacharelado) {
    const slug = slugify(curso.name);
    const priority = ["administracao", "ciencias-contabeis", "educacao-fisica", "psicanalise", "engenharia-dados", "engenharia-software", "engenharia-seguranca-cibernetica"].includes(slug) ? "0.85" : "0.8";
    
    xml += `  <url>
    <loc>${baseUrl}/bacharelado#${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>

`;
  }

  // Adicionar cursos de LICENCIATURA
  xml += `  <!-- ==================== LICENCIATURA (${licenciatura.length} CURSOS) ==================== -->\n\n`;
  
  for (const curso of licenciatura) {
    const slug = slugify(curso.name);
    const priority = slug === "pedagogia" ? "0.9" : ["educacao-fisica", "matematica", "historia", "psicopedagogia", "educacao-especial"].includes(slug) ? "0.85" : "0.8";
    
    xml += `  <url>
    <loc>${baseUrl}/licenciatura#${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>

`;
  }

  // Adicionar cursos TECNÓLOGOS
  xml += `  <!-- ==================== TECNÓLOGO (${tecnologo.length} CURSOS) ==================== -->\n\n`;
  
  for (const curso of tecnologo) {
    const slug = slugify(curso.name);
    const priority = ["marketing-digital", "inteligencia-artificial"].includes(slug) ? "0.9" : 
                     ["processos-gerenciais", "analise-e-desenvolvimento-de-sistemas", "gestao-recursos-humanos", "logistica", "gestao-financeira", "gestao-tecnologia-da-informacao", "seguranca-da-informacao", "seguranca-no-trabalho", "marketing", "gestao-comercial", "jogos-digitais", "sistemas-para-internet", "transformacao-digital"].includes(slug) ? "0.85" : "0.8";
    
    xml += `  <url>
    <loc>${baseUrl}/tecnologo#${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>

`;
  }

  // Adicionar POSTS DO BLOG
  if (posts && posts.length > 0) {
    xml += `  <!-- ==================== POSTS DO BLOG (${posts.length} POSTS) ==================== -->\n\n`;
    
    for (const post of posts) {
      const lastmod = post.updated_at ? post.updated_at.split("T")[0] : today;
      
      xml += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

`;
    }
  }

  // Fechar XML
  xml += `</urlset>`;

  // Salvar arquivo
  const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(sitemapPath, xml, "utf-8");

  console.log("✅ Sitemap gerado com sucesso!");
  console.log(`📍 Localização: ${sitemapPath}`);
  console.log(`\n📊 Estatísticas:`);
  console.log(`   - Páginas principais: 7`);
  console.log(`   - Cursos de Bacharelado: ${bacharelado.length}`);
  console.log(`   - Cursos de Licenciatura: ${licenciatura.length}`);
  console.log(`   - Cursos Tecnólogos: ${tecnologo.length}`);
  console.log(`   - Posts do Blog: ${posts?.length || 0}`);
  console.log(`   - TOTAL DE URLs: ${7 + seedCourses.length + (posts?.length || 0)}`);
  console.log(`\n🌐 Acesse: ${baseUrl}/sitemap.xml`);
}

// Executar
generateSitemap().catch((error) => {
  console.error("❌ Erro ao gerar sitemap:", error);
  process.exit(1);
});
