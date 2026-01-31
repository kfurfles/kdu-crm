import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						navigate({ to: "/dashboard" });
						toast.success("Login realizado com sucesso");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.string().email("Email inválido"),
				password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="flex min-h-full items-center justify-center px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Entrar</CardTitle>
					<CardDescription>
						Entre com suas credenciais para acessar o sistema
					</CardDescription>
				</CardHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<CardContent className="space-y-4">
						<form.Field name="email">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Email</Label>
									<Input
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="seu@email.com"
										type="email"
										value={field.state.value}
									/>
									{field.state.meta.errors.map((error) => (
										<p className="text-error-600 text-sm" key={error?.message}>
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<form.Field name="password">
							{(field) => (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label htmlFor={field.name}>Senha</Label>
										<Link
											className="text-brand-700 text-sm hover:text-brand-800"
											to="/reset-password"
										>
											Esqueceu a senha?
										</Link>
									</div>
									<Input
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Sua senha"
										type="password"
										value={field.state.value}
									/>
									{field.state.meta.errors.map((error) => (
										<p className="text-error-600 text-sm" key={error?.message}>
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</CardContent>
					<CardFooter className="flex flex-col gap-4">
						<form.Subscribe>
							{(state) => (
								<Button
									className="w-full"
									disabled={!state.canSubmit || state.isSubmitting}
									type="submit"
								>
									{state.isSubmitting ? "Entrando..." : "Entrar"}
								</Button>
							)}
						</form.Subscribe>
						<p className="text-muted-foreground text-sm">
							Não tem uma conta?{" "}
							<Link
								className="font-medium text-brand-700 hover:text-brand-800"
								to="/signup"
							>
								Criar conta
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
