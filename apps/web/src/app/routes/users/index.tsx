import { createFileRoute } from "@tanstack/react-router";
import { UserList } from "@/features/users/components/user-list";

export const Route = createFileRoute("/users/")({
	component: UsersPage,
});

function UsersPage() {
	return <UserList />;
}
