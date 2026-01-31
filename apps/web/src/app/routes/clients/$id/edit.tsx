import { createFileRoute } from "@tanstack/react-router";
import { ClientForm } from "@/features/clients/components/client-form";

export const Route = createFileRoute("/clients/$id/edit")({
	component: EditClientPage,
});

function EditClientPage() {
	const { id } = Route.useParams();
	return <ClientForm clientId={id} />;
}
