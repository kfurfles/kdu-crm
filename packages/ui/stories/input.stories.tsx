import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../src/components/ui/input";
import { Label } from "../src/components/ui/label";

const meta: Meta<typeof Input> = {
	title: "UI/Input",
	component: Input,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		type: {
			control: "select",
			options: ["text", "email", "password", "number", "tel", "url"],
		},
		disabled: {
			control: "boolean",
		},
		placeholder: {
			control: "text",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: "Enter your email",
		type: "email",
	},
};

export const WithLabel: Story = {
	render: (args) => (
		<div className="grid w-full max-w-sm gap-1.5">
			<Label htmlFor="email">Email</Label>
			<Input {...args} id="email" />
		</div>
	),
	args: {
		placeholder: "email@example.com",
		type: "email",
	},
};

export const WithHelpText: Story = {
	render: (args) => (
		<div className="grid w-full max-w-sm gap-1.5">
			<Label htmlFor="email">Email</Label>
			<Input {...args} id="email" />
			<p className="text-gray-500 text-sm">
				This is your public email address.
			</p>
		</div>
	),
	args: {
		placeholder: "email@example.com",
		type: "email",
	},
};

export const Disabled: Story = {
	args: {
		placeholder: "Disabled input",
		disabled: true,
	},
};

export const WithValue: Story = {
	args: {
		defaultValue: "john@example.com",
		type: "email",
	},
};

export const Password: Story = {
	args: {
		placeholder: "Enter password",
		type: "password",
	},
};

export const NumberInput: Story = {
	args: {
		placeholder: "0",
		type: "number",
	},
};

export const Phone: Story = {
	args: {
		placeholder: "+55 11 99999-9999",
		type: "tel",
	},
};

export const File: Story = {
	args: {
		type: "file",
	},
};
