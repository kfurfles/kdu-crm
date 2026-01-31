import { Link } from "@tanstack/react-router";
import { Eye, MessageCircle, MoreHorizontal, Pencil } from "lucide-react";
import { TagBadge } from "@/components/tag-badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Client } from "@/types/common.types";
import {
	formatDateTime,
	formatWhatsApp,
	getWhatsAppLink,
} from "@/utils/format";

interface ClientCardProps {
	client: Client;
	clientName: string;
}

export function ClientCard({ client, clientName }: ClientCardProps) {
	return (
		<div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50">
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-3">
					<Link
						className="font-medium text-foreground hover:underline"
						params={{ id: client.id }}
						to="/clients/$id/edit"
					>
						{clientName}
					</Link>
					<span className="text-muted-foreground text-sm">
						{formatWhatsApp(client.whatsapp)}
					</span>
				</div>

				{client.tags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{client.tags.map((tag) => (
							<TagBadge color={tag.color} key={tag.id} name={tag.name} />
						))}
					</div>
				)}

				<div className="flex items-center gap-4 text-muted-foreground text-sm">
					<span>Responsável: {client.assignedUserName}</span>
					{client.nextAppointmentDate && (
						<span>
							Próximo atendimento: {formatDateTime(client.nextAppointmentDate)}
						</span>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Button asChild size="sm" variant="ghost">
					<a
						href={getWhatsAppLink(client.whatsapp)}
						rel="noopener noreferrer"
						target="_blank"
					>
						<MessageCircle className="h-4 w-4" />
					</a>
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="ghost">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Link params={{ id: client.id }} to="/clients/$id/edit">
								<Pencil className="mr-2 h-4 w-4" />
								Editar
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link params={{ id: client.id }} to="/clients/$id/history">
								<Eye className="mr-2 h-4 w-4" />
								Histórico
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
