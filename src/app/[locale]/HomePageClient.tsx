'use client'

import { useEffect, useState, Suspense, lazy } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Eye,
  ExternalLink,
  Gamepad2,
  Hammer,
  Home,
  MessageCircle,
  Package,
  Settings,
  Sparkles,
  Star,
} from 'lucide-react'
import { useMessages } from 'next-intl'
import { VideoFeature } from '@/components/home/VideoFeature'
import { LatestGuidesAccordion } from '@/components/home/LatestGuidesAccordion'
import { NativeBannerAd, AdBanner } from '@/components/ads'
import { SidebarAd } from '@/components/ads/SidebarAd'
import { scrollToSection } from '@/lib/scrollToSection'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import type { ContentItemWithType } from '@/lib/getLatestArticles'
import type { ModuleLinkMap } from '@/lib/buildModuleLinkMap'

// Lazy load heavy components
const HeroStats = lazy(() => import('@/components/home/HeroStats'))
const FAQSection = lazy(() => import('@/components/home/FAQSection'))
const CTASection = lazy(() => import('@/components/home/CTASection'))

// Loading placeholder
const LoadingPlaceholder = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`} />
)

// Conditionally render text as a link or plain span
function LinkedTitle({
  linkData,
  children,
  className,
  locale,
}: {
  linkData: { url: string; title: string } | null | undefined
  children: React.ReactNode
  className?: string
  locale: string
}) {
  if (linkData && /^https?:\/\//.test(linkData.url)) {
    const href = linkData.url
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className || ''} hover:text-[hsl(var(--nav-theme-light))] hover:underline decoration-[hsl(var(--nav-theme-light))/0.4] underline-offset-4 transition-colors`}
        title={linkData.title}
      >
        {children}
      </a>
    )
  }

  void locale
  return <>{children}</>
}

interface HomePageClientProps {
  latestArticles: ContentItemWithType[]
  moduleLinkMap: ModuleLinkMap
  locale: string
}

