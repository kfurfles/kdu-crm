import { Indicator, Root } from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import {
	type ComponentPropsWithoutRef,
	type ComponentRef,
	forwardRef,
} from "react";
import { cn } from "@/lib/utils";

const Checkbox = forwardRef<
	ComponentRef<typeof Root>,
	ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => (
	<Root
		className={cn(
			"peer h-5 w-5 shrink-0 rounded-md border border-gray-300 bg-white shadow-xs",
			"focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
			"disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100",
			"data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-50",
			"data-[state=indeterminate]:border-brand-600 data-[state=indeterminate]:bg-brand-50",
			className
		)}
		ref={ref}
		{...props}
	>
		<Indicator
			className={cn("flex items-center justify-center text-brand-600")}
		>
			{props.checked === "indeterminate" ? (
				<Minus className="h-3.5 w-3.5" />
			) : (
				<Check className="h-3.5 w-3.5" />
			)}
		</Indicator>
	</Root>
));
Checkbox.displayName = Root.displayName;

export { Checkbox };
