"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Gift,
  Share2,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  ArrowRight,
  CheckCircle2,
  Shield,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { Spotlight } from "@/components/ui/spotlight-new";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";

export default function WishlistLanding() {
  const mockWishlist = [
    {
      id: 1,
      club: "Arsenal",
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/jerseys/premier-league/arsenal/2020-21/home.jpg",
      season: "2020/21",
      type: "Domicile",
    },
    {
      id: 2,
      club: "AC Milan",
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/jerseys/serie-a/ac-milan/2023-24/away.jpg",
      season: "2023/24",
      type: "Extérieur",
    },
    {
      id: 3,
      club: "Inter Miami",
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/jerseys/mls/inter-miami/2024/home.jpg",
      season: "2024",
      type: "Domicile",
    },
    {
      id: 4,
      club: "As Roma",
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/jerseys/serie-a/roma/2023-24/third.jpg",
      season: "2023/24",
      type: "Third",
    },
  ];

  const faqs = [
    {
      q: "Comment créer ma wishlist ?",
      a: "C'est simple ! Parcourez notre catalogue, cliquez sur le cœur pour ajouter un maillot à votre wishlist. Ensuite, cliquez sur 'Partager' pour générer votre lien personnalisé.",
    },
    {
      q: "Puis-je créer plusieurs wishlists ?",
      a: "Pour le moment, vous avez une wishlist unique que vous pouvez modifier à tout moment. Vous pouvez choisir les maillots à partager à chaque fois.",
    },
    {
      q: "Comment mes proches voient ma wishlist ?",
      a: "Vous générez un lien unique que vous partagez par message, email ou réseaux sociaux. Ils peuvent consulter votre liste sur mobile ou PC, sans créer de compte.",
    },
    {
      q: "La wishlist est-elle gratuite ?",
      a: "Oui ! Créer, gérer et partager votre wishlist est 100% gratuit, sans limite.",
    },
    {
      q: "Que se passe-t-il quand je reçois un maillot ?",
      a: "Une fois que vous ajoutez le maillot à votre collection, il disparaît automatiquement de votre wishlist. Fini les doublons !",
    },
    {
      q: "Puis-je personnaliser ma wishlist ?",
      a: "Oui ! Vous pouvez choisir un thème (Noël, Anniversaire...), ajouter un titre et un message personnel pour vos proches.",
    },
  ];

  const features = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Créez votre liste",
      description:
        "Ajoutez tous les maillots qui vous font rêver en un clic depuis notre catalogue",
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "Partagez facilement",
      description:
        "Générez un lien, une image ou un PDF à partager avec vos proches pour Noël, anniversaires...",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Personnalisez le thème",
      description:
        "Choisissez parmi plusieurs thèmes (Noël, Anniversaire, Standard) et ajoutez un message personnel",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Gérez vos occasions",
      description:
        "Créez plusieurs wishlists pour différentes occasions : Noël, anniversaire, objectifs perso...",
    },
    {
      icon: <Gift className="w-6 h-6" />,
      title: "Évitez les doublons",
      description:
        "Une fois ajouté à votre collection, le maillot disparaît de votre wishlist automatiquement",
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "100% gratuit",
      description:
        "Créez et partagez autant de wishlists que vous voulez sans aucun frais",
    },
  ];

  const shareFormats = [
    {
      title: "Lien à partager",
      description: "Page web consultable sur mobile et PC",
      header: (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center">
          <LinkIcon className="w-12 h-12 text-white" />
        </div>
      ),
      icon: <LinkIcon className="w-4 h-4 text-blue-500" />,
    },
    {
      title: "Image",
      description: "Pour stories Instagram ou WhatsApp",
      header: (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 items-center justify-center">
          <ImageIcon className="w-12 h-12 text-white" />
        </div>
      ),
      icon: <ImageIcon className="w-4 h-4 text-green-500" />,
    },
    {
      title: "PDF",
      description: "Document propre à imprimer",
      header: (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-500 to-red-700 items-center justify-center">
          <FileText className="w-12 h-12 text-white" />
        </div>
      ),
      icon: <FileText className="w-4 h-4 text-orange-500" />,
    },
  ];

  const useCases = [
    {
      title: "Noël approche",
      description:
        "Créez votre liste de Noël et partagez-la avec votre famille. Fini les cadeaux dont vous ne voulez pas !",
      icon: "🎄",
    },
    {
      title: "Anniversaire",
      description:
        "Partagez vos envies de maillots pour votre anniversaire. Vos amis sauront quoi vous offrir.",
      icon: "🎂",
    },
    {
      title: "Objectifs collection",
      description:
        "Listez les maillots que vous cherchez pour compléter votre collection. Gardez vos objectifs en vue.",
      icon: "🎯",
    },
    {
      title: "Saint-Valentin",
      description:
        "Partagez vos envies de maillots en couple : duos de clubs, éditions spéciales et idées cadeaux pour célébrer votre passion ensemble.",
      icon: "💘",
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background to-muted/20 overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0">
        <Spotlight />
      </div>

      <section className="relative px-4 sm:px-6 py-20 md:py-28 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-6 mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            <Heart className="w-4 h-4" />
            Liste d&apos;envies
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
            Créez votre wishlist de
            <br />
            <span className="text-primary">maillots de foot</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Listez vos envies et partagez‑les facilement avec vos proches, avec
            des animations fluides et un design premium.
          </p>

          <nav
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            aria-label="Actions d'authentification"
          >
            <Button
              size="lg"
              asChild
              className="w-full sm:min-w-[240px] sm:w-auto px-6 sm:px-8 py-6 bg-primary text-primary-foreground hover:bg-primary hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 font-semibold transition-all duration-300"
            >
              <Link
                href="/auth/login"
                className="gap-2 justify-center"
                aria-label="Se connecter à votre compte Le Vestiaire"
              >
                Se connecter
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:min-w-[240px] sm:w-auto px-6 sm:px-8 py-6 border-2 border-primary/40 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300"
            >
              <Link
                href="/auth/signUp"
                className="justify-center"
                aria-label="Créer un compte pour commencer votre collection de maillots"
              >
                Créer un compte
              </Link>
            </Button>
          </nav>
        </motion.div>
      </section>

      <section className="px-4 sm:px-6 py-16 bg-gradient-to-b from-background via-primary/5 to-primary/10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-red-50 via-green-50 to-red-50 dark:from-red-950/20 dark:via-green-950/20 dark:to-red-950/20 rounded-2xl p-4 sm:p-8 border-2 border-red-200/50 dark:border-red-800/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-medium mb-4">
                <Gift className="w-4 h-4 text-red-600" />
                Exemple de wishlist
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Ma liste de Noël 🎄
              </h2>
              <p className="text-muted-foreground">
                Quelques idées de maillots qui me feraient plaisir 😊
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-sm">
                <Heart className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  {mockWishlist.length} maillots
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {mockWishlist.map((jersey) => (
                <div
                  key={jersey.id}
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105"
                >
                  <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 relative">
                    <Image
                      src={jersey.image}
                      alt={jersey.club}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-contain"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm truncate">
                      {jersey.club}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {jersey.type} {jersey.season}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Créé avec Le Vestiaire Foot ⚽
              </p>
              <Button asChild>
                <Link href="/auth/signUp" className="gap-2">
                  Créer ma wishlist
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-b from-primary/10 via-purple-500/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">
                Partagez comme vous voulez
              </h2>
              <p className="text-muted-foreground text-lg">
                3 formats pour s&apos;adapter à tous vos besoins
              </p>
            </motion.div>
          </div>
          <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
            {shareFormats.map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                header={item.header}
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 bg-gradient-to-b from-background via-purple-500/5 to-primary/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tout est prévu</h2>
            <p className="text-muted-foreground text-lg">
              Des fonctionnalités pensées pour vous faciliter la vie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-b from-background via-purple-500/10 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-purple-500/10 to-transparent opacity-50"></div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Pour toutes les occasions</h2>
          <p className="text-muted-foreground text-lg">
            Une wishlist pour chaque moment important
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all"
            >
              <div className="text-4xl mb-4">{useCase.icon}</div>
              <h3 className="font-semibold text-xl mb-2">{useCase.title}</h3>
              <p className="text-muted-foreground">{useCase.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Ils ont partagé leur wishlist
            </h2>
            <p className="text-muted-foreground text-lg">
              Des milliers d&apos;utilisateurs satisfaits
            </p>
          </div>
          <AnimatedTestimonials
            testimonials={[
              {
                name: "Lucas B.",
                designation: "⭐️⭐️⭐️⭐️⭐️",
                quote:
                  "J'ai partagé ma wishlist de Noël avec ma famille, super pratique ! Plus de surprise ratée 😄",
                src: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/persona/persona1.avif",
              },
              {
                name: "Sarah L.",
                designation: "⭐️⭐️⭐️⭐️⭐️",
                quote:
                  "Le partage via le lien est parfait pour envoyer à mes parents qui ne sont pas très tech. Génial !",
                src: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/persona/persona3.jpg",
              },
              {
                name: "Tom M.",
                designation: "⭐️⭐️⭐️⭐️⭐️",
                quote:
                  "J'ai reçu exactement le maillot que je voulais grâce à ma wishlist partagée. Merci !",
                src: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/persona/persona2.jpg",
              },
            ]}
          />
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-b from-background via-purple-500/10 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-purple-500/10 to-transparent opacity-50"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-purple-600 to-primary/60 animate-gradient-x" />
            <div className="relative bg-slate-900/90 backdrop-blur-xl m-[2px] rounded-3xl p-6 sm:p-12 text-center border border-primary/20">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 text-white">
                Prêt à créer votre wishlist ?
              </h2>
              <p className="text-base sm:text-lg mb-8 text-neutral-300 max-w-2xl mx-auto px-4">
                Listez vos envies et partagez-les en quelques clics avec vos
                proches
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-6 sm:px-8 py-6 bg-white text-black hover:bg-white hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 font-semibold text-base sm:text-lg transition-all duration-300"
                  asChild
                >
                  <Link href="/auth/signUp">Créer mon compte gratuitement</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-6 sm:px-8 py-6 border-2 border-white/40 text-white hover:bg-white hover:text-black hover:border-white hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 text-base sm:text-lg bg-transparent transition-all duration-300"
                  asChild
                >
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-neutral-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>100% sécurisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sans engagement</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Questions fréquentes
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left [&[data-state=open]>svg]:text-primary hover:[&>svg]:text-primary cursor-pointer">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
