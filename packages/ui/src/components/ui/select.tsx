import {
	Content,
	Group,
	Icon,
	Item,
	ItemIndicator,
	ItemText,
	Label,
	Portal,
	Root,
	ScrollDownButton,
	ScrollUpButton,
	Separator,
	Trigger,
	Value,
	Viewport,
} from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import {
	type ComponentPropsWithoutRef,
	type ComponentRef,
	forwardRef,
} from "react";
import { cn } from "@/lib/utils";

const Select = Root;

const SelectGroup = Group;

const SelectValue = Value;

const SelectTrigger = forwardRef<
	ComponentRef<typeof Trigger>,
	ComponentPropsWithoutRef<typeof Trigger>
>(({ className, children, ...props }, ref) => (
	<Trigger
		className={cn(
			"flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 text-sm shadow-xs",
			"placeholder:text-gray-500",
			"focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100",
			"disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
			"[&>span]:line-clamp-1",
			className
		)}
		ref={ref}
		{...props}
	>
		{children}
		<Icon asChild>
			<ChevronDown className="h-5 w-5 text-gray-500" />
		</Icon>
	</Trigger>
));
SelectTrigger.displayName = Trigger.displayName;

const SelectScrollUpButton = forwardRef<
	ComponentRef<typeof ScrollUpButton>,
	ComponentPropsWithoutRef<typeof ScrollUpButton>
>(({ className, ...props }, ref) => (
	<ScrollUpButton
		className={cn(
			"flex cursor-default items-center justify-center py-1",
			className
		)}
		ref={ref}
		{...props}
	>
		<ChevronUp className="h-4 w-4 text-gray-500" />
	</ScrollUpButton>
));
SelectScrollUpButton.displayName = ScrollUpButton.displayName;

const SelectScrollDownButton = forwardRef<
	ComponentRef<typeof ScrollDownButton>,
	ComponentPropsWithoutRef<typeof ScrollDownButton>
>(({ className, ...props }, ref) => (
	<ScrollDownButton
		className={cn(
			"flex cursor-default items-center justify-center py-1",
			className
		)}
		ref={ref}
		{...props}
	>
		<ChevronDown className="h-4 w-4 text-gray-500" />
	</ScrollDownButton>
));
SelectScrollDownButton.displayName = ScrollDownButton.displayName;

const SelectContent = forwardRef<
	ComponentRef<typeof Content>,
	ComponentPropsWithoutRef<typeof Content>
>(({ className, children, position = "popper", ...props }, ref) => (
	<Portal>
		<Content
			className={cn(
				"relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg",
				"data-[state=closed]:animate-out data-[state=open]:animate-in",
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
				"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
				"data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
				"data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				position === "popper" &&
					"data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
				className
			)}
			position={position}
			ref={ref}
			{...props}
		>
			<SelectScrollUpButton />
			<Viewport
				className={cn(
					"p-1",
					position === "popper" &&
						"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
				)}
			>
				{children}
			</Viewport>
			<SelectScrollDownButton />
		</Content>
	</Portal>
));
SelectContent.displayName = Content.displayName;

const SelectLabel = forwardRef<
	ComponentRef<typeof Label>,
	ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
	<Label
		className={cn("px-2 py-1.5 font-medium text-gray-500 text-xs", className)}
		ref={ref}
		{...props}
	/>
));
SelectLabel.displayName = Label.displayName;

const SelectItem = forwardRef<
	ComponentRef<typeof Item>,
	ComponentPropsWithoutRef<typeof Item>
>(({ className, children, ...props }, ref) => (
	<Item
		className={cn(
			"relative flex w-full cursor-pointer select-none items-center rounded-md py-2.5 pr-8 pl-2 text-gray-900 text-sm outline-none",
			"hover:bg-gray-50",
			"focus:bg-gray-50",
			"data-[disabled]:pointer-events-none data-[disabled]:text-gray-400",
			className
		)}
		ref={ref}
		{...props}
	>
		<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
			<ItemIndicator>
				<Check className="h-4 w-4 text-brand-600" />
			</ItemIndicator>
		</span>
		<ItemText>{children}</ItemText>
	</Item>
));
SelectItem.displayName = Item.displayName;

const SelectSeparator = forwardRef<
	ComponentRef<typeof Separator>,
	ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
	<Separator
		className={cn("-mx-1 my-1 h-px bg-gray-100", className)}
		ref={ref}
		{...props}
	/>
));
SelectSeparator.displayName = Separator.displayName;

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
};
