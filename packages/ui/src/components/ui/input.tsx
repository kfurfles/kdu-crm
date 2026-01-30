import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				className={cn(
					"flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 text-sm shadow-xs transition-colors",
					"placeholder:text-gray-500",
					"focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100",
					"disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
					"file:border-0 file:bg-transparent file:font-medium file:text-sm",
					className
				)}
				ref={ref}
				type={type}
				{...props}
			/>
		);
	}
);
Input.displayName = "Input";

export { Input };
