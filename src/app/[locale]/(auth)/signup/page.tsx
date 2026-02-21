
import { SignupForm } from '@/components/auth/signup-form';
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
          title: `Regístrate en ${orgData.name}`,
          description: `Únete al equipo de ${orgData.name} en la plataforma MercaFlow.`,
          openGraph: {
            title: `Invitación de ${orgData.name}`,
            description: `Crea tu cuenta para gestionar pedidos y catálogo en ${orgData.name}.`,
            images: [{ url: logo, width: 400, height: 400 }],
          },
        };
      }
    } catch (e) {
      console.error("Error generating metadata:", e);
    }
  }

  return {
    title: "MercaFlow - Registro",
    description: "Crea tu cuenta en el ecosistema MercaFlow.",
  };
}

export default function SignupPage() {
  return <SignupForm />;
}
