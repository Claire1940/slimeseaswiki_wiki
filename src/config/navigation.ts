import {
	BookOpen,
	Globe,
	Users,
	Swords,
	PawPrint,
	Skull,
	Package,
	type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
	key: string // 用于翻译键，如 'codes' -> t('nav.codes')
	path: string // URL 路径，如 '/codes'
	icon: LucideIcon // Lucide 图标组件
	isContentType: boolean // 是否对应 content/ 目录
}

export const NAVIGATION_CONFIG: NavigationItem[] = [
	{
		key: 'guide',
		path: '/guide',
		icon: BookOpen,
		isContentType: true,
	},
	{
		key: 'resources',
		path: '/resources',
		icon: Globe,
		isContentType: true,
	},
	{
		key: 'races',
		path: '/races',
		icon: Users,
		isContentType: true,
	},
	{
		key: 'weapons',
		path: '/weapons',
		icon: Swords,
		isContentType: true,
	},
	{
		key: 'pets',
		path: '/pets',
		icon: PawPrint,
		isContentType: true,
	},
	{
		key: 'bosses',
		path: '/bosses',
		icon: Skull,
		isContentType: true,
	},
	{
		key: 'items',
		path: '/items',
		icon: Package,
		isContentType: true,
	},
]

// 从配置派生内容类型列表（用于路由和内容加载）
export const CONTENT_TYPES = NAVIGATION_CONFIG.filter((item) => item.isContentType).map(
	(item) => item.path.slice(1),
) // 移除开头的 '/' -> ['codes', 'build', 'combat', 'guides']

export type ContentType = (typeof CONTENT_TYPES)[number]

// 辅助函数：验证内容类型
export function isValidContentType(type: string): type is ContentType {
	return CONTENT_TYPES.includes(type as ContentType)
}
