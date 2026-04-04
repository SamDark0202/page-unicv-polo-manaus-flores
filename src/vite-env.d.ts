/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_ANON_KEY: string;
	readonly VITE_SUPABASE_IMAGE_TRANSFORMS?: string;
	readonly VITE_IMAGEKIT_URL_ENDPOINT?: string;
	readonly VITE_IMAGEKIT_TRANSFORMS?: string;
	readonly VITE_IMAGE_UPLOAD_PROVIDER?: "imagekit" | "supabase";
	readonly VITE_IMAGEKIT_ROOT_FOLDER?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
