import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	getClientName,
	mockClientFields,
	mockClients,
	mockTags,
	mockUsers,
} from "@/lib/mock-data";

interface ClientFormProps {
	clientId?: string;
}

export function ClientForm({ clientId }: ClientFormProps) {
	const navigate = useNavigate();
	const isEditing = !!clientId;

	const existingClient = clientId
		? mockClients.find((c) => c.id === clientId)
		: null;

	const [whatsapp, setWhatsapp] = useState(existingClient?.whatsapp || "");
	const [notes, setNotes] = useState(existingClient?.notes || "");
	const [assignedUserId, setAssignedUserId] = useState(
		existingClient?.assignedUserId || ""
	);
	const [selectedTags, setSelectedTags] = useState<string[]>(
		existingClient?.tags.map((t) => t.id) || []
	);
	const [fieldValues, setFieldValues] = useState<
		Record<string, string | boolean>
	>(() => {
		const values: Record<string, string | boolean> = {};
		if (existingClient) {
			for (const fv of existingClient.fieldValues) {
				values[fv.fieldId] =
					fv.fieldType === "CHECKBOX"
						? Boolean(fv.value)
						: String(fv.value ?? "");
			}
		}
		return values;
	});
	const [firstAppointment, setFirstAppointment] = useState("");

	const activeFields = mockClientFields.filter((f) => f.isActive);
	const activeUsers = mockUsers.filter((u) => u.isActive);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		toast.success(
			isEditing
				? "Cliente atualizado com sucesso"
				: "Cliente criado com sucesso"
		);
		navigate({ to: "/clients" });
	};

	const handleTagToggle = (tagId: string) => {
		setSelectedTags((prev) =>
			prev.includes(tagId)
				? prev.filter((id) => id !== tagId)
				: [...prev, tagId]
		);
	};

	const handleFieldChange = (fieldId: string, value: string | boolean) => {
		setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
	};

	return (
		<div className="flex flex-col gap-6 p-6">
			<PageHeader
				description={
					isEditing
						? `Editando ${existingClient ? getClientName(existingClient) : "cliente"}`
						: "Preencha os dados do novo cliente"
				}
				title={isEditing ? "Editar Cliente" : "Novo Cliente"}
			/>

			<form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
				<div className="rounded-lg border border-border bg-card p-6">
					<h2 className="mb-4 font-semibold">Dados Básicos</h2>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="whatsapp">
								WhatsApp <span className="text-error-600">*</span>
							</Label>
							<Input
								id="whatsapp"
								onChange={(e) => setWhatsapp(e.target.value)}
								placeholder="+55 11 99999-9999"
								required
								type="tel"
								value={whatsapp}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="notes">Notas</Label>
							<textarea
								className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
								id="notes"
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Observações sobre o cliente..."
								value={notes}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="assignedUser">Responsável</Label>
							<select
								className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
								id="assignedUser"
								onChange={(e) => setAssignedUserId(e.target.value)}
								value={assignedUserId}
							>
								<option value="">Selecione um responsável</option>
								{activeUsers.map((user) => (
									<option key={user.id} value={user.id}>
										{user.name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				<div className="rounded-lg border border-border bg-card p-6">
					<h2 className="mb-4 font-semibold">Campos Customizáveis</h2>
					<div className="space-y-4">
						{activeFields.map((field) => (
							<div className="space-y-2" key={field.id}>
								<Label htmlFor={field.id}>
									{field.name}
									{field.required && <span className="text-error-600"> *</span>}
								</Label>

								{field.type === "TEXT" && (
									<Input
										id={field.id}
										onChange={(e) =>
											handleFieldChange(field.id, e.target.value)
										}
										required={field.required}
										type="text"
										value={(fieldValues[field.id] as string) || ""}
									/>
								)}

								{field.type === "NUMBER" && (
									<Input
										id={field.id}
										onChange={(e) =>
											handleFieldChange(field.id, e.target.value)
										}
										required={field.required}
										type="number"
										value={(fieldValues[field.id] as string) || ""}
									/>
								)}

								{field.type === "DATE" && (
									<Input
										id={field.id}
										onChange={(e) =>
											handleFieldChange(field.id, e.target.value)
										}
										required={field.required}
										type="date"
										value={(fieldValues[field.id] as string) || ""}
									/>
								)}

								{field.type === "SELECT" && field.options && (
									<select
										className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
										id={field.id}
										onChange={(e) =>
											handleFieldChange(field.id, e.target.value)
										}
										required={field.required}
										value={(fieldValues[field.id] as string) || ""}
									>
										<option value="">Selecione...</option>
										{field.options.map((opt) => (
											<option key={opt} value={opt}>
												{opt}
											</option>
										))}
									</select>
								)}

								{field.type === "CHECKBOX" && (
									<div className="flex items-center gap-2">
										<Checkbox
											checked={Boolean(fieldValues[field.id])}
											id={field.id}
											onCheckedChange={(checked) =>
												handleFieldChange(field.id, Boolean(checked))
											}
										/>
										<Label className="font-normal" htmlFor={field.id}>
											Sim
										</Label>
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				<div className="rounded-lg border border-border bg-card p-6">
					<h2 className="mb-4 font-semibold">Tags</h2>
					<div className="flex flex-wrap gap-2">
						{mockTags.map((tag) => {
							const isSelected = selectedTags.includes(tag.id);
							return (
								<button
									className={`rounded-full border px-3 py-1 text-sm transition-colors ${
										isSelected
											? "border-brand-500 bg-brand-50 text-brand-700"
											: "border-border bg-background hover:bg-accent"
									}`}
									key={tag.id}
									onClick={() => handleTagToggle(tag.id)}
									type="button"
								>
									<span
										className="mr-1.5 inline-block h-2 w-2 rounded-full"
										style={{ backgroundColor: tag.color }}
									/>
									{tag.name}
								</button>
							);
						})}
					</div>
				</div>

				{!isEditing && (
					<div className="rounded-lg border border-border bg-card p-6">
						<h2 className="mb-4 font-semibold">Primeiro Atendimento</h2>
						<div className="space-y-2">
							<Label htmlFor="firstAppointment">
								Data e Hora <span className="text-error-600">*</span>
							</Label>
							<Input
								id="firstAppointment"
								onChange={(e) => setFirstAppointment(e.target.value)}
								required
								type="datetime-local"
								value={firstAppointment}
							/>
							<p className="text-muted-foreground text-sm">
								O primeiro atendimento será agendado automaticamente ao criar o
								cliente.
							</p>
						</div>
					</div>
				)}

				<div className="flex gap-3">
					<Button type="submit">
						{isEditing ? "Salvar Alterações" : "Criar Cliente"}
					</Button>
					<Button
						onClick={() => navigate({ to: "/clients" })}
						type="button"
						variant="outline"
					>
						Cancelar
					</Button>
				</div>
			</form>
		</div>
	);
}
