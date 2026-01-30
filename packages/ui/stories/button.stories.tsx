import type { Meta, StoryObj } from "@storybook/react";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import { Button } from "../src/components/ui/button";

const meta: Meta<typeof Button> = {
	title: "UI/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"destructive",
				"outline",
				"secondary",
				"ghost",
				"link",
			],
		},
		size: {
			control: "select",
			options: ["default", "sm", "lg", "xl", "icon"],
		},
		disabled: {
			control: "boolean",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "Button",
		variant: "default",
		size: "default",
	},
};

export const Destructive: Story = {
	args: {
		children: "Delete",
		variant: "destructive",
	},
};

export const Outline: Story = {
	args: {
		children: "Outline",
		variant: "outline",
	},
};

export const Secondary: Story = {
	args: {
		children: "Secondary",
		variant: "secondary",
	},
};

export const Ghost: Story = {
	args: {
		children: "Ghost",
		variant: "ghost",
	},
};

export const Link: Story = {
	args: {
		children: "Link",
		variant: "link",
	},
};

export const WithIcon: Story = {
	args: {
		children: (
			<>
				<Plus />
				Add customer
			</>
		),
		variant: "default",
	},
};

export const IconRight: Story = {
	args: {
		children: (
			<>
				Continue
				<ArrowRight />
			</>
		),
		variant: "default",
	},
};

export const Loading: Story = {
	args: {
		children: (
			<>
				<Loader2 className="animate-spin" />
				Please wait
			</>
		),
		variant: "default",
		disabled: true,
	},
};

export const Small: Story = {
	args: {
		children: "Small",
		size: "sm",
	},
};

export const Large: Story = {
	args: {
		children: "Large",
		size: "lg",
	},
};

export const ExtraLarge: Story = {
	args: {
		children: "Extra Large",
		size: "xl",
	},
};

export const IconOnly: Story = {
	args: {
		children: <Plus />,
		size: "icon",
		"aria-label": "Add",
	},
};

export const Disabled: Story = {
	args: {
		children: "Disabled",
		disabled: true,
	},
};
