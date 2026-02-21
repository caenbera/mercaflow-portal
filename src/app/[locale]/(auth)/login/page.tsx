
import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ org?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams;
  const orgSlug = sParams.org;

  if (orgSlug) {
    try {
      const q = query(collection(db, 'organizations'), where('slug', '==', orgSlug), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const orgData = snap.docs[0].data();
        const logo = orgData.storeConfig?.logoUrl || "https://i.postimg.cc/sxBVGnMp/icon.png";
        return {
          title: `Entrar a ${orgData.name}`,
          description: `Panel de control y operaciones para el personal de ${orgData.name}.`,
          openGraph: {
            title: `Acceso: ${orgData.name}`,
            description: `Bienvenido al portal operativo de ${orgData.name}. Inicia sesión para continuar.`,
            images: [{ url: logo, width: 400, height: 400 }],
          },
        };
      }
    } catch (e) {
      console.error("Error generating login metadata:", e);
    }
  }

  return {
    title: "MercaFlow - Iniciar Sesión",
    description: "Accede a tu panel administrativo en MercaFlow.",
  };
}

export default function LoginPage() {
  return <LoginForm />;
}
