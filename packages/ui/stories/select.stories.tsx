import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../src/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "../src/components/ui/select";

const meta: Meta<typeof Select> = {
	title: "UI/Select",
	component: Select,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Select>
			<SelectTrigger className="w-[280px]">
				<SelectValue placeholder="Select an option" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="option1">Option 1</SelectItem>
				<SelectItem value="option2">Option 2</SelectItem>
				<SelectItem value="option3">Option 3</SelectItem>
			</SelectContent>
		</Select>
	),
};

export const WithLabel: Story = {
	render: () => (
		<div className="grid w-full max-w-sm gap-1.5">
			<Label htmlFor="status">Status</Label>
			<Select>
				<SelectTrigger id="status">
					<SelectValue placeholder="Select status" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="active">Active</SelectItem>
					<SelectItem value="inactive">Inactive</SelectItem>
					<SelectItem value="pending">Pending</SelectItem>
				</SelectContent>
			</Select>
		</div>
	),
};

export const WithGroups: Story = {
	render: () => (
		<Select>
			<SelectTrigger className="w-[280px]">
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Fruits</SelectLabel>
					<SelectItem value="apple">Apple</SelectItem>
					<SelectItem value="banana">Banana</SelectItem>
					<SelectItem value="orange">Orange</SelectItem>
				</SelectGroup>
				<SelectGroup>
					<SelectLabel>Vegetables</SelectLabel>
					<SelectItem value="carrot">Carrot</SelectItem>
					<SelectItem value="broccoli">Broccoli</SelectItem>
					<SelectItem value="spinach">Spinach</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
};

export const Disabled: Story = {
	render: () => (
		<Select disabled>
			<SelectTrigger className="w-[280px]">
				<SelectValue placeholder="Disabled" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="option1">Option 1</SelectItem>
			</SelectContent>
		</Select>
	),
};

export const WithDefaultValue: Story = {
	render: () => (
		<Select defaultValue="option2">
			<SelectTrigger className="w-[280px]">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="option1">Option 1</SelectItem>
				<SelectItem value="option2">Option 2</SelectItem>
				<SelectItem value="option3">Option 3</SelectItem>
			</SelectContent>
		</Select>
	),
};

export const UserAssignment: Story = {
	render: () => (
		<div className="grid w-full max-w-sm gap-1.5">
			<Label htmlFor="user">Assign to</Label>
			<Select>
				<SelectTrigger id="user">
					<SelectValue placeholder="Select user" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="joao">João Silva</SelectItem>
					<SelectItem value="maria">Maria Santos</SelectItem>
					<SelectItem value="pedro">Pedro Oliveira</SelectItem>
					<SelectItem value="ana">Ana Costa</SelectItem>
				</SelectContent>
			</Select>
			<p className="text-gray-500 text-sm">
				The user responsible for this client.
			</p>
		</div>
	),
};
