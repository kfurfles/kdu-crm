import { Calendar as CalendarIcon, CheckCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getOverdueAppointments, mockAppointments } from "@/lib/mock-data";
import type { Appointment } from "@/types/common.types";
import { formatDate, isToday } from "@/utils/format";
import { AppointmentCard } from "./appointment-card";
import { AppointmentModal } from "./appointment-modal";

export function AppointmentList() {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedAppointment, setSelectedAppointment] =
		useState<Appointment | null>(null);

	const overdueAppointments = useMemo(() => getOverdueAppointments(), []);

	const todayAppointments = useMemo(() => {
		return mockAppointments
			.filter((apt) => {
				const aptDate = new Date(apt.scheduledAt);
				return (
					aptDate.getFullYear() === selectedDate.getFullYear() &&
					aptDate.getMonth() === selectedDate.getMonth() &&
					aptDate.getDate() === selectedDate.getDate()
				);
			})
			.sort(
				(a, b) =>
					new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
			);
	}, [selectedDate]);

	const _pendingCount = todayAppointments.filter(
		(a) => a.status === "OPEN"
	).length;
	const doneCount = todayAppointments.filter((a) => a.status === "DONE").length;
	const totalCount = todayAppointments.length;
	const progressPercent =
		totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

	const openAppointments = todayAppointments.filter((a) => a.status === "OPEN");
	const doneAppointments = todayAppointments.filter((a) => a.status === "DONE");
	const cancelledAppointments = todayAppointments.filter(
		(a) => a.status === "CANCELLED"
	);

	const showOverdue = isToday(selectedDate) && overdueAppointments.length > 0;

	return (
		<div className="flex flex-col gap-6 p-6">
			<PageHeader
				actions={
					<div className="flex items-center gap-3">
						<input
							className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
							onChange={(e) => setSelectedDate(new Date(e.target.value))}
							type="date"
							value={selectedDate.toISOString().split("T")[0]}
						/>
						<Button
							disabled={isToday(selectedDate)}
							onClick={() => setSelectedDate(new Date())}
							variant="outline"
						>
							Hoje
						</Button>
					</div>
				}
				description={formatDate(selectedDate)}
				title="Atendimentos do Dia"
			/>

			{totalCount > 0 && (
				<div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
					<div className="flex items-center gap-2">
						<CheckCircle className="h-5 w-5 text-brand-600" />
						<span className="font-medium">
							{doneCount} de {totalCount} concluídos
						</span>
					</div>
					<div className="flex-1">
						<div className="h-2 rounded-full bg-muted">
							<div
								className="h-2 rounded-full bg-brand-600 transition-all"
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
					</div>
					<span className="text-muted-foreground text-sm">
						{progressPercent}%
					</span>
				</div>
			)}

			{showOverdue && (
				<section>
					<h2 className="mb-3 flex items-center gap-2 font-semibold text-error-700">
						<span className="flex h-2 w-2 rounded-full bg-error-500" />
						Atrasados ({overdueAppointments.length})
					</h2>
					<div className="space-y-2">
						{overdueAppointments.map((apt) => (
							<AppointmentCard
								appointment={apt}
								key={apt.id}
								onClick={() => setSelectedAppointment(apt)}
							/>
						))}
					</div>
				</section>
			)}

			{openAppointments.length > 0 && (
				<section>
					<h2 className="mb-3 font-semibold">
						Pendentes ({openAppointments.length})
					</h2>
					<div className="space-y-2">
						{openAppointments.map((apt) => (
							<AppointmentCard
								appointment={apt}
								key={apt.id}
								onClick={() => setSelectedAppointment(apt)}
							/>
						))}
					</div>
				</section>
			)}

			{doneAppointments.length > 0 && (
				<section>
					<h2 className="mb-3 font-semibold text-muted-foreground">
						Concluídos ({doneAppointments.length})
					</h2>
					<div className="space-y-2">
						{doneAppointments.map((apt) => (
							<AppointmentCard
								appointment={apt}
								key={apt.id}
								onClick={() => setSelectedAppointment(apt)}
							/>
						))}
					</div>
				</section>
			)}

			{cancelledAppointments.length > 0 && (
				<section>
					<h2 className="mb-3 font-semibold text-muted-foreground">
						Cancelados ({cancelledAppointments.length})
					</h2>
					<div className="space-y-2">
						{cancelledAppointments.map((apt) => (
							<AppointmentCard
								appointment={apt}
								key={apt.id}
								onClick={() => setSelectedAppointment(apt)}
							/>
						))}
					</div>
				</section>
			)}

			{todayAppointments.length === 0 && !showOverdue && (
				<EmptyState
					description={`Não há atendimentos agendados para ${formatDate(selectedDate)}`}
					icon={<CalendarIcon className="h-12 w-12" />}
					title="Nenhum atendimento"
				/>
			)}

			{selectedAppointment && (
				<AppointmentModal
					appointment={selectedAppointment}
					onClose={() => setSelectedAppointment(null)}
				/>
			)}
		</div>
	);
}
