import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				default: "border border-brand-200 bg-brand-50 text-brand-700",
				secondary: "border border-gray-200 bg-gray-100 text-gray-700",
				destructive: "border border-red-200 bg-red-50 text-red-700",
				success: "border border-brand-200 bg-brand-50 text-brand-700",
				warning: "border border-yellow-200 bg-yellow-50 text-yellow-800",
				outline: "border border-gray-300 bg-white text-gray-700",
			},
			size: {
				default: "px-2.5 py-0.5 text-xs",
				sm: "px-2 py-0.5 text-xs",
				lg: "px-3 py-1 text-sm",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
	return (
		<div
			className={cn(badgeVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
