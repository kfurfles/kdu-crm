import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "../src/components/ui/checkbox";
import { Label } from "../src/components/ui/label";

const meta: Meta<typeof Checkbox> = {
	title: "UI/Checkbox",
	component: Checkbox,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		checked: {
			control: "boolean",
		},
		disabled: {
			control: "boolean",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const Checked: Story = {
	args: {
		checked: true,
	},
};

export const WithLabel: Story = {
	render: (args) => (
		<div className="flex items-center space-x-2">
			<Checkbox {...args} id="terms" />
			<Label
				className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				htmlFor="terms"
			>
				Accept terms and conditions
			</Label>
		</div>
	),
	args: {},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

export const DisabledChecked: Story = {
	args: {
		disabled: true,
		checked: true,
	},
};

export const Indeterminate: Story = {
	render: () => {
		const [checked, setChecked] = useState<boolean | "indeterminate">(
			"indeterminate"
		);
		return (
			<div className="flex items-center space-x-2">
				<Checkbox
					checked={checked}
					id="indeterminate"
					onCheckedChange={(value) => setChecked(value)}
				/>
				<Label htmlFor="indeterminate">Select all</Label>
			</div>
		);
	},
};

export const Group: Story = {
	render: () => (
		<div className="space-y-2">
			<div className="flex items-center space-x-2">
				<Checkbox id="option1" />
				<Label htmlFor="option1">Option 1</Label>
			</div>
			<div className="flex items-center space-x-2">
				<Checkbox defaultChecked id="option2" />
				<Label htmlFor="option2">Option 2</Label>
			</div>
			<div className="flex items-center space-x-2">
				<Checkbox id="option3" />
				<Label htmlFor="option3">Option 3</Label>
			</div>
		</div>
	),
};
