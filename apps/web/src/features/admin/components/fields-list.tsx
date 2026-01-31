import {
	GripVertical,
	Pencil,
	Plus,
	Settings,
	ToggleLeft,
	ToggleRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { mockClientFields } from "@/lib/mock-data";
import type { ClientField, FieldType } from "@/types/common.types";
import { FieldFormModal } from "./field-form-modal";

const fieldTypeLabels: Record<FieldType, string> = {
	TEXT: "Texto",
	NUMBER: "Número",
	DATE: "Data",
	SELECT: "Seleção",
	CHECKBOX: "Checkbox",
};

export function FieldsList() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingField, setEditingField] = useState<ClientField | null>(null);

	const activeFields = mockClientFields
		.filter((f) => f.isActive)
		.sort((a, b) => a.order - b.order);
	const inactiveFields = mockClientFields.filter((f) => !f.isActive);

	const handleEdit = (field: ClientField) => {
		setEditingField(field);
		setIsModalOpen(true);
	};

	const handleNew = () => {
		setEditingField(null);
		setIsModalOpen(true);
	};

	return (
		<div className="flex flex-col gap-6 p-6">
			<PageHeader
				actions={
					<Button onClick={handleNew}>
						<Plus className="mr-2 h-4 w-4" />
						Novo Campo
					</Button>
				}
				description="Configure os campos que serão exibidos no cadastro de clientes"
				title="Campos Customizáveis"
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<div>
					<h2 className="mb-3 font-semibold">Campos Ativos</h2>
					{activeFields.length === 0 ? (
						<EmptyState
							action={
								<Button onClick={handleNew}>
									<Plus className="mr-2 h-4 w-4" />
									Novo Campo
								</Button>
							}
							description="Adicione campos para personalizar o cadastro de clientes"
							icon={<Settings className="h-12 w-12" />}
							title="Nenhum campo ativo"
						/>
					) : (
						<div className="space-y-2">
							{activeFields.map((field) => (
								<div
									className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
									key={field.id}
								>
									<button
										className="cursor-grab text-muted-foreground hover:text-foreground"
										type="button"
									>
										<GripVertical className="h-4 w-4" />
									</button>
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<span className="font-medium">{field.name}</span>
											{field.required && (
												<span className="text-error-600 text-xs">
													Obrigatório
												</span>
											)}
										</div>
										<div className="flex items-center gap-2 text-muted-foreground text-sm">
											<span>{fieldTypeLabels[field.type]}</span>
											{field.type === "SELECT" && field.options && (
												<span>({field.options.length} opções)</span>
											)}
										</div>
									</div>
									<div className="flex items-center gap-1">
										<Button
											onClick={() => handleEdit(field)}
											size="sm"
											variant="ghost"
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											className="text-error-600 hover:text-error-700"
											onClick={() => toast.success("Campo desativado")}
											size="sm"
											variant="ghost"
										>
											<ToggleRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}

					{inactiveFields.length > 0 && (
						<div className="mt-6">
							<h2 className="mb-3 font-semibold text-muted-foreground">
								Campos Inativos
							</h2>
							<div className="space-y-2">
								{inactiveFields.map((field) => (
									<div
										className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 opacity-60"
										key={field.id}
									>
										<div className="flex-1">
											<span className="font-medium">{field.name}</span>
											<p className="text-muted-foreground text-sm">
												{fieldTypeLabels[field.type]}
											</p>
										</div>
										<Button
											className="text-brand-600 hover:text-brand-700"
											onClick={() => toast.success("Campo reativado")}
											size="sm"
											variant="ghost"
										>
											<ToggleLeft className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<div>
					<h2 className="mb-3 font-semibold">Preview do Formulário</h2>
					<div className="rounded-lg border border-border bg-card p-6">
						<div className="space-y-4">
							{activeFields.map((field) => (
								<div className="space-y-2" key={field.id}>
									<label
										className="font-medium text-sm"
										htmlFor={`preview-${field.id}`}
									>
										{field.name}
										{field.required && (
											<span className="text-error-600"> *</span>
										)}
									</label>
									{field.type === "TEXT" && (
										<input
											className="h-10 w-full rounded-lg border border-input bg-muted/30 px-3 text-sm"
											disabled
											id={`preview-${field.id}`}
											placeholder={`Digite ${field.name.toLowerCase()}...`}
											type="text"
										/>
									)}
									{field.type === "NUMBER" && (
										<input
											className="h-10 w-full rounded-lg border border-input bg-muted/30 px-3 text-sm"
											disabled
											id={`preview-${field.id}`}
											placeholder="0"
											type="number"
										/>
									)}
									{field.type === "DATE" && (
										<input
											className="h-10 w-full rounded-lg border border-input bg-muted/30 px-3 text-sm"
											disabled
											id={`preview-${field.id}`}
											type="date"
										/>
									)}
									{field.type === "SELECT" && (
										<select
											className="h-10 w-full rounded-lg border border-input bg-muted/30 px-3 text-sm"
											disabled
											id={`preview-${field.id}`}
										>
											<option>Selecione...</option>
											{field.options?.map((opt) => (
												<option key={opt}>{opt}</option>
											))}
										</select>
									)}
									{field.type === "CHECKBOX" && (
										<div className="flex items-center gap-2">
											<input
												className="h-4 w-4 rounded border-input"
												disabled
												id={`preview-${field.id}`}
												type="checkbox"
											/>
											<span className="text-sm">Sim</span>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{isModalOpen && (
				<FieldFormModal
					field={editingField}
					onClose={() => {
						setIsModalOpen(false);
						setEditingField(null);
					}}
				/>
			)}
		</div>
	);
}
