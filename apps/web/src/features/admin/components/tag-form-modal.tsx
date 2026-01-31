import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tag } from "@/types/common.types";

interface TagFormModalProps {
	tag: Tag | null;
	onClose: () => void;
}

const colorOptions = [
	"#8B5CF6",
	"#10B981",
	"#F59E0B",
	"#EF4444",
	"#3B82F6",
	"#06B6D4",
	"#EC4899",
	"#6B7280",
	"#84CC16",
	"#F97316",
];

export function TagFormModal({ tag, onClose }: TagFormModalProps) {
	const isEditing = !!tag;
	const [name, setName] = useState(tag?.name || "");
	const [color, setColor] = useState(tag?.color || colorOptions[0]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		toast.success(
			isEditing ? "Tag atualizada com sucesso" : "Tag criada com sucesso"
		);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-xl bg-background shadow-xl">
				<div className="flex items-center justify-between border-border border-b p-4">
					<h2 className="font-semibold text-lg">
						{isEditing ? "Editar Tag" : "Nova Tag"}
					</h2>
					<Button onClick={onClose} size="sm" variant="ghost">
						<X className="h-4 w-4" />
					</Button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 p-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nome</Label>
							<Input
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="Ex: VIP"
								required
								type="text"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<Label>Cor</Label>
							<div className="flex flex-wrap gap-2">
								{colorOptions.map((c) => (
									<button
										className={`h-8 w-8 rounded-full transition-all ${
											color === c
												? "ring-2 ring-brand-500 ring-offset-2"
												: "hover:scale-110"
										}`}
										key={c}
										onClick={() => setColor(c)}
										style={{ backgroundColor: c }}
										type="button"
									/>
								))}
							</div>
						</div>

						<div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
							<span className="text-muted-foreground text-sm">Preview:</span>
							<span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 text-xs">
								<span
									className="h-2 w-2 rounded-full"
									style={{ backgroundColor: color }}
								/>
								{name || "Nome da tag"}
							</span>
						</div>
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
