import { getLatestArticles } from '@/lib/getLatestArticles'
import { buildModuleLinkMap } from '@/lib/buildModuleLinkMap'
import type { Language } from '@/lib/content'
import { buildLanguageAlternates } from '@/lib/i18n-utils'
import type { Locale } from '@/i18n/routing'
import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.slimeseaswiki.wiki'
  const imageUrl = `${siteUrl}/images/hero.webp`
  const title = 'Slime Seas Wiki - Codes, Races & Weapons'
  const description =
    'Track active codes, best races, weapon stances, bosses, islands, and fast progression routes for Slime Seas.'
  const path = '/'

  return {
    title,
    description,
    alternates: buildLanguageAlternates(path, locale as Locale, siteUrl),
    openGraph: {
      type: 'website',
      title,
      description,
      url: locale === 'en' ? siteUrl : `${siteUrl}/${locale}`,
      siteName: 'Slime Seas Wiki',
      images: [
        {
          url: imageUrl,
          width: 1920,
          height: 1080,
          alt: 'Slime Seas Wiki Hero Image',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params

  // 服务器端获取最新文章数据
  const latestArticles = await getLatestArticles(locale as Language, 30)
  const moduleLinkMap = await buildModuleLinkMap(locale as Language)

  return <HomePageClient latestArticles={latestArticles} moduleLinkMap={moduleLinkMap} locale={locale} />
}
