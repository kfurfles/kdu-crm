import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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

export const Route = createFileRoute("/reset-password")({
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitted(true);
	};

	if (submitted) {
		return (
			<div className="flex min-h-full items-center justify-center px-4 py-12">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Email enviado</CardTitle>
						<CardDescription>
							Se o email {email} estiver cadastrado, você receberá instruções
							para redefinir sua senha.
						</CardDescription>
					</CardHeader>
					<CardFooter className="justify-center">
						<Button asChild variant="outline">
							<Link to="/login">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Voltar para login
							</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-full items-center justify-center px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Recuperar senha</CardTitle>
					<CardDescription>
						Digite seu email e enviaremos instruções para redefinir sua senha
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
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
					</CardContent>
					<CardFooter className="flex flex-col gap-4">
						<Button className="w-full" type="submit">
							Enviar instruções
						</Button>
						<Link
							className="flex items-center text-muted-foreground text-sm hover:text-foreground"
							to="/login"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Voltar para login
						</Link>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
