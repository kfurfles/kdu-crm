import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="flex flex-col">
			<section className="flex flex-1 flex-col items-center justify-center px-4 py-20">
				<div className="max-w-2xl text-center">
					<h1 className="font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
						Gestão de Follow-up
					</h1>
					<p className="mt-4 text-lg text-muted-foreground">
						Sistema completo para gerenciar o relacionamento com seus clientes.
						Nunca mais perca um atendimento.
					</p>
					<div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<Button asChild size="lg">
							<Link to="/login">
								Entrar
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button asChild size="lg" variant="outline">
							<Link to="/signup">Criar conta</Link>
						</Button>
					</div>
				</div>
			</section>

			<section className="border-border border-t bg-muted/30 px-4 py-16">
				<div className="mx-auto max-w-4xl">
					<div className="grid gap-8 sm:grid-cols-3">
						<FeatureCard
							description="Organize sua carteira com campos personalizados e tags"
							icon={<Users className="h-6 w-6" />}
							title="Gestão de Clientes"
						/>
						<FeatureCard
							description="Visualize seus atendimentos em mês, semana ou dia"
							icon={<Calendar className="h-6 w-6" />}
							title="Calendário Inteligente"
						/>
						<FeatureCard
							description="Todo atendimento gera automaticamente um novo agendamento"
							icon={<CheckCircle className="h-6 w-6" />}
							title="Follow-up Garantido"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}

function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col items-center text-center">
			<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
				{icon}
			</div>
			<h3 className="mt-4 font-semibold text-foreground">{title}</h3>
			<p className="mt-2 text-muted-foreground text-sm">{description}</p>
		</div>
	);
}
