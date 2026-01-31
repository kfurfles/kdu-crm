import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
	label: string;
	href?: string;
	items?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
	{
		label: "Clientes",
		items: [
			{ label: "Lista de Clientes", href: "/clients" },
			{ label: "Novo Cliente", href: "/clients/new" },
		],
	},
	{
		label: "Atendimentos",
		items: [
			{ label: "Calendário", href: "/appointments/calendar" },
			{ label: "Lista do Dia", href: "/appointments/today" },
		],
	},
	{
		label: "Usuários",
		href: "/users",
	},
	{
		label: "Customizações",
		items: [
			{ label: "Campos", href: "/admin/fields" },
			{ label: "Tags", href: "/admin/tags" },
		],
	},
];

export function NavMenu() {
	return (
		<nav className="flex items-center gap-1">
			{navItems.map((item) => {
				if (item.href) {
					return (
						<Link
							className="rounded-md px-3 py-2 font-medium text-foreground/80 text-sm transition-colors hover:bg-accent hover:text-foreground"
							key={item.label}
							to={item.href}
						>
							{item.label}
						</Link>
					);
				}

				return (
					<DropdownMenu key={item.label}>
						<DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-3 py-2 font-medium text-foreground/80 text-sm outline-none transition-colors hover:bg-accent hover:text-foreground">
							{item.label}
							<ChevronDown className="h-4 w-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" sideOffset={8}>
							{item.items?.map((subItem) => (
								<DropdownMenuItem asChild key={subItem.href}>
									<Link to={subItem.href}>{subItem.label}</Link>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			})}
		</nav>
	);
}
