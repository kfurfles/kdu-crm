import { Pencil, Plus, UserCheck, Users, UserX } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { mockUsers } from "@/lib/mock-data";
import type { User } from "@/types/common.types";
import { UserFormModal } from "./user-form-modal";

export function UserList() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);

	const activeUsers = mockUsers.filter((u) => u.isActive);
	const inactiveUsers = mockUsers.filter((u) => !u.isActive);

	const handleEdit = (user: User) => {
		setEditingUser(user);
		setIsModalOpen(true);
	};

	const handleNew = () => {
		setEditingUser(null);
		setIsModalOpen(true);
	};

	return (
		<div className="flex flex-col gap-6 p-6">
			<PageHeader
				actions={
					<Button onClick={handleNew}>
						<Plus className="mr-2 h-4 w-4" />
						Novo Usuário
					</Button>
				}
				description={`${activeUsers.length} usuário${activeUsers.length !== 1 ? "s" : ""} ativo${activeUsers.length !== 1 ? "s" : ""}`}
				title="Usuários"
			/>

			{mockUsers.length === 0 ? (
				<EmptyState
					action={
						<Button onClick={handleNew}>
							<Plus className="mr-2 h-4 w-4" />
							Novo Usuário
						</Button>
					}
					description="Comece cadastrando os usuários do sistema"
					icon={<Users className="h-12 w-12" />}
					title="Nenhum usuário cadastrado"
				/>
			) : (
				<div className="space-y-6">
					{activeUsers.length > 0 && (
						<section>
							<h2 className="mb-3 font-semibold">Ativos</h2>
							<div className="rounded-lg border border-border">
								<table className="w-full">
									<thead>
										<tr className="border-border border-b bg-muted/30">
											<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
												Nome
											</th>
											<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
												Email
											</th>
											<th className="px-4 py-3 text-center font-medium text-muted-foreground text-sm">
												Clientes
											</th>
											<th className="px-4 py-3 text-center font-medium text-muted-foreground text-sm">
												Pendentes
											</th>
											<th className="px-4 py-3 text-right font-medium text-muted-foreground text-sm">
												Ações
											</th>
										</tr>
									</thead>
									<tbody>
										{activeUsers.map((user) => (
											<tr
												className="border-border border-b last:border-b-0"
												key={user.id}
											>
												<td className="px-4 py-3 font-medium">{user.name}</td>
												<td className="px-4 py-3 text-muted-foreground">
													{user.email}
												</td>
												<td className="px-4 py-3 text-center">
													{user.clientCount}
												</td>
												<td className="px-4 py-3 text-center">
													{user.pendingAppointments}
												</td>
												<td className="px-4 py-3 text-right">
													<div className="flex items-center justify-end gap-1">
														<Button
															onClick={() => handleEdit(user)}
															size="sm"
															variant="ghost"
														>
															<Pencil className="h-4 w-4" />
														</Button>
														<Button
															className="text-error-600 hover:text-error-700"
															size="sm"
															variant="ghost"
														>
															<UserX className="h-4 w-4" />
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>
					)}

					{inactiveUsers.length > 0 && (
						<section>
							<h2 className="mb-3 font-semibold text-muted-foreground">
								Inativos
							</h2>
							<div className="rounded-lg border border-border">
								<table className="w-full">
									<thead>
										<tr className="border-border border-b bg-muted/30">
											<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
												Nome
											</th>
											<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
												Email
											</th>
											<th className="px-4 py-3 text-right font-medium text-muted-foreground text-sm">
												Ações
											</th>
										</tr>
									</thead>
									<tbody>
										{inactiveUsers.map((user) => (
											<tr
												className="border-border border-b opacity-60 last:border-b-0"
												key={user.id}
											>
												<td className="px-4 py-3 font-medium">{user.name}</td>
												<td className="px-4 py-3 text-muted-foreground">
													{user.email}
												</td>
												<td className="px-4 py-3 text-right">
													<Button
														className="text-brand-600 hover:text-brand-700"
														size="sm"
														variant="ghost"
													>
														<UserCheck className="h-4 w-4" />
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>
					)}
				</div>
			)}

			{isModalOpen && (
				<UserFormModal
					onClose={() => {
						setIsModalOpen(false);
						setEditingUser(null);
					}}
					user={editingUser}
				/>
			)}
		</div>
	);
}
