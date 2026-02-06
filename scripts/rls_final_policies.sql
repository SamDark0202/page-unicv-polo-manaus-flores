-- Remover TODAS as políticas existentes
drop policy if exists "posts_insert_anon_temp" on public.posts;
drop policy if exists "posts_update_anon_temp" on public.posts;
drop policy if exists "posts_select_public" on public.posts;
drop policy if exists "posts_insert_authenticated" on public.posts;
drop policy if exists "posts_update_authenticated" on public.posts;
drop policy if exists "posts_delete_authenticated" on public.posts;

drop policy if exists "storage_insert_blog_images_temp" on storage.objects;
drop policy if exists "storage_update_blog_images_temp" on storage.objects;
drop policy if exists "storage_select_blog_images_public" on storage.objects;
drop policy if exists "storage_insert_blog_images_authenticated" on storage.objects;
drop policy if exists "storage_update_blog_images_authenticated" on storage.objects;
drop policy if exists "storage_delete_blog_images_authenticated" on storage.objects;

-- Políticas definitivas para a tabela posts

-- Leitura pública (apenas posts publicados)
create policy "posts_select_public"
on public.posts
for select
using (status = 'published');

-- Escrita apenas para usuários autenticados (admin)
-- Você pode ajustar isso para roles específicos depois
create policy "posts_insert_authenticated"
on public.posts
for insert
to authenticated
with check (true);

create policy "posts_update_authenticated"
on public.posts
for update
to authenticated
using (true)
with check (true);

create policy "posts_delete_authenticated"
on public.posts
for delete
to authenticated
using (true);

-- Políticas definitivas para o Storage (blog-images)

-- Leitura pública de imagens
create policy "storage_select_blog_images_public"
on storage.objects
for select
using (bucket_id = 'blog-images');

-- Upload apenas para autenticados
create policy "storage_insert_blog_images_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'blog-images');

create policy "storage_update_blog_images_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'blog-images')
with check (bucket_id = 'blog-images');

create policy "storage_delete_blog_images_authenticated"
on storage.objects
for delete
to authenticated
using (bucket_id = 'blog-images');
