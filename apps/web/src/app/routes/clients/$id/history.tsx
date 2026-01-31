import { createFileRoute } from "@tanstack/react-router";
import { ClientHistory } from "@/features/clients/components/client-history";

export const Route = createFileRoute("/clients/$id/history")({
	component: ClientHistoryPage,
});

function ClientHistoryPage() {
	const { id } = Route.useParams();
	return <ClientHistory clientId={id} />;
}
