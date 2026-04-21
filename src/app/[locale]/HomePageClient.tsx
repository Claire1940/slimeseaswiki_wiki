'use client'

import { useEffect, useState, Suspense, lazy } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardCheck,
  Clock,
  Eye,
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

  // Interactive state for calculator modules
  const [damageRaceIndex, setDamageRaceIndex] = useState(0)
  const [damageWeaponIndex, setDamageWeaponIndex] = useState(0)
  const [damageEnchantLevel, setDamageEnchantLevel] = useState(0)
  const [rerollTargetIndex, setRerollTargetIndex] = useState(0)
  const [rerollAttempts, setRerollAttempts] = useState(25)

  // Locale-safe fallbacks for modules 9-16
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
  const module13Cards =
    t.modules?.lucidBlocksSteamDeckAndController?.items ||
    (t.modules?.lucidBlocksSteamDeckAndController?.faqs || []).map((faq: any) => ({
      cardTitle: faq.question || 'Slime Seas PvP Card',
      summary: faq.answer || '',
      recommendedRaces: ['Slime Seas Flexible Pick'],
      coreInputs: ['Q: Dash', 'F: Block', 'Shift: Mouse Lock', '1-4: Weapon Skills'],
      duelTips: [faq.answer || 'Use spacing and timing to control Slime Seas PvP exchanges.'],
    }))
  const module13Icons = [Gamepad2, Sparkles, Star, Hammer]

  const module14Items =
    t.modules?.lucidBlocksSettingsAndAccessibility?.items ||
    (t.modules?.lucidBlocksSettingsAndAccessibility?.settings || []).map((setting: any) => ({
      item: setting.name || 'Slime Seas Item Entry',
      type: setting.type || 'Reference',
      rarity: 'Reference',
      source: 'Slime Seas Route',
      levelOrZone: 'Progression Route',
      obtainMethod: setting.description || '',
      stats: '-',
      tradeable: '-',
      whyItMatters: setting.description || '',
    }))

  const module15Calculator = t.modules?.lucidBlocksUpdatesAndPatchNotes?.calculator || {}
  const module15RaceOptions = module15Calculator.raceOptions || [
    { name: 'Baseline Human', multiplier: 1, tag: 'Baseline', statProfile: '1x HP • 1x ATK • 1x DEF • 1x SPD • 1x Luck' },
    { name: 'Berserker (Starterpack)', multiplier: 1.15, tag: 'DPS / PvP', statProfile: 'Premium-locked aggressive kit' },
    { name: 'Lucky (Boost)', multiplier: 1, tag: 'Farm', statProfile: '1.05x Luck' },
  ]
  const module15WeaponOptions = module15Calculator.weaponOptions || [
    { name: 'Wooden Katana', atk: 5, rarity: 'Common', source: 'Starting Forest', upgradeCeiling: 10 },
    { name: 'Legendary Slime Katana', atk: 100, rarity: 'Legendary', source: 'Demon Lord Rima', upgradeCeiling: 20 },
  ]
  const module15EnchantRange = module15Calculator.enchantRange || { min: 0, max: 20, default: 0, step: 1 }
  const module15Presets = t.modules?.lucidBlocksUpdatesAndPatchNotes?.presets || [
    {
      panelTitle: 'Slime Seas Damage Workflow',
      rows: (t.modules?.lucidBlocksUpdatesAndPatchNotes?.entries || []).map((entry: any) => ({
        name: entry.title || 'Slime Seas Damage Step',
        tag: entry.type || 'Step',
        detail: entry.description || '',
      })),
    },
  ]

  const safeDamageRaceIndex = module15RaceOptions.length > 0
    ? Math.min(damageRaceIndex, module15RaceOptions.length - 1)
    : 0
  const safeDamageWeaponIndex = module15WeaponOptions.length > 0
    ? Math.min(damageWeaponIndex, module15WeaponOptions.length - 1)
    : 0
  const module15SelectedRace =
    module15RaceOptions[safeDamageRaceIndex] ||
    { name: 'Baseline Human', multiplier: 1, tag: 'Baseline', statProfile: '1x stats' }
  const module15SelectedWeapon =
    module15WeaponOptions[safeDamageWeaponIndex] ||
    { name: 'Wooden Katana', atk: 5, rarity: 'Common', source: 'Starting Forest', upgradeCeiling: 10 }
  const module15MinEnchant = Number(module15EnchantRange.min ?? 0)
  const module15MaxEnchant = Number(module15EnchantRange.max ?? 20)
  const module15DefaultEnchant = Number(module15EnchantRange.default ?? 0)
  const module15SafeEnchant = Math.max(
    module15MinEnchant,
    Math.min(module15MaxEnchant, Number.isFinite(damageEnchantLevel) ? damageEnchantLevel : module15DefaultEnchant)
  )
  const module15EnchantScale = Number(module15Calculator.multiplierPerEnchant ?? 0.05)
  const module15EstimatedDamage = Math.round(
    Number(module15SelectedWeapon.atk || 0) *
    Number(module15SelectedRace.multiplier || 1) *
    (1 + module15SafeEnchant * module15EnchantScale)
  )
  const module15BaselineAtk = Number(module15WeaponOptions[0]?.atk || 0)
  const module15CompareDelta = Number(module15SelectedWeapon.atk || 0) - module15BaselineAtk

  const module16Targets =
    t.modules?.lucidBlocksCrashFixAndTroubleshooting?.targets ||
    (t.modules?.lucidBlocksCrashFixAndTroubleshooting?.steps || []).map((step: any) => ({
      target: step.title || 'Slime Seas Target Race',
      rarity: 'Reference',
      rollRate: 0.02,
      rollRateLabel: '2.00%',
      expectedRollsToSuccess: 50,
      snapshots: [
        { rerolls: 5, chance: '9.61%' },
        { rerolls: 25, chance: '39.65%' },
        { rerolls: 50, chance: '63.58%' },
      ],
      note: step.description || '',
    }))
  const module16StarterBundle = t.modules?.lucidBlocksCrashFixAndTroubleshooting?.starterCodeBundle || {
    title: 'Slime Seas Starter Code Bundle',
    summary: 'HUBISLAND gives 3 Race Rerolls and SLIMEPIECE gives 2 Race Rerolls.',
    snapshots: [
      { label: 'Dragonborn', chance: '1.24%' },
      { label: 'Shadowborn', chance: '1.24%' },
      { label: 'Any Legendary', chance: '2.48%' },
      { label: 'Djinn or Lunarian', chance: '9.61%' },
    ],
  }
  const safeRerollTargetIndex = module16Targets.length > 0
    ? Math.min(rerollTargetIndex, module16Targets.length - 1)
    : 0
  const module16SelectedTarget =
    module16Targets[safeRerollTargetIndex] ||
    { target: 'Dragonborn', rarity: 'Legendary', rollRate: 0.0025, rollRateLabel: '0.25%', expectedRollsToSuccess: 400 }
  const module16RollRate = Number(module16SelectedTarget.rollRate || 0.0025)
  const module16SafeAttempts = Math.max(1, Number.isFinite(rerollAttempts) ? rerollAttempts : 1)
  const module16HitChance = (1 - Math.pow(1 - module16RollRate, module16SafeAttempts)) * 100

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

      {/* Module 13: Slime Seas PvP Guide */}
      <section id="slime-seas-pvp-guide" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.12)] px-4 py-1 text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              {t.modules.lucidBlocksSteamDeckAndController.eyebrow || 'Slime Seas PvP Meta'}
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold">
              {t.modules.lucidBlocksSteamDeckAndController.title}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-4xl mx-auto">
              {t.modules.lucidBlocksSteamDeckAndController.subtitle || 'Slime Seas PvP builds, race pairings, and duel flow'}
            </p>
            <p className="mt-4 text-muted-foreground max-w-4xl mx-auto">
              {t.modules.lucidBlocksSteamDeckAndController.intro}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {module13Cards.map((card: any, index: number) => {
              const CardIcon = module13Icons[index % module13Icons.length]
              const recommendedRaces = card.recommendedRaces || card.recommended_races || []
              const coreInputs = card.coreInputs || card.core_inputs || []
              const coreSkills = card.coreSkills || card.core_skills || []
              const tacticalCore = coreInputs.length > 0 ? coreInputs : coreSkills
              const keyNumbers = card.keyNumbers || card.key_numbers || []
              const duelTips = card.duelTips || card.duel_tips || []

              return (
                <article
                  key={index}
                  className="scroll-reveal p-6 rounded-2xl border border-border bg-white/[0.03] hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[hsl(var(--nav-theme)/0.14)] border border-[hsl(var(--nav-theme)/0.35)] flex items-center justify-center">
                      <CardIcon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {card.cardTitle || card.card_title || `Slime Seas PvP Card ${index + 1}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{card.summary || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recommended Races</p>
                      <div className="flex flex-wrap gap-2">
                        {recommendedRaces.map((race: string, raceIndex: number) => (
                          <span
                            key={raceIndex}
                            className="rounded-full border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.12)] px-3 py-1 text-xs"
                          >
                            {race}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Core Inputs and Skills</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tacticalCore.map((entry: string, entryIndex: number) => (
                          <p key={entryIndex} className="text-sm rounded-lg bg-white/5 border border-border px-3 py-2">
                            {entry}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Key Numbers</p>
                      <div className="space-y-2">
                        {keyNumbers.map((item: string, itemIndex: number) => (
                          <p key={itemIndex} className="text-sm rounded-lg bg-white/5 border border-border px-3 py-2">
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Duel Tips</p>
                      <div className="space-y-2">
                        {duelTips.map((tip: string, tipIndex: number) => (
                          <p key={tipIndex} className="text-sm flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 text-[hsl(var(--nav-theme-light))] flex-shrink-0" />
                            <span>{tip}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Module 14: Slime Seas Items and Materials */}
      <section id="slime-seas-items-and-materials" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.12)] px-4 py-1 text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              <Settings className="w-4 h-4" />
              {t.modules.lucidBlocksSettingsAndAccessibility.eyebrow || 'Slime Seas Loot Table'}
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold">
              {t.modules.lucidBlocksSettingsAndAccessibility.title}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-4xl mx-auto">
              {t.modules.lucidBlocksSettingsAndAccessibility.subtitle || 'Slime Seas key items, materials, and first chase drops'}
            </p>
            <p className="mt-4 text-muted-foreground max-w-4xl mx-auto">
              {t.modules.lucidBlocksSettingsAndAccessibility.intro}
            </p>
          </div>

          <div className="scroll-reveal hidden lg:block rounded-2xl border border-border bg-white/[0.03] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(var(--nav-theme)/0.12)] border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Item</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Rarity</th>
                    <th className="px-4 py-3 text-left font-semibold">Source</th>
                    <th className="px-4 py-3 text-left font-semibold">Level or Zone</th>
                    <th className="px-4 py-3 text-left font-semibold">Drop or Obtain</th>
                    <th className="px-4 py-3 text-left font-semibold">Stats</th>
                    <th className="px-4 py-3 text-left font-semibold">Tradeable</th>
                    <th className="px-4 py-3 text-left font-semibold">Why It Matters</th>
                  </tr>
                </thead>
                <tbody>
                  {module14Items.map((row: any, index: number) => (
                    <tr key={index} className="border-b border-border/60 align-top">
                      <td className="px-4 py-4 font-semibold">{row.item || '-'}</td>
                      <td className="px-4 py-4">{row.type || '-'}</td>
                      <td className="px-4 py-4">{row.rarity || '-'}</td>
                      <td className="px-4 py-4">{row.source || '-'}</td>
                      <td className="px-4 py-4">{row.levelOrZone || row.level_or_zone || '-'}</td>
                      <td className="px-4 py-4">{row.obtainMethod || row.dropRateOrObtain || row.drop_rate_or_obtain || '-'}</td>
                      <td className="px-4 py-4">{row.stats || '-'}</td>
                      <td className="px-4 py-4">{row.tradeable || '-'}</td>
                      <td className="px-4 py-4">{row.whyItMatters || row.why_it_matters || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="scroll-reveal lg:hidden space-y-4">
            {module14Items.map((row: any, index: number) => (
              <article key={index} className="rounded-2xl border border-border bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold text-lg">{row.item || '-'}</h3>
                  <span className="text-xs px-2 py-1 rounded-full border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.12)]">
                    {row.rarity || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p><span className="text-muted-foreground">Type: </span>{row.type || '-'}</p>
                  <p><span className="text-muted-foreground">Source: </span>{row.source || '-'}</p>
                  <p><span className="text-muted-foreground">Level or Zone: </span>{row.levelOrZone || row.level_or_zone || '-'}</p>
                  <p><span className="text-muted-foreground">Drop or Obtain: </span>{row.obtainMethod || row.dropRateOrObtain || row.drop_rate_or_obtain || '-'}</p>
                  <p><span className="text-muted-foreground">Stats: </span>{row.stats || '-'}</p>
                  <p><span className="text-muted-foreground">Tradeable: </span>{row.tradeable || '-'}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  <span className="text-foreground font-medium">Why It Matters: </span>
                  {row.whyItMatters || row.why_it_matters || '-'}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Module 15: Slime Seas Damage Calculator */}
      <section id="slime-seas-damage-calculator" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.12)] px-4 py-1 text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              {t.modules.lucidBlocksUpdatesAndPatchNotes.eyebrow || 'Slime Seas Damage Tools'}
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold">
              {t.modules.lucidBlocksUpdatesAndPatchNotes.title}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-4xl mx-auto">
              {t.modules.lucidBlocksUpdatesAndPatchNotes.subtitle || 'Slime Seas quick damage checks and item comparisons'}
            </p>
            <p className="mt-4 text-muted-foreground max-w-4xl mx-auto">
              {t.modules.lucidBlocksUpdatesAndPatchNotes.intro}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="scroll-reveal rounded-2xl border border-border bg-white/[0.03] p-6 space-y-6">
              <h3 className="text-2xl font-bold">Slime Seas Damage Live Estimate</h3>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Race Preset</span>
                  <select
                    value={safeDamageRaceIndex}
                    onChange={(event) => setDamageRaceIndex(Number(event.target.value))}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {module15RaceOptions.map((race: any, index: number) => (
                      <option key={index} value={index}>{race.name || `Slime Seas Race ${index + 1}`}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Weapon Preset</span>
                  <select
                    value={safeDamageWeaponIndex}
                    onChange={(event) => setDamageWeaponIndex(Number(event.target.value))}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {module15WeaponOptions.map((weapon: any, index: number) => (
                      <option key={index} value={index}>{weapon.name || `Slime Seas Weapon ${index + 1}`}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Enchant Level: {module15SafeEnchant}</span>
                  <input
                    type="range"
                    min={module15MinEnchant}
                    max={module15MaxEnchant}
                    step={Number(module15EnchantRange.step ?? 1)}
                    value={module15SafeEnchant}
                    onChange={(event) => setDamageEnchantLevel(Number(event.target.value))}
                    className="mt-2 w-full accent-[hsl(var(--nav-theme-light))]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.1)] p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated Single-Hit Damage</p>
                  <p className="text-3xl font-bold text-[hsl(var(--nav-theme-light))] mt-1">{module15EstimatedDamage}</p>
                </div>
                <div className="rounded-xl border border-border bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">ATK Delta vs First Weapon</p>
                  <p className="text-3xl font-bold mt-1">{module15CompareDelta >= 0 ? '+' : ''}{module15CompareDelta}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="text-foreground font-medium">Race Tag: </span>{module15SelectedRace.tag || module15SelectedRace.playstyleTag || module15SelectedRace.playstyle_tag || 'Baseline'}</p>
                <p><span className="text-foreground font-medium">Race Profile: </span>{module15SelectedRace.statProfile || module15SelectedRace.stat_profile || '-'}</p>
                <p><span className="text-foreground font-medium">Weapon Rarity: </span>{module15SelectedWeapon.rarity || '-'}</p>
                <p><span className="text-foreground font-medium">Weapon Source: </span>{module15SelectedWeapon.source || '-'}</p>
                <p><span className="text-foreground font-medium">Formula: </span>ATK x race multiplier x (1 + enchant x {module15EnchantScale})</p>
              </div>
            </div>

            <div className="scroll-reveal space-y-4">
              {module15Presets.map((panel: any, index: number) => {
                const rows = panel.rows || panel.options || []

                return (
                  <article key={index} className="rounded-2xl border border-border bg-white/[0.03] p-5">
                    <h3 className="text-xl font-bold mb-4">{panel.panelTitle || panel.panel_title || `Slime Seas Preset ${index + 1}`}</h3>
                    <div className="space-y-3">
                      {rows.map((row: any, rowIndex: number) => (
                        <div key={rowIndex} className="rounded-xl border border-border bg-white/5 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold">{row.name || row.item || row.comparison || row.race || `Preset ${rowIndex + 1}`}</p>
                            <span className="text-xs rounded-full border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.12)] px-2 py-1">
                              {row.tag || row.playstyleTag || row.playstyle_tag || row.rarity || row.type || 'Slime Seas'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {row.detail || row.profile || row.statProfile || row.stat_profile || row.note || row.source || '-'}
                          </p>
                          {(row.atk || row.upgradeCeiling || row.upgrade_ceiling || row.atkDelta || row.atk_delta) && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              ATK {row.atk || row.atkDelta || row.atk_delta || '-'} | Upgrade {row.upgradeCeiling || row.upgrade_ceiling || '-'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Module 16: Slime Seas Reroll Probability */}
      <section id="slime-seas-reroll-probability" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.12)] px-4 py-1 text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              {t.modules.lucidBlocksCrashFixAndTroubleshooting.eyebrow || 'Slime Seas Reroll Odds'}
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold">
              {t.modules.lucidBlocksCrashFixAndTroubleshooting.title}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-4xl mx-auto">
              {t.modules.lucidBlocksCrashFixAndTroubleshooting.subtitle || 'Slime Seas target-race odds for rerolls and code stockpiles'}
            </p>
            <p className="mt-4 text-muted-foreground max-w-4xl mx-auto">
              {t.modules.lucidBlocksCrashFixAndTroubleshooting.intro}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="scroll-reveal rounded-2xl border border-border bg-white/[0.03] p-6 space-y-6">
              <h3 className="text-2xl font-bold">Slime Seas Reroll Odds Calculator</h3>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Target Race</span>
                  <select
                    value={safeRerollTargetIndex}
                    onChange={(event) => setRerollTargetIndex(Number(event.target.value))}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {module16Targets.map((target: any, index: number) => (
                      <option key={index} value={index}>
                        {target.target || target.name || `Slime Seas Target ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Reroll Attempts</span>
                  <input
                    type="number"
                    min={1}
                    value={module16SafeAttempts}
                    onChange={(event) => setRerollAttempts(Number(event.target.value))}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.1)] p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Calculated Hit Chance</p>
                  <p className="text-3xl font-bold text-[hsl(var(--nav-theme-light))] mt-1">{module16HitChance.toFixed(2)}%</p>
                </div>
                <div className="rounded-xl border border-border bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Expected Rolls to Success</p>
                  <p className="text-3xl font-bold mt-1">{module16SelectedTarget.expectedRollsToSuccess || '-'}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="text-foreground font-medium">Selected Rarity: </span>{module16SelectedTarget.rarity || '-'}</p>
                <p><span className="text-foreground font-medium">Roll Rate: </span>{module16SelectedTarget.rollRateLabel || `${(module16RollRate * 100).toFixed(2)}%`}</p>
                <p><span className="text-foreground font-medium">Formula: </span>{t.modules.lucidBlocksCrashFixAndTroubleshooting.formula || 'Hit chance = 1 - (1 - p)^n'}</p>
              </div>
            </div>

            <div className="scroll-reveal space-y-4">
              {module16Targets.map((target: any, index: number) => (
                <article
                  key={index}
                  className={`rounded-2xl border bg-white/[0.03] p-4 transition-colors ${
                    index === safeRerollTargetIndex
                      ? 'border-[hsl(var(--nav-theme)/0.6)]'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-lg">{target.target || target.name || `Slime Seas Target ${index + 1}`}</h3>
                    <span className="text-xs px-2 py-1 rounded-full border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.12)]">
                      {target.rarity || '-'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Roll Rate: {target.rollRateLabel || `${(Number(target.rollRate || 0) * 100).toFixed(2)}%`} | Expected Rolls: {target.expectedRollsToSuccess || '-'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {(target.snapshots || []).map((snapshot: any, snapshotIndex: number) => (
                      <div key={snapshotIndex} className="rounded-lg border border-border bg-white/5 p-2">
                        <p className="text-xs text-muted-foreground">{snapshot.rerolls ? `${snapshot.rerolls} rerolls` : snapshot.label || '-'}</p>
                        <p className="text-sm font-semibold">{snapshot.chance || '-'}</p>
                      </div>
                    ))}
                  </div>
                  {target.note && <p className="text-xs text-muted-foreground mt-3">{target.note}</p>}
                </article>
              ))}
            </div>
          </div>

          <div className="scroll-reveal mt-6 rounded-2xl border border-[hsl(var(--nav-theme)/0.35)] bg-[hsl(var(--nav-theme)/0.1)] p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[hsl(var(--nav-theme-light))] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-[hsl(var(--nav-theme-light))] mb-2">
                  {module16StarterBundle.title || 'Slime Seas Starter Code Bundle'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {module16StarterBundle.summary || 'HUBISLAND gives 3 Race Rerolls and SLIMEPIECE gives 2 Race Rerolls.'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(module16StarterBundle.snapshots || []).map((snapshot: any, index: number) => (
                    <div key={index} className="rounded-lg border border-border bg-white/5 p-3">
                      <p className="text-xs text-muted-foreground">{snapshot.label || '-'}</p>
                      <p className="text-sm font-semibold">{snapshot.chance || '-'}</p>
                    </div>
                  ))}
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
