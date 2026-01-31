import { createFileRoute } from "@tanstack/react-router";
import { ClientList } from "@/features/clients/components/client-list";

export const Route = createFileRoute("/clients/")({
	component: ClientsPage,
});

function ClientsPage() {
	return <ClientList />;
}