export default function HomePageClient({ latestArticles, moduleLinkMap, locale }: HomePageClientProps) {
  const t = useMessages() as any
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.slimeseaswiki.wiki'

  // Structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: "Slime Seas Wiki",
        description: "Complete Slime Seas Wiki covering codes, races, weapons, bosses, islands, and progression routes for the Roblox anime RPG.",
        image: {
          '@type': 'ImageObject',
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Slime Seas Wiki Hero Image",
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: "Slime Seas Wiki",
        alternateName: "Slime Seas",
        url: siteUrl,
        description: "Community resource hub for Slime Seas codes, races, weapon stances, bosses, islands, and progression guides.",
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          '@type': 'ImageObject',
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Slime Seas Wiki Hero Image",
        },
        sameAs: [
          'https://www.roblox.com/games/99046552174353/Slime-Seas-Anime-RPG',
          'https://www.roblox.com/communities/33326928/Slime-Slaying-Online',
          'https://discord.gg/t2Huv8M5re',
          'https://x.com/SlayASlimeRBX',
          'https://www.youtube.com/@SlayASlimeRBLX',
        ],
      },
      {
        '@type': 'VideoGame',
        name: "Slime Seas",
        gamePlatform: ['Roblox'],
        applicationCategory: 'Game',
        genre: ['Anime RPG', 'Open World', 'Adventure', 'PvP'],
        numberOfPlayers: {
          minValue: 1,
          maxValue: 50,
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: '0',
          availability: 'https://schema.org/InStock',
          url: 'https://www.roblox.com/games/99046552174353/Slime-Seas-Anime-RPG',
        },
      },
    ],
  }

  // Module accordion state
  const [deckExpanded, setDeckExpanded] = useState<number | null>(null)

  // Locale-safe fallbacks for modules 9-12
  const module9Bosses =
    t.modules?.lucidBlocksFarmingAndGrowth?.bosses ||
    t.modules?.lucidBlocksFarmingAndGrowth?.sections ||
    []
  const module9FarmPriorities =
    t.modules?.lucidBlocksFarmingAndGrowth?.farmPriorities ||
    t.modules?.lucidBlocksFarmingAndGrowth?.growthMilestones ||
    []
  const module10Steps = (
    t.modules?.lucidBlocksBestEarlyUnlocks?.steps ||
    t.modules?.lucidBlocksBestEarlyUnlocks?.priorities ||
    []
  ).map((item: any, index: number) => ({
    step: item.step || String(index + 1).padStart(2, '0'),
    heading: item.heading || item.name || `Slime Seas Step ${index + 1}`,
    body: item.body || item.description || '',
  }))
  const module10ProgressNotes =
    t.modules?.lucidBlocksBestEarlyUnlocks?.progressNotes || []
  const module11Routes =
    t.modules?.lucidBlocksAchievementTracker?.routes ||
    (t.modules?.lucidBlocksAchievementTracker?.groups || []).map((group: any) => ({
      stop: group.name || 'Slime Seas Merchant Stop',
      whatConfirmed: group.achievements?.[0]?.description || '',
      howToUse: group.achievements?.[1]?.description || '',
      whyItMatters: group.achievements?.[2]?.description || '',
    }))
  const module11RouteChecklist =
    t.modules?.lucidBlocksAchievementTracker?.routeChecklist ||
    (t.modules?.lucidBlocksAchievementTracker?.groups || []).map((group: any) => group.name)
  const module12Skills =
    t.modules?.lucidBlocksSingleplayerAndPlatformFAQ?.skills ||
    (t.modules?.lucidBlocksSingleplayerAndPlatformFAQ?.faqs || []).map((faq: any) => ({
      skill: faq.question || 'Slime Seas Skill',
      group: 'Slime Seas Mastery',
      unlock: 'Core Usage',
      useCase: 'Combat and route consistency',
      summary: faq.answer || '',
    }))
  const module12TrainingNotes =
    t.modules?.lucidBlocksSingleplayerAndPlatformFAQ?.trainingNotes || []

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal-visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 左侧广告容器 - Fixed 定位 */}
      <aside
        className="hidden xl:block fixed top-20 w-40 z-10"
        style={{ left: 'calc((100vw - 896px) / 2 - 180px)' }}
      >
        <SidebarAd type="sidebar-160x300" adKey={process.env.NEXT_PUBLIC_AD_SIDEBAR_160X300} />
      </aside>

      {/* 右侧广告容器 - Fixed 定位 */}
      <aside
        className="hidden xl:block fixed top-20 w-40 z-10"
        style={{ right: 'calc((100vw - 896px) / 2 - 180px)' }}
      >
        <SidebarAd type="sidebar-160x600" adKey={process.env.NEXT_PUBLIC_AD_SIDEBAR_160X600} />
      </aside>

      {/* 广告位 1: 移动端横幅 Sticky */}
      {/* <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div> */}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 scroll-reveal">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-[hsl(var(--nav-theme)/0.1)]
                            border border-[hsl(var(--nav-theme)/0.3)] mb-6">
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-sm font-medium">{t.hero.badge}</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {t.hero.title}
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a
                href="https://discord.gg/t2Huv8M5re"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4
                           bg-[hsl(var(--nav-theme))] hover:bg-[hsl(var(--nav-theme)/0.9)]
                           text-white rounded-lg font-semibold text-lg transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                {t.hero.getFreeCodesCTA}
              </a>
              <a
                href="https://www.roblox.com/games/99046552174353/Slime-Seas-Anime-RPG"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4
                           border border-border hover:bg-white/10 rounded-lg
                           font-semibold text-lg transition-colors"
              >
                {t.hero.playOnSteamCTA}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* 广告位 2: 原生横幅 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ''} />

      {/* Video Section */}
      <section className="px-4 py-12">
        <div className="scroll-reveal container mx-auto max-w-4xl">
          <div className="relative rounded-2xl overflow-hidden">
            <VideoFeature
              videoId="fdDyxWKpX-s"
              title="Slime Seas Official Gameplay Short"
              posterImage="/images/hero.webp"
            />
          </div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <LatestGuidesAccordion articles={latestArticles} locale={locale} max={30} />

      {/* 广告位 3: 标准横幅 728×90 */}
      <AdBanner type="banner-728x90" adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90} />

      {/* Tools Grid - 16 Navigation Cards */}
      <section className="px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t.tools.title}{' '}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <a
              href="#slime-seas-codes"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-codes')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '0ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[0].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[0].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[0].description}</p>
            </a>

            <a
              href="#slime-seas-trello-and-discord"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-trello-and-discord')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '50ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[1].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[1].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[1].description}</p>
            </a>

            <a
              href="#slime-seas-wiki"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-wiki')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '100ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[2].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[2].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[2].description}</p>
            </a>

            <a
              href="#slime-seas-beginner-guide"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-beginner-guide')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '150ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[3].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[3].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[3].description}</p>
            </a>

            <a
              href="#slime-seas-race-tier-list"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-race-tier-list')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '200ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[4].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[4].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[4].description}</p>
            </a>

            <a
              href="#slime-seas-best-weapons"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-best-weapons')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '250ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[5].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[5].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[5].description}</p>
            </a>

            <a
              href="#slime-seas-weapon-mastery-guide"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-weapon-mastery-guide')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '300ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[6].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[6].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[6].description}</p>
            </a>

            <a
              href="#slime-seas-world-progression-guide"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-world-progression-guide')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '350ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[7].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[7].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[7].description}</p>
            </a>

            <a
              href="#slime-seas-bosses-and-drops"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-bosses-and-drops')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '400ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[8].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[8].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[8].description}</p>
            </a>

            <a
              href="#slime-seas-pets-guide"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-pets-guide')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '450ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[9].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[9].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[9].description}</p>
            </a>

            <a
              href="#slime-seas-merchant-locations"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-merchant-locations')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '500ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[10].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[10].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[10].description}</p>
            </a>

            <a
              href="#slime-seas-skills-guide"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-skills-guide')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '550ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[11].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[11].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[11].description}</p>
            </a>

            <a
              href="#slime-seas-pvp-guide"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-pvp-guide')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '600ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[12].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[12].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[12].description}</p>
            </a>

            <a
              href="#slime-seas-items-and-materials"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-items-and-materials')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '650ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[13].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[13].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[13].description}</p>
            </a>

            <a
              href="#slime-seas-damage-calculator"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-damage-calculator')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '700ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[14].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[14].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[14].description}</p>
            </a>

            <a
              href="#slime-seas-reroll-probability"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('slime-seas-reroll-probability')
              }}
              className="scroll-reveal group block p-6 rounded-xl border border-border bg-card hover:border-[hsl(var(--nav-theme)/0.5)] transition-all duration-300 cursor-pointer text-left hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
              style={{ animationDelay: '750ms' }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 bg-[hsl(var(--nav-theme)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                <DynamicIcon name={t.tools.cards[15].icon} className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              </div>
              <h3 className="font-semibold mb-2">{t.tools.cards[15].title}</h3>
              <p className="text-sm text-muted-foreground">{t.tools.cards[15].description}</p>
            </a>
          </div>
        </div>
      </section>

      {/* 广告位 4: 方形广告 300×250 */}
      <AdBanner type="banner-300x250" adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250} />

      {/* Module 1: Beginner Guide */}
      <section id="slime-seas-codes" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <LinkedTitle linkData={moduleLinkMap['lucidBlocksBeginnerGuide']} locale={locale}>
                {t.modules.lucidBlocksBeginnerGuide.title}
              </LinkedTitle>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t.modules.lucidBlocksBeginnerGuide.intro}
            </p>
          </div>

          {/* Steps */}
          <div className="scroll-reveal space-y-4 mb-10">
            {t.modules.lucidBlocksBeginnerGuide.steps.map((step: any, index: number) => (
              <div key={index} className="flex gap-4 p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--nav-theme)/0.2)] border-2 border-[hsl(var(--nav-theme)/0.5)] flex items-center justify-center">
                  <span className="text-xl font-bold text-[hsl(var(--nav-theme-light))]">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksBeginnerGuide::steps::${index}`]} locale={locale}>
                      {step.title}
                    </LinkedTitle>
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tips */}
          <div className="scroll-reveal p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-lg">Quick Tips</h3>
            </div>
            <ul className="space-y-2">
              {t.modules.lucidBlocksBeginnerGuide.quickTips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 广告位 5: 中型横幅 468×60 */}
      <AdBanner type="banner-468x60" adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60} />

      {/* Module 2: Apotheosis Crafting */}
      <section id="slime-seas-trello-and-discord" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksApotheosisCrafting']} locale={locale}>{t.modules.lucidBlocksApotheosisCrafting.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksApotheosisCrafting.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {t.modules.lucidBlocksApotheosisCrafting.cards.map((card: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <h3 className="font-bold text-lg mb-2 text-[hsl(var(--nav-theme-light))]">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksApotheosisCrafting::cards::${index}`]} locale={locale}>
                    {card.name}
                  </LinkedTitle>
                </h3>
                <p className="text-muted-foreground text-sm">{card.description}</p>
              </div>
            ))}
          </div>
          <div className="scroll-reveal flex flex-wrap gap-3 justify-center">
            {t.modules.lucidBlocksApotheosisCrafting.milestones.map((m: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm">
                <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />{m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Module 3: Tools and Weapons */}
      <section id="slime-seas-wiki" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksToolsAndWeapons']} locale={locale}>{t.modules.lucidBlocksToolsAndWeapons.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksToolsAndWeapons.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.modules.lucidBlocksToolsAndWeapons.items.map((item: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Hammer className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{item.type}</span>
                </div>
                <h3 className="font-bold mb-2">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksToolsAndWeapons::items::${index}`]} locale={locale}>
                    {item.name}
                  </LinkedTitle>
                </h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 4: Storage and Inventory */}
      <section id="slime-seas-beginner-guide" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksStorageAndInventory']} locale={locale}>{t.modules.lucidBlocksStorageAndInventory.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksStorageAndInventory.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {t.modules.lucidBlocksStorageAndInventory.solutions.map((s: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-bold">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksStorageAndInventory::solutions::${index}`]} locale={locale}>
                      {s.name}
                    </LinkedTitle>
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{s.role}</span>
                </div>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="scroll-reveal p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold">Management Tips</h3>
            </div>
            <ul className="space-y-2">
              {t.modules.lucidBlocksStorageAndInventory.managementTips.map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Module 5: Qualia and Base Building */}
      <section id="slime-seas-race-tier-list" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksQualiaAndBaseBuilding']} locale={locale}>{t.modules.lucidBlocksQualiaAndBaseBuilding.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksQualiaAndBaseBuilding.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {t.modules.lucidBlocksQualiaAndBaseBuilding.cards.map((card: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme-light)/0.4)] text-[hsl(var(--nav-theme-light))] font-semibold">{card.tier || 'Core'} Tier</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{card.rarity || 'Race'}</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-[hsl(var(--nav-theme-light))]">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksQualiaAndBaseBuilding::cards::${index}`]} locale={locale}>
                    {card.name}
                  </LinkedTitle>
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Effects</p>
                    <ul className="mt-2 space-y-1">
                      {(card.effects || []).map((effect: string, effectIndex: number) => (
                        <li key={effectIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                          <span>{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Best For</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(card.bestFor || []).map((fit: string, fitIndex: number) => (
                        <span key={fitIndex} className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{fit}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Highlights</p>
                    <ul className="mt-2 space-y-1">
                      {(card.highlights || []).map((highlight: string, highlightIndex: number) => (
                        <li key={highlightIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Drawbacks</p>
                    <ul className="mt-2 space-y-1">
                      {(card.drawbacks || []).map((drawback: string, drawbackIndex: number) => (
                        <li key={drawbackIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                          <span>{drawback}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.3)]">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reroll Advice</p>
                  <p className="text-sm">{card.rerollAdvice || card.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="scroll-reveal grid grid-cols-2 md:grid-cols-4 gap-4">
            {t.modules.lucidBlocksQualiaAndBaseBuilding.highlights.map((h: string, i: number) => (
              <div key={i} className="p-4 bg-white/5 border border-border rounded-xl text-center hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <Home className="w-6 h-6 text-[hsl(var(--nav-theme-light))] mx-auto mb-2" />
                <p className="text-sm">{h}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 6: World Regions */}
      <section id="slime-seas-best-weapons" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksWorldRegions']} locale={locale}>{t.modules.lucidBlocksWorldRegions.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksWorldRegions.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.modules.lucidBlocksWorldRegions.regions.map((weapon: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme-light)/0.4)] text-[hsl(var(--nav-theme-light))] font-semibold">{weapon.tier || 'Core'} Tier</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{weapon.rarity || weapon.type || 'Weapon'}</span>
                </div>
                <h3 className="font-bold text-lg mb-3">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksWorldRegions::regions::${index}`]} locale={locale}>
                    {weapon.name}
                  </LinkedTitle>
                </h3>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{weapon.baseDamage ? `${weapon.baseDamage} DMG` : 'Progression Pick'}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{weapon.attackSpeed || weapon.type || 'Balanced Speed'}</span>
                </div>
                <p className="text-sm mb-3">
                  <span className="text-muted-foreground">Best For: </span>
                  <span>{weapon.bestFor || weapon.description}</span>
                </p>
                <p className="text-muted-foreground text-sm mb-3">
                  <span className="text-foreground">Access: </span>
                  {weapon.access || 'Accessible through world progression drops and crafting routes.'}
                </p>
                <div className="p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.3)]">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Why Pick</p>
                  <p className="text-sm">{weapon.whyPick || weapon.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 7: Creatures and Enemies */}
      <section id="slime-seas-weapon-mastery-guide" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksCreaturesAndEnemies']} locale={locale}>{t.modules.lucidBlocksCreaturesAndEnemies.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksCreaturesAndEnemies.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.modules.lucidBlocksCreaturesAndEnemies.creatures.map((mastery: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-bold">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksCreaturesAndEnemies::creatures::${index}`]} locale={locale}>
                      {mastery.mastery || mastery.name}
                    </LinkedTitle>
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{mastery.access || 'Core Path'}</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{mastery.role || mastery.description}</p>

                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Skill Path</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(mastery.skillPath || []).map((step: any, stepIndex: number) => (
                      <span key={stepIndex} className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
                        M{step.mastery}: {step.skill}
                      </span>
                    ))}
                    {!mastery.skillPath && mastery.description ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
                        Core mastery progression available in this route.
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommended Weapons</p>
                  <ul className="mt-2 space-y-1">
                    {(mastery.recommendedWeapons || []).map((weapon: string, weaponIndex: number) => (
                      <li key={weaponIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                        <span>{weapon}</span>
                      </li>
                    ))}
                    {!mastery.recommendedWeapons && mastery.description ? (
                      <li className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                        <span>Follow your current progression weapon line before swapping styles.</span>
                      </li>
                    ) : null}
                  </ul>
                </div>

                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Best Races</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(mastery.bestRaces || []).map((race: string, raceIndex: number) => (
                      <span key={raceIndex} className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{race}</span>
                    ))}
                    {!mastery.bestRaces ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">Race synergy varies by your preferred mastery style.</span>
                    ) : null}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.3)]">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Why Pick</p>
                  <p className="text-sm">{mastery.whyPick || mastery.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 8: Mobility Gear */}
      <section id="slime-seas-world-progression-guide" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksMobilityGear']} locale={locale}>{t.modules.lucidBlocksMobilityGear.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksMobilityGear.intro}</p>
          </div>
          <div className="scroll-reveal space-y-4 mb-8">
            {t.modules.lucidBlocksMobilityGear.items.map((item: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme-light)/0.4)] text-[hsl(var(--nav-theme-light))] font-semibold">Step {item.step || index + 1}</span>
                  <ArrowRight className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{item.unlock || item.type || 'Route checkpoint'}</span>
                </div>
                <h3 className="font-bold mb-2">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksMobilityGear::items::${index}`]} locale={locale}>
                    {item.stage || item.name}
                  </LinkedTitle>
                </h3>
                <p className="text-sm mb-2">
                  <span className="text-muted-foreground">Target: </span>
                  <span>{item.target || item.description}</span>
                </p>
                <p className="text-sm mb-4">
                  <span className="text-muted-foreground">Boss or Gate: </span>
                  <span>{item.bossOrGate || 'Progression gate by world and questline'}</span>
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Focus</p>
                    <ul className="mt-2 space-y-1">
                      {(item.focus || []).map((focusItem: string, focusIndex: number) => (
                        <li key={focusIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                          <span>{focusItem}</span>
                        </li>
                      ))}
                      {!item.focus && item.description ? (
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                          <span>{item.description}</span>
                        </li>
                      ) : null}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Key Targets</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(item.keyTargets || []).map((target: string, targetIndex: number) => (
                        <span key={targetIndex} className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{target}</span>
                      ))}
                      {!item.keyTargets && item.type ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{item.type}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.3)]">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Leave This Stage When</p>
                  <p className="text-sm">{item.leaveWhen || 'Core route objectives are stable and your next world transition is ready.'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="scroll-reveal flex flex-wrap gap-3 justify-center">
            {t.modules.lucidBlocksMobilityGear.unlockMilestones.map((m: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm">
                <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />{m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 广告位 6: 移动端横幅 320×50 */}
      <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />

      {/* Module 9: Bosses and Drops */}
      <section id="slime-seas-bosses-and-drops" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.lucidBlocksFarmingAndGrowth.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksFarmingAndGrowth.intro}</p>
          </div>

          {/* Desktop table */}
          <div className="scroll-reveal hidden md:block overflow-x-auto mb-8 rounded-xl border border-border bg-white/5">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[hsl(var(--nav-theme)/0.12)]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[hsl(var(--nav-theme-light))]">Slime Seas Boss</th>
                  <th className="px-4 py-3 font-semibold text-[hsl(var(--nav-theme-light))]">Zone</th>
                  <th className="px-4 py-3 font-semibold text-[hsl(var(--nav-theme-light))]">Location</th>
                  <th className="px-4 py-3 font-semibold text-[hsl(var(--nav-theme-light))]">Level</th>
                  <th className="px-4 py-3 font-semibold text-[hsl(var(--nav-theme-light))]">HP</th>
                  <th className="px-4 py-3 font-semibold text-[hsl(var(--nav-theme-light))]">Best For</th>
                  <th className="px-4 py-3 font-semibold text-[hsl(var(--nav-theme-light))]">Top Drops</th>
                </tr>
              </thead>
              <tbody>
                {module9Bosses.map((boss: any, index: number) => (
                  <tr key={index} className="border-t border-border align-top">
                    <td className="px-4 py-4 font-semibold">{boss.boss || boss.name || '-'}</td>
                    <td className="px-4 py-4 text-muted-foreground">{boss.zone || '-'}</td>
                    <td className="px-4 py-4 text-muted-foreground">{boss.location || '-'}</td>
                    <td className="px-4 py-4 text-muted-foreground">{boss.levelRequirement || boss.level_requirement || '-'}</td>
                    <td className="px-4 py-4 text-muted-foreground">{boss.hp || '-'}</td>
                    <td className="px-4 py-4">{boss.bestFor || '-'}</td>
                    <td className="px-4 py-4 text-muted-foreground">{boss.topDrops || boss.top_drops || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="scroll-reveal grid grid-cols-1 gap-4 md:hidden mb-8">
            {module9Bosses.map((boss: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-bold text-lg text-[hsl(var(--nav-theme-light))]">{boss.boss || boss.name || '-'}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.35)]">
                    {boss.zone || 'Zone'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2"><span className="text-foreground">Location: </span>{boss.location || '-'}</p>
                <p className="text-sm text-muted-foreground mb-2"><span className="text-foreground">Level: </span>{boss.levelRequirement || boss.level_requirement || '-'}</p>
                <p className="text-sm text-muted-foreground mb-2"><span className="text-foreground">HP: </span>{boss.hp || '-'}</p>
                <p className="text-sm text-muted-foreground mb-2"><span className="text-foreground">Best For: </span>{boss.bestFor || '-'}</p>
                <p className="text-xs text-muted-foreground mb-2"><span className="text-foreground">Top Drops: </span>{boss.topDrops || boss.top_drops || '-'}</p>
                <p className="text-xs text-muted-foreground">{boss.fightNote || boss.fight_note || ''}</p>
              </div>
            ))}
          </div>

          <div className="scroll-reveal flex flex-wrap gap-3 justify-center">
            {module9FarmPriorities.map((m: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm">
                <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />{m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Module 10: Pets Guide */}
      <section id="slime-seas-pets-guide" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.lucidBlocksBestEarlyUnlocks.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksBestEarlyUnlocks.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {module10Steps.map((step: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme)/0.35)] text-sm font-bold text-[hsl(var(--nav-theme-light))]">
                    {step.step}
                  </span>
                  <Star className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                </div>
                <h3 className="font-bold mb-2">{step.heading}</h3>
                <p className="text-muted-foreground text-sm">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="scroll-reveal flex flex-wrap gap-3 justify-center">
            {module10ProgressNotes.map((note: string, index: number) => (
              <span key={index} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm">
                <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                {note}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Module 11: Merchant Locations */}
      <section id="slime-seas-merchant-locations" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.lucidBlocksAchievementTracker.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksAchievementTracker.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {module11Routes.map((route: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardCheck className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                  <h3 className="font-bold">{route.stop || route.name || 'Slime Seas Route Stop'}</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 border border-border rounded-lg">
                    <p className="font-semibold text-sm text-[hsl(var(--nav-theme-light))]">What Is Confirmed</p>
                    <p className="text-xs text-muted-foreground mt-1">{route.whatConfirmed || route.what_is_confirmed || '-'}</p>
                  </div>
                  <div className="p-3 bg-white/5 border border-border rounded-lg">
                    <p className="font-semibold text-sm text-[hsl(var(--nav-theme-light))]">How to Use It</p>
                    <p className="text-xs text-muted-foreground mt-1">{route.howToUse || route.how_to_use_it || '-'}</p>
                  </div>
                  <div className="p-3 bg-white/5 border border-border rounded-lg">
                    <p className="font-semibold text-sm text-[hsl(var(--nav-theme-light))]">Why It Matters</p>
                    <p className="text-xs text-muted-foreground mt-1">{route.whyItMatters || route.why_it_matters || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="scroll-reveal flex flex-wrap gap-3 justify-center">
            {module11RouteChecklist.map((item: string, index: number) => (
              <span key={index} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm">
                <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Module 12: Skills Guide */}
      <section id="slime-seas-skills-guide" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.lucidBlocksSingleplayerAndPlatformFAQ.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksSingleplayerAndPlatformFAQ.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {module12Skills.map((skill: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme-light)/0.4)] text-[hsl(var(--nav-theme-light))]">{skill.group || 'Slime Seas Mastery'}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{skill.unlock || 'Core Unlock'}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{skill.skill || skill.question || 'Slime Seas Skill'}</h3>
                <p className="text-sm mb-2"><span className="text-muted-foreground">Use Case: </span>{skill.useCase || skill.use_case || '-'}</p>
                <p className="text-muted-foreground text-sm">{skill.summary || skill.answer || '-'}</p>
              </div>
            ))}
          </div>

          <div className="scroll-reveal flex flex-wrap gap-3 justify-center">
            {module12TrainingNotes.map((note: string, index: number) => (
              <span key={index} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm">
                <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                {note}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Module 13: Steam Deck and Controller */}
      <section id="slime-seas-pvp-guide" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Gamepad2 className="w-8 h-8 text-[hsl(var(--nav-theme-light))]" />
              <h2 className="text-4xl md:text-5xl font-bold"><LinkedTitle linkData={moduleLinkMap['lucidBlocksSteamDeckAndController']} locale={locale}>{t.modules.lucidBlocksSteamDeckAndController.title}</LinkedTitle></h2>
            </div>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksSteamDeckAndController.intro}</p>
          </div>
          <div className="scroll-reveal space-y-2">
            {t.modules.lucidBlocksSteamDeckAndController.faqs.map((faq: any, index: number) => (
              <div key={index} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setDeckExpanded(deckExpanded === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${deckExpanded === index ? "rotate-180" : ""}`} />
                </button>
                {deckExpanded === index && (
                  <div className="px-5 pb-5 text-muted-foreground text-sm">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 14: Settings and Accessibility */}
      <section id="slime-seas-items-and-materials" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksSettingsAndAccessibility']} locale={locale}>{t.modules.lucidBlocksSettingsAndAccessibility.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksSettingsAndAccessibility.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.modules.lucidBlocksSettingsAndAccessibility.settings.map((s: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Settings className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                  <h3 className="font-bold">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksSettingsAndAccessibility::settings::${index}`]} locale={locale}>
                      {s.name}
                    </LinkedTitle>
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{s.type}</span>
                </div>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 15: Updates and Patch Notes */}
      <section id="slime-seas-damage-calculator" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksUpdatesAndPatchNotes']} locale={locale}>{t.modules.lucidBlocksUpdatesAndPatchNotes.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksUpdatesAndPatchNotes.intro}</p>
          </div>
          <div className="scroll-reveal relative pl-6 border-l-2 border-[hsl(var(--nav-theme)/0.3)] space-y-8">
            {t.modules.lucidBlocksUpdatesAndPatchNotes.entries.map((entry: any, index: number) => (
              <div key={index} className="relative">
                <div className="absolute -left-[1.4rem] w-4 h-4 rounded-full bg-[hsl(var(--nav-theme))] border-2 border-background" />
                <div className="p-5 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{entry.type}</span>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold mb-1">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksUpdatesAndPatchNotes::entries::${index}`]} locale={locale}>
                      {entry.title}
                    </LinkedTitle>
                  </h3>
                  <p className="text-muted-foreground text-sm">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 16: Crash Fix and Troubleshooting */}
      <section id="slime-seas-reroll-probability" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksCrashFixAndTroubleshooting']} locale={locale}>{t.modules.lucidBlocksCrashFixAndTroubleshooting.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksCrashFixAndTroubleshooting.intro}</p>
          </div>
          <div className="scroll-reveal space-y-4 mb-8">
            {t.modules.lucidBlocksCrashFixAndTroubleshooting.steps.map((step: any, index: number) => (
              <div key={index} className="flex gap-4 p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--nav-theme)/0.2)] border-2 border-[hsl(var(--nav-theme)/0.5)] flex items-center justify-center">
                  <span className="text-xl font-bold text-[hsl(var(--nav-theme-light))]">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksCrashFixAndTroubleshooting::steps::${index}`]} locale={locale}>
                      {step.title}
                    </LinkedTitle>
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="scroll-reveal p-6 bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[hsl(var(--nav-theme-light))] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-[hsl(var(--nav-theme-light))] mb-2">Still having issues?</h3>
                <p className="text-sm text-muted-foreground mb-3">Report bugs with your logs through the official channels:</p>
                <div className="flex flex-wrap gap-3">
                  <a href="https://discord.gg/t2Huv8M5re" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                    <MessageCircle className="w-4 h-4" /> Discord <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href="https://www.roblox.com/communities/33326928/Slime-Slaying-Online" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                    Roblox Group <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQSection
          title={t.faq.title}
          titleHighlight={t.faq.titleHighlight}
          subtitle={t.faq.subtitle}
          questions={t.faq.questions}
        />
      </Suspense>

      {/* CTA Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner 3 */}
      <AdBanner type="banner-728x90" adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90} />

      {/* Footer */}
      <footer className="bg-white/[0.02] border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground">{t.footer.description}</p>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://discord.gg/t2Huv8M5re"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.discord}
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/SlayASlimeRBX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.twitter}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/@SlayASlimeRBLX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.steamCommunity}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.roblox.com/games/99046552174353/Slime-Seas-Anime-RPG"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.steamStore}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="text-muted-foreground">{t.footer.about}</span>
                </li>
                <li>
                  <span className="text-muted-foreground">{t.footer.privacy}</span>
                </li>
                <li>
                  <span className="text-muted-foreground">{t.footer.terms}</span>
                </li>
                <li>
                  <span className="text-muted-foreground">{t.footer.copyrightNotice}</span>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t.footer.copyright}</p>
              <p className="text-xs text-muted-foreground">{t.footer.disclaimer}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
