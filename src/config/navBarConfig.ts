import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/navBarConfig";

// ============================================================================
// 导航栏配置 - 根据顺序动态生成导航栏链接
// NavBar Configuration - Dynamically generate navigation bar links based on order
// ============================================================================
const getDynamicNavBarConfig = (): NavBarConfig => {
	const links: NavBarLink[] = [
		{
			name: "首页",
			url: "/",
			icon: "material-symbols:home",
		},
		{
			name: "归档",
			url: "/archive/",
			icon: "material-symbols:archive",
		},
		{
			name: "分类",
			url: "/archive/?category=Java%E5%BC%80%E5%8F%91",
			icon: "material-symbols:category",
			children: [
				{
					name: "Java开发",
					url: "/archive/?category=Java%E5%BC%80%E5%8F%91",
					icon: "material-symbols:code-blocks",
				},
				{
					name: "AI实践",
					url: "/archive/?category=AI%E5%AE%9E%E8%B7%B5",
					icon: "material-symbols:smart-toy",
				},
				{
					name: "逆向分析",
					url: "/archive/?category=%E9%80%86%E5%90%91%E5%88%86%E6%9E%90",
					icon: "material-symbols:bug-report",
				},
				{
					name: "浮生随笔",
					url: "/archive/?category=%E6%B5%AE%E7%94%9F%E9%9A%8F%E7%AC%94",
					icon: "material-symbols:edit-note",
				},
				{
					name: "开源项目",
					url: "/archive/?category=%E5%BC%80%E6%BA%90%E9%A1%B9%E7%9B%AE",
					icon: "material-symbols:deployed-code",
				},
			],
		},
		{
			name: "标签",
			url: "/archive/?tag=Java",
			icon: "material-symbols:tag",
			children: [
				{
					name: "Java",
					url: "/archive/?tag=Java",
					icon: "material-symbols:coffee",
				},
				{
					name: "Spring",
					url: "/archive/?tag=Spring",
					icon: "material-symbols:deployed-code",
				},
				{
					name: "AI",
					url: "/archive/?tag=AI",
					icon: "material-symbols:auto-awesome",
				},
				{
					name: "LLM",
					url: "/archive/?tag=LLM",
					icon: "material-symbols:psychology",
				},
				{
					name: "逆向",
					url: "/archive/?tag=%E9%80%86%E5%90%91",
					icon: "material-symbols:frame-inspect",
				},
			],
		},
		{
			name: "关于我",
			url: "/about/",
			icon: "material-symbols:person",
		},
	];

	return { links } as NavBarConfig;
};

// 导航搜索配置
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

// ============================================================================
// 链接预设 - 可自由自定义导航栏链接的名称、图标和URL
// Link Presets - Allows free customization of the name, icon, and URL of navigation bar links
// ============================================================================
export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: "主页",
		url: "/",
		icon: "material-symbols:home",
	},
	Archive: {
		name: "归档",
		url: "/archive/",
		icon: "material-symbols:archive",
	},
	Categories: {
		name: "分类",
		url: "/categories/",
		icon: "material-symbols:folder-open-rounded",
	},
	Tags: {
		name: "标签",
		url: "/tags/",
		icon: "material-symbols:tag-rounded",
	},
	Friends: {
		name: "友链",
		url: "/friends/",
		icon: "material-symbols:group",
		pageKey: "friends",
	},
	Sponsor: {
		name: "打赏",
		url: "/sponsor/",
		icon: "material-symbols:favorite",
		pageKey: "sponsor",
	},
	Guestbook: {
		name: "留言",
		url: "/guestbook/",
		icon: "material-symbols:chat",
		pageKey: "guestbook",
	},
	About: {
		name: "关于我",
		url: "/about/",
		icon: "material-symbols:person",
	},
	Bangumi: {
		name: "番组计划",
		url: "/bangumi/",
		icon: "material-symbols:movie",
		pageKey: "bangumi",
	},
	Gallery: {
		name: "相册",
		url: "/gallery/",
		icon: "material-symbols:photo-library",
		pageKey: "gallery",
	},
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
