import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/signup")({
	component: SignupPage,
});

function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
	};

	return (
		<div className="flex min-h-full items-center justify-center px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Criar conta</CardTitle>
					<CardDescription>
						Preencha os dados abaixo para criar sua conta
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nome</Label>
							<Input
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="Seu nome completo"
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
								placeholder="seu@email.com"
								required
								type="email"
								value={email}
							/>
						</div>
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
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirmar senha</Label>
							<Input
								id="confirmPassword"
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Repita sua senha"
								required
								type="password"
								value={confirmPassword}
							/>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col gap-4">
						<Button className="w-full" type="submit">
							Criar conta
						</Button>
						<p className="text-muted-foreground text-sm">
							Já tem uma conta?{" "}
							<Link
								className="font-medium text-brand-700 hover:text-brand-800"
								to="/login"
							>
								Entrar
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
