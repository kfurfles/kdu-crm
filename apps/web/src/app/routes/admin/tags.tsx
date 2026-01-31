import { createFileRoute } from "@tanstack/react-router";
import { TagsList } from "@/features/admin/components/tags-list";

export const Route = createFileRoute("/admin/tags")({
	component: AdminTagsPage,
});

function AdminTagsPage() {
	return <TagsList />;
}
