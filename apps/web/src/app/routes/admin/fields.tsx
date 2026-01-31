import { createFileRoute } from "@tanstack/react-router";
import { FieldsList } from "@/features/admin/components/fields-list";

export const Route = createFileRoute("/admin/fields")({
	component: AdminFieldsPage,
});

function AdminFieldsPage() {
	return <FieldsList />;
}
