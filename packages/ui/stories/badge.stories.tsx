import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../src/components/ui/badge";

const meta: Meta<typeof Badge> = {
	title: "UI/Badge",
	component: Badge,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"secondary",
				"destructive",
				"success",
				"warning",
				"outline",
			],
		},
		size: {
			control: "select",
			options: ["default", "sm", "lg"],
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "VIP",
	},
};

export const Secondary: Story = {
	args: {
		children: "Secondary",
		variant: "secondary",
	},
};

export const Destructive: Story = {
	args: {
		children: "Cancelled",
		variant: "destructive",
	},
};

export const Success: Story = {
	args: {
		children: "Done",
		variant: "success",
	},
};

export const Warning: Story = {
	args: {
		children: "Pending",
		variant: "warning",
	},
};

export const Outline: Story = {
	args: {
		children: "Outline",
		variant: "outline",
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

export const TagList: Story = {
	render: () => (
		<div className="flex flex-wrap gap-2">
			<Badge>VIP</Badge>
			<Badge variant="secondary">Empresarial</Badge>
			<Badge variant="outline">Novo</Badge>
			<Badge variant="warning">Aguardando</Badge>
		</div>
	),
};

export const StatusBadges: Story = {
	render: () => (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<Badge variant="success">Aberto</Badge>
				<span className="text-gray-600 text-sm">Appointment status: Open</span>
			</div>
			<div className="flex items-center gap-2">
				<Badge variant="secondary">Concluído</Badge>
				<span className="text-gray-600 text-sm">Appointment status: Done</span>
			</div>
			<div className="flex items-center gap-2">
				<Badge variant="destructive">Cancelado</Badge>
				<span className="text-gray-600 text-sm">
					Appointment status: Cancelled
				</span>
			</div>
		</div>
	),
};
