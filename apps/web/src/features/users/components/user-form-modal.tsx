import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/types/common.types";

interface UserFormModalProps {
	user: User | null;
	onClose: () => void;
}

export function UserFormModal({ user, onClose }: UserFormModalProps) {
	const isEditing = !!user;
	const [name, setName] = useState(user?.name || "");
	const [email, setEmail] = useState(user?.email || "");
	const [password, setPassword] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		toast.success(
			isEditing
				? "Usuário atualizado com sucesso"
				: "Usuário criado com sucesso"
		);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-xl bg-background shadow-xl">
				<div className="flex items-center justify-between border-border border-b p-4">
					<h2 className="font-semibold text-lg">
						{isEditing ? "Editar Usuário" : "Novo Usuário"}
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
								required
								type="text"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								onChange={(e) => setEmail(e.target.value)}
								required
								type="email"
								value={email}
							/>
						</div>

						{!isEditing && (
							<div className="space-y-2">
								<Label htmlFor="password">Senha</Label>
								<Input
									id="password"
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Mínimo 8 caracteres"
									required
									type="password"
									value={password}
								/>
							</div>
						)}

						{isEditing && (
							<div className="space-y-2">
								<Label htmlFor="newPassword">Nova Senha (opcional)</Label>
								<Input
									id="newPassword"
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Deixe em branco para manter a atual"
									type="password"
									value={password}
								/>
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
