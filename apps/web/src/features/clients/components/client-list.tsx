import { Link } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getClientName, mockClients, mockTags } from "@/lib/mock-data";
import { ClientCard } from "./client-card";
import { ClientFilters } from "./client-filters";

export function ClientList() {
	const [search, setSearch] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const filteredClients = useMemo(() => {
		let result = [...mockClients];

		if (search) {
			const searchLower = search.toLowerCase();
			result = result.filter((client) => {
				const name = getClientName(client).toLowerCase();
				const company =
					client.fieldValues
						.find((f) => f.fieldName === "Empresa")
						?.value?.toString()
						.toLowerCase() || "";
				return name.includes(searchLower) || company.includes(searchLower);
			});
		}

		if (selectedTags.length > 0) {
			result = result.filter((client) =>
				client.tags.some((tag) => selectedTags.includes(tag.id))
			);
		}

		result.sort((a, b) => {
			if (!(a.nextAppointmentDate || b.nextAppointmentDate)) {
				return 0;
			}
			if (!a.nextAppointmentDate) {
				return 1;
			}
			if (!b.nextAppointmentDate) {
				return -1;
			}
			return (
				new Date(a.nextAppointmentDate).getTime() -
				new Date(b.nextAppointmentDate).getTime()
			);
		});

		return result;
	}, [search, selectedTags]);

	const paginatedClients = useMemo(() => {
		const start = (page - 1) * pageSize;
		return filteredClients.slice(start, start + pageSize);
	}, [filteredClients, page]);

	const totalPages = Math.ceil(filteredClients.length / pageSize);

	const handleTagToggle = (tagId: string) => {
		setSelectedTags((prev) =>
			prev.includes(tagId)
				? prev.filter((id) => id !== tagId)
				: [...prev, tagId]
		);
		setPage(1);
	};

	return (
		<div className="flex flex-col gap-6 p-6">
			<PageHeader
				actions={
					<Button asChild>
						<Link to="/clients/new">
							<Plus className="mr-2 h-4 w-4" />
							Novo Cliente
						</Link>
					</Button>
				}
				description={`${filteredClients.length} cliente${filteredClients.length !== 1 ? "s" : ""} encontrado${filteredClients.length !== 1 ? "s" : ""}`}
				title="Clientes"
			/>

			<ClientFilters
				availableTags={mockTags}
				onClearTags={() => {
					setSelectedTags([]);
					setPage(1);
				}}
				onSearchChange={(value) => {
					setSearch(value);
					setPage(1);
				}}
				onTagToggle={handleTagToggle}
				search={search}
				selectedTags={selectedTags}
			/>

			{paginatedClients.length === 0 ? (
				<EmptyState
					action={
						!search && selectedTags.length === 0 ? (
							<Button asChild>
								<Link to="/clients/new">
									<Plus className="mr-2 h-4 w-4" />
									Novo Cliente
								</Link>
							</Button>
						) : undefined
					}
					description={
						search || selectedTags.length > 0
							? "Tente ajustar os filtros de busca"
							: "Comece cadastrando seu primeiro cliente"
					}
					icon={<Users className="h-12 w-12" />}
					title="Nenhum cliente encontrado"
				/>
			) : (
				<>
					<div className="flex flex-col gap-3">
						{paginatedClients.map((client) => (
							<ClientCard
								client={client}
								clientName={getClientName(client)}
								key={client.id}
							/>
						))}
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2">
							<Button
								disabled={page === 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								size="sm"
								variant="outline"
							>
								Anterior
							</Button>
							<span className="text-muted-foreground text-sm">
								Página {page} de {totalPages}
							</span>
							<Button
								disabled={page === totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								size="sm"
								variant="outline"
							>
								Próxima
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
