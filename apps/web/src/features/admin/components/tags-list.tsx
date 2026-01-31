import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { mockTags } from "@/lib/mock-data";
import type { Tag as TagType } from "@/types/common.types";
import { formatDate } from "@/utils/format";
import { TagFormModal } from "./tag-form-modal";

export function TagsList() {
	const [search, setSearch] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingTag, setEditingTag] = useState<TagType | null>(null);
	const [deletingTag, setDeletingTag] = useState<TagType | null>(null);

	const filteredTags = mockTags.filter((tag) =>
		tag.name.toLowerCase().includes(search.toLowerCase())
	);

	const handleEdit = (tag: TagType) => {
		setEditingTag(tag);
		setIsModalOpen(true);
	};

	const handleNew = () => {
		setEditingTag(null);
		setIsModalOpen(true);
	};

	const handleDelete = () => {
		if (deletingTag) {
			toast.success(`Tag "${deletingTag.name}" removida`);
			setDeletingTag(null);
		}
	};

	return (
		<div className="flex flex-col gap-6 p-6">
			<PageHeader
				actions={
					<Button onClick={handleNew}>
						<Plus className="mr-2 h-4 w-4" />
						Nova Tag
					</Button>
				}
				description={`${mockTags.length} tag${mockTags.length !== 1 ? "s" : ""} cadastrada${mockTags.length !== 1 ? "s" : ""}`}
				title="Gestão de Tags"
			/>

			<SearchInput
				className="max-w-sm"
				onChange={setSearch}
				placeholder="Buscar tags..."
				value={search}
			/>

			{filteredTags.length === 0 ? (
				<EmptyState
					action={
						search ? undefined : (
							<Button onClick={handleNew}>
								<Plus className="mr-2 h-4 w-4" />
								Nova Tag
							</Button>
						)
					}
					description={
						search
							? "Tente ajustar a busca"
							: "Crie tags para categorizar seus clientes"
					}
					icon={<Tag className="h-12 w-12" />}
					title={search ? "Nenhuma tag encontrada" : "Nenhuma tag cadastrada"}
				/>
			) : (
				<div className="rounded-lg border border-border">
					<table className="w-full">
						<thead>
							<tr className="border-border border-b bg-muted/30">
								<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
									Tag
								</th>
								<th className="px-4 py-3 text-center font-medium text-muted-foreground text-sm">
									Clientes
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
									Criado por
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
									Data
								</th>
								<th className="px-4 py-3 text-right font-medium text-muted-foreground text-sm">
									Ações
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredTags.map((tag) => (
								<tr
									className="border-border border-b last:border-b-0"
									key={tag.id}
								>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<span
												className="h-3 w-3 rounded-full"
												style={{ backgroundColor: tag.color }}
											/>
											<span className="font-medium">{tag.name}</span>
										</div>
									</td>
									<td className="px-4 py-3 text-center">{tag.clientCount}</td>
									<td className="px-4 py-3 text-muted-foreground">
										{tag.createdBy}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{formatDate(tag.createdAt)}
									</td>
									<td className="px-4 py-3 text-right">
										<div className="flex items-center justify-end gap-1">
											<Button
												onClick={() => handleEdit(tag)}
												size="sm"
												variant="ghost"
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												className="text-error-600 hover:text-error-700"
												onClick={() => setDeletingTag(tag)}
												size="sm"
												variant="ghost"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{isModalOpen && (
				<TagFormModal
					onClose={() => {
						setIsModalOpen(false);
						setEditingTag(null);
					}}
					tag={editingTag}
				/>
			)}

			{deletingTag && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-xl bg-background shadow-xl">
						<div className="p-6">
							<h2 className="font-semibold text-lg">Remover Tag</h2>
							<p className="mt-2 text-muted-foreground">
								Tem certeza que deseja remover a tag "{deletingTag.name}"?
							</p>
							{deletingTag.clientCount > 0 && (
								<p className="mt-2 text-sm text-warning-600">
									Esta tag está associada a {deletingTag.clientCount} cliente
									{deletingTag.clientCount !== 1 ? "s" : ""}. Ao remover, a tag
									será desvinculada desses clientes.
								</p>
							)}
						</div>
						<div className="flex justify-end gap-2 border-border border-t p-4">
							<Button onClick={() => setDeletingTag(null)} variant="outline">
								Cancelar
							</Button>
							<Button onClick={handleDelete} variant="destructive">
								Remover
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
