"use client";

import React from "react";
import Image from "next/image";
import {
  Package,
  TrendingUp,
  BarChart3,
  Camera,
  ShieldCheck,
  Users,
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
import { motion } from "motion/react";
import Link from "next/link";
import { AnimatedTestimonials } from "../ui/animated-testimonials";

export default function CollectionLanding() {
  const mockCollection = [
    {
      id: 1,
      club: "PSG",
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/jerseys/ligue-1/psg/2025-26/home.jpg",
      season: "2025/26",
      type: "Domicile",
    },
    {
      id: 2,
      club: "Real Madrid",
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/jerseys/la-liga/real-madrid/2022-23/home.jpg",
      season: "2022/23",
      type: "Domicile",
    },
    {
      id: 3,
      club: "Manchester United",
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/jerseys/premier-league/manchester-united/2022-23/home.jpg",
      season: "2022/23",
      type: "Domicile",
    },
    {
      id: 4,
      club: "Barcelone",
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/jerseys/la-liga/barcelone/2022-23/third.jpg",
      season: "2022/23",
      type: "Third",
    },
    {
      id: 5,
      club: "OL",
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/jerseys/ligue-1/lyon/2023-24/domicile.webp",
      season: "2023/24",
      type: "Domicile",
    },
    {
      id: 6,
      club: "Liverpool",
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/jerseys/premier-league/liverpool/2024-25/home.jpg",
      season: "2024/25",
      type: "Domicile",
    },
  ];

  const faqs = [
    {
      id: "add-jersey",
      q: "Comment ajouter un maillot à ma collection ?",
      a: "Parcourez notre catalogue de milliers de maillots, cliquez sur un maillot puis sur 'Ajouter à ma collection'. Vous pourrez renseigner la taille, l'état, le prix d'achat et bien plus.",
    },
    {
      id: "custom-photos",
      q: "Puis-je ajouter mes propres photos ?",
      a: "Oui ! En plus des photos officielles, vous pouvez uploader vos propres photos pour chaque maillot de votre collection.",
    },
    {
      id: "privacy",
      q: "Ma collection est-elle privée ?",
      a: "Oui, par défaut votre collection est privée. Vous pouvez choisir de la partager avec vos amis ou de rester anonyme dans les classements.",
    },
    {
      id: "pricing",
      q: "L'application est-elle gratuite ?",
      a: "Oui, Le Vestiaire est 100% gratuit pour gérer votre collection, wishlist et profiter de toutes les fonctionnalités.",
    },
  ];

  const stats = {
    total: 24,
    value: 1670,
    leagues: {
      "Ligue 1": 12,
      "Premier League": 8,
      "La Liga": 4,
    },
    conditions: { Neuf: 12, Excellent: 8, Bon: 4 },
  };

  const features = [
    {
      id: "catalog",
      icon: <Package className="w-6 h-6" />,
      title: "Cataloguez tout",
      description:
        "Taille, état, prix d'achat, date, personnalisation... Gérez chaque détail de vos maillots",
    },
    {
      id: "photos",
      icon: <Camera className="w-6 h-6" />,
      title: "Ajoutez vos photos",
      description:
        "Immortalisez votre collection avec vos propres photos en complément des visuels officiels",
    },
    {
      id: "stats",
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Statistiques détaillées",
      description:
        "Valeur totale, répartition par ligue, conditions, types... Analysez votre collection",
    },
    {
      id: "evolution",
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Suivez votre évolution",
      description:
        "Observez la croissance de votre collection au fil du temps avec des graphiques",
    },
    {
      id: "security",
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Sécurisé & Privé",
      description:
        "Vos données sont protégées. Vous choisissez ce que vous partagez avec la communauté",
    },
    {
      id: "friends",
      icon: <Users className="w-6 h-6" />,
      title: "Comparez avec vos amis",
      description:
        "Ajoutez des amis, découvrez leurs collections et échangez sur votre passion",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <section className="relative px-6 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/logo-app/back-collection.png"
            alt="Collection de maillots"
            fill
            className="object-cover opacity-60"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5" />
        </div>

        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6 mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4 backdrop-blur-sm border border-primary/20"
            >
              <Package className="w-4 h-4" />
              Gestion de Collection
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold leading-tight"
            >
              Gérez votre collection de
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                maillots de foot
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Cataloguez, organisez et suivez l&apos;évolution de votre
              collection. Rejoignez{" "}
              <span className="font-semibold text-foreground">
                plus de 100 collectionneurs
              </span>{" "}
              passionnés.
            </motion.p>

            <motion.nav
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
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
            </motion.nav>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-16 bg-gradient-to-b from-background via-purple-500/5 to-primary/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Une collection, mille possibilités
            </h2>
            <p className="text-muted-foreground text-lg">
              Exemple de collection avec 24 maillots
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/10 to-primary/5 rounded-2xl blur-xl -z-10"></div>
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-muted-foreground">Total</h3>
              </div>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Maillots possédés
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-medium text-muted-foreground">Valeur</h3>
              </div>
              <p className="text-3xl font-bold">{stats.value}€</p>
              <p className="text-sm text-muted-foreground mt-1">
                Valeur totale
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-medium text-muted-foreground">Ligues</h3>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm ">
                  <span>Ligue 1</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Premier League</span>
                  <span>8</span>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-medium text-muted-foreground">États</h3>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Excellent</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Neuf</span>
                  <span>7</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {mockCollection.map((jersey) => (
              <div
                key={jersey.id}
                className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all hover:scale-105 cursor-pointer group"
              >
                <div className="aspect-square bg-muted relative overflow-hidden p-3">
                  <Image
                    src={jersey.image}
                    alt={jersey.club}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-contain group-hover:scale-105 transition-transform"
                    priority={false}
                  />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">
                    {jersey.club}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {jersey.type} • {jersey.season}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">
              + 18 autres maillots dans cette collection
            </p>
            <Button
              size="lg"
              asChild
              className="px-6 sm:px-8 py-6 bg-primary text-primary-foreground hover:bg-primary hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 font-semibold transition-all duration-300"
            >
              <Link href="/auth/signUp" className="gap-2 justify-center">
                Créer ma collection
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 bg-gradient-to-b from-background via-purple-500/5 to-primary/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground text-lg">
              Des fonctionnalités pensées pour les collectionneurs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.id}
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

      <section className="px-4 sm:px-6 py-16 bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Ils ont partagé leur collection
            </h2>
            <p className="text-muted-foreground text-lg">
              Des milliers d&apos;utilisateurs satisfaits
            </p>
          </div>
          <AnimatedTestimonials
            testimonials={[
              {
                name: "Thomas M.",
                designation: "⭐️⭐️⭐️⭐️⭐️",
                quote:
                  "Enfin une app pour gérer ma collection ! Les stats par ligue sont top 🔥",
                src: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/persona/persona4.jpg",
              },
              {
                name: "Julie D.",
                designation: "⭐️⭐️⭐️⭐️⭐️",
                quote:
                  "Je peux enfin tracker la valeur de ma collection. Interface ultra intuitive !",
                src: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/persona/persona5.jpeg",
              },
              {
                name: "Alexandre R.",
                designation: "⭐️⭐️⭐️⭐️⭐️",
                quote:
                  "L'upload de photos perso est génial. Ma collection n'a jamais été aussi bien organisée.",
                src: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/persona/persona6.jpeg",
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
                Prêt à gérer votre collection ?
              </h2>
              <p className="text-base sm:text-lg mb-8 text-neutral-300 max-w-2xl mx-auto px-4">
                Cataloguez vos maillots et suivez l&apos;évolution de votre
                collection en quelques clics
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Questions fréquentes
            </h2>
            <p className="text-muted-foreground text-lg">
              Tout ce que vous devez savoir sur Le Vestiaire
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
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
