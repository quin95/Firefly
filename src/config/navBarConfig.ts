import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/config";

// 根据页面开关动态生成导航栏配置
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

	// 仅返回链接，其它导航搜索相关配置在模块顶层常量中独立导出
	return { links };
};

// 导航搜索配置
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
