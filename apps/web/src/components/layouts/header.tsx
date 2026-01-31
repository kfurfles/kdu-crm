import { Link } from "@tanstack/react-router";
import UserMenu from "../user-menu";
import { NavMenu } from "./nav-menu";

export function Header() {
	return (
		<header className="border-border border-b bg-background">
			<div className="flex h-14 items-center justify-between px-4">
				<div className="flex items-center gap-6">
					<Link
						className="font-semibold text-foreground text-lg transition-colors hover:text-foreground/80"
						to="/"
					>
						CRM
					</Link>
					<NavMenu />
				</div>
				<UserMenu />
			</div>
		</header>
	);
}
