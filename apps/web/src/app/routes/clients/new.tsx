import { createFileRoute } from "@tanstack/react-router";
import { ClientForm } from "@/features/clients/components/client-form";

export const Route = createFileRoute("/clients/new")({
	component: NewClientPage,
});

function NewClientPage() {
	return <ClientForm />;
}
