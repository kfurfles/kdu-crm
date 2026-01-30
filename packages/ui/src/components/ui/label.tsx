import { Root } from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import {
	type ComponentPropsWithoutRef,
	type ComponentRef,
	forwardRef,
} from "react";
import { cn } from "@/lib/utils";

const labelVariants = cva(
	"font-medium text-gray-700 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = forwardRef<
	ComponentRef<typeof Root>,
	ComponentPropsWithoutRef<typeof Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
	<Root className={cn(labelVariants(), className)} ref={ref} {...props} />
));
Label.displayName = Root.displayName;

export { Label };
