/** biome-ignore-all lint/suspicious/useAwait: async required by Storybook viteFinal */
import { dirname, join, resolve } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

function getAbsolutePath(value: string): string {
	return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
	stories: [
		"../stories/**/*.mdx",
		"../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
	],
	addons: [
		getAbsolutePath("@storybook/addon-links"),
		getAbsolutePath("@storybook/addon-essentials"),
		getAbsolutePath("@storybook/addon-interactions"),
	],
	framework: {
		name: getAbsolutePath("@storybook/react-vite") as "@storybook/react-vite",
		options: {},
	},
	viteFinal: async (config) => {
		config.plugins = config.plugins || [];
		config.plugins.push(tailwindcss());

		config.resolve = config.resolve || {};
		config.resolve.alias = {
			...config.resolve.alias,
			"@": resolve(__dirname, "../src"),
		};
		return config;
	},
};

export default config;
