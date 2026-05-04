import type { AnnouncementConfig } from "../types/config";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题
	title: "博客定位",

	// 公告内容
	content: "这里主要分享 Java 开发、AI 实践与逆向分析相关内容。",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "查看关于我",
		// 链接 URL
		url: "/about/",
		// 内部链接
		external: false,
	},
};
