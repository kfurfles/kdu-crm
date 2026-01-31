import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientField, FieldType } from "@/types/common.types";

interface FieldFormModalProps {
	field: ClientField | null;
	onClose: () => void;
}

const fieldTypes: { value: FieldType; label: string }[] = [
	{ value: "TEXT", label: "Texto" },
	{ value: "NUMBER", label: "Número" },
	{ value: "DATE", label: "Data" },
	{ value: "SELECT", label: "Seleção" },
	{ value: "CHECKBOX", label: "Checkbox" },
];

export function FieldFormModal({ field, onClose }: FieldFormModalProps) {
	const isEditing = !!field;
	const [name, setName] = useState(field?.name || "");
	const [type, setType] = useState<FieldType>(field?.type || "TEXT");
	const [required, setRequired] = useState(field?.required);
	const [options, setOptions] = useState<string[]>(field?.options || []);
	const [newOption, setNewOption] = useState("");

	const handleAddOption = () => {
		if (newOption.trim() && !options.includes(newOption.trim())) {
			setOptions([...options, newOption.trim()]);
			setNewOption("");
		}
	};

	const handleRemoveOption = (option: string) => {
		setOptions(options.filter((o) => o !== option));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		toast.success(
			isEditing ? "Campo atualizado com sucesso" : "Campo criado com sucesso"
		);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-xl bg-background shadow-xl">
				<div className="flex items-center justify-between border-border border-b p-4">
					<h2 className="font-semibold text-lg">
						{isEditing ? "Editar Campo" : "Novo Campo"}
					</h2>
					<Button onClick={onClose} size="sm" variant="ghost">
						<X className="h-4 w-4" />
					</Button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 p-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nome do Campo</Label>
							<Input
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="Ex: Nome Completo"
								required
								type="text"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="type">Tipo</Label>
							<select
								className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:opacity-50"
								disabled={isEditing}
								id="type"
								onChange={(e) => setType(e.target.value as FieldType)}
								value={type}
							>
								{fieldTypes.map((t) => (
									<option key={t.value} value={t.value}>
										{t.label}
									</option>
								))}
							</select>
							{isEditing && (
								<p className="text-muted-foreground text-xs">
									O tipo não pode ser alterado após a criação
								</p>
							)}
						</div>

						<div className="flex items-center gap-2">
							<Checkbox
								checked={required}
								id="required"
								onCheckedChange={(checked) => setRequired(Boolean(checked))}
							/>
							<Label className="font-normal" htmlFor="required">
								Campo obrigatório
							</Label>
						</div>

						{type === "SELECT" && (
							<div className="space-y-2">
								<Label>Opções</Label>
								<div className="flex gap-2">
									<Input
										onChange={(e) => setNewOption(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddOption();
											}
										}}
										placeholder="Nova opção"
										type="text"
										value={newOption}
									/>
									<Button
										onClick={handleAddOption}
										type="button"
										variant="outline"
									>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
								{options.length > 0 && (
									<div className="space-y-1">
										{options.map((option) => (
											<div
												className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
												key={option}
											>
												<span>{option}</span>
												<button
													className="text-muted-foreground hover:text-error-600"
													onClick={() => handleRemoveOption(option)}
													type="button"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					<div className="flex justify-end gap-2 border-border border-t p-4">
						<Button onClick={onClose} type="button" variant="outline">
							Cancelar
						</Button>
						<Button type="submit">{isEditing ? "Salvar" : "Criar"}</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
