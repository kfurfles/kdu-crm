import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { getAppointmentsByDate } from "@/lib/mock-data";
import type { Appointment, AppointmentStatus } from "@/types/common.types";
import { formatDate, formatTime, isOverdue, isToday } from "@/utils/format";
import { AppointmentModal } from "./appointment-modal";

type ViewMode = "month" | "week" | "day";

const viewModeLabels: Record<ViewMode, string> = {
	month: "Mês",
	week: "Semana",
	day: "Dia",
};

function getStatusClass(status: AppointmentStatus): string {
	if (status === "OPEN") {
		return "bg-brand-100 text-brand-800";
	}
	if (status === "DONE") {
		return "bg-gray-100 text-gray-600";
	}
	return "bg-error-100 text-error-800";
}

function getDayButtonClass(
	isTodayDate: boolean,
	isCurrentMonth: boolean
): string {
	if (isTodayDate) {
		return "bg-brand-700 text-white";
	}
	if (isCurrentMonth) {
		return "hover:bg-accent";
	}
	return "text-muted-foreground";
}

export function CalendarView() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [viewMode, setViewMode] = useState<ViewMode>("week");
	const [selectedAppointment, setSelectedAppointment] =
		useState<Appointment | null>(null);

	const goToToday = () => setCurrentDate(new Date());

	const navigate = (direction: "prev" | "next") => {
		const newDate = new Date(currentDate);
		if (viewMode === "month") {
			newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
		} else if (viewMode === "week") {
			newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
		} else {
			newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
		}
		setCurrentDate(newDate);
	};

	return (
		<div className="flex flex-col gap-6 p-6">
			<PageHeader
				actions={
					<div className="flex items-center gap-2">
						<div className="flex rounded-lg border border-border">
							{(["month", "week", "day"] as ViewMode[]).map((mode) => (
								<button
									className={`px-3 py-1.5 font-medium text-sm transition-colors ${
										viewMode === mode
											? "bg-brand-700 text-white"
											: "text-foreground hover:bg-accent"
									} ${mode === "month" ? "rounded-l-md" : ""} ${mode === "day" ? "rounded-r-md" : ""}`}
									key={mode}
									onClick={() => setViewMode(mode)}
									type="button"
								>
									{viewModeLabels[mode]}
								</button>
							))}
						</div>
					</div>
				}
				title="Calendário de Atendimentos"
			/>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button onClick={() => navigate("prev")} size="sm" variant="outline">
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button onClick={() => navigate("next")} size="sm" variant="outline">
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button onClick={goToToday} size="sm" variant="outline">
						Hoje
					</Button>
				</div>
				<h2 className="font-semibold text-lg">
					{viewMode === "month" &&
						currentDate.toLocaleDateString("pt-BR", {
							month: "long",
							year: "numeric",
						})}
					{viewMode === "week" && getWeekRange(currentDate)}
					{viewMode === "day" && formatDate(currentDate)}
				</h2>
				<div className="flex gap-4 text-sm">
					<div className="flex items-center gap-1">
						<span className="h-3 w-3 rounded-full bg-brand-500" />
						Aberto
					</div>
					<div className="flex items-center gap-1">
						<span className="h-3 w-3 rounded-full bg-gray-400" />
						Concluído
					</div>
					<div className="flex items-center gap-1">
						<span className="h-3 w-3 rounded-full bg-error-500" />
						Cancelado
					</div>
				</div>
			</div>

			{viewMode === "month" && (
				<MonthView
					currentDate={currentDate}
					onSelectAppointment={setSelectedAppointment}
					onSelectDate={(date) => {
						setCurrentDate(date);
						setViewMode("day");
					}}
				/>
			)}

			{viewMode === "week" && (
				<WeekView
					currentDate={currentDate}
					onSelectAppointment={setSelectedAppointment}
				/>
			)}

			{viewMode === "day" && (
				<DayView
					currentDate={currentDate}
					onSelectAppointment={setSelectedAppointment}
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

function MonthView({
	currentDate,
	onSelectAppointment,
	onSelectDate,
}: {
	currentDate: Date;
	onSelectAppointment: (apt: Appointment) => void;
	onSelectDate: (date: Date) => void;
}) {
	const days = useMemo(() => getMonthDays(currentDate), [currentDate]);

	return (
		<div className="rounded-lg border border-border">
			<div className="grid grid-cols-7 border-border border-b">
				{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
					<div
						className="p-2 text-center font-medium text-muted-foreground text-sm"
						key={day}
					>
						{day}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7">
				{days.map((day) => {
					const appointments = getAppointmentsByDate(day.date);
					const isCurrentMonth = day.date.getMonth() === currentDate.getMonth();
					const isTodayDate = isToday(day.date);
					const dateKey = day.date.toISOString();

					return (
						<div
							className={`min-h-[100px] border-border border-r border-b p-2 ${
								isCurrentMonth ? "" : "bg-muted/30"
							} ${isTodayDate ? "bg-brand-50" : ""}`}
							key={dateKey}
						>
							<button
								className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${getDayButtonClass(isTodayDate, isCurrentMonth)}`}
								onClick={() => onSelectDate(day.date)}
								type="button"
							>
								{day.date.getDate()}
							</button>
							{appointments.slice(0, 3).map((apt) => (
								<button
									className={`mb-1 w-full truncate rounded px-1 py-0.5 text-left text-xs ${getStatusClass(apt.status)}`}
									key={apt.id}
									onClick={() => onSelectAppointment(apt)}
									type="button"
								>
									{formatTime(apt.scheduledAt)} {apt.clientName.split(" ")[0]}
								</button>
							))}
							{appointments.length > 3 && (
								<button
									className="text-muted-foreground text-xs hover:text-foreground"
									onClick={() => onSelectDate(day.date)}
									type="button"
								>
									+{appointments.length - 3} mais
								</button>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function WeekView({
	currentDate,
	onSelectAppointment,
}: {
	currentDate: Date;
	onSelectAppointment: (apt: Appointment) => void;
}) {
	const days = useMemo(() => getWeekDays(currentDate), [currentDate]);
	const hours = Array.from({ length: 12 }, (_, i) => i + 8);

	return (
		<div className="overflow-auto rounded-lg border border-border">
			<div className="sticky top-0 z-10 grid grid-cols-8 border-border border-b bg-background">
				<div className="p-2" />
				{days.map((day) => {
					const isTodayDate = isToday(day);
					return (
						<div
							className={`p-2 text-center ${isTodayDate ? "bg-brand-50" : ""}`}
							key={day.toISOString()}
						>
							<div className="font-medium text-sm">
								{day.toLocaleDateString("pt-BR", { weekday: "short" })}
							</div>
							<div
								className={`text-lg ${isTodayDate ? "font-semibold text-brand-700" : ""}`}
							>
								{day.getDate()}
							</div>
						</div>
					);
				})}
			</div>
			<div className="grid grid-cols-8">
				{hours.map((hour) => (
					<div className="contents" key={hour}>
						<div className="border-border border-r border-b p-2 text-right text-muted-foreground text-sm">
							{hour}:00
						</div>
						{days.map((day) => {
							const appointments = getAppointmentsByDate(day).filter((apt) => {
								const aptHour = new Date(apt.scheduledAt).getHours();
								return aptHour === hour;
							});
							return (
								<div
									className="relative min-h-[60px] border-border border-r border-b p-1"
									key={`${day.toISOString()}-${hour}`}
								>
									{appointments.map((apt) => (
										<button
											className={`mb-1 w-full cursor-pointer truncate rounded px-1 py-0.5 text-left text-xs ${getStatusClass(apt.status)}`}
											key={apt.id}
											onClick={() => onSelectAppointment(apt)}
											type="button"
										>
											{formatTime(apt.scheduledAt)} {apt.clientName}
										</button>
									))}
								</div>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}

function DayView({
	currentDate,
	onSelectAppointment,
}: {
	currentDate: Date;
	onSelectAppointment: (apt: Appointment) => void;
}) {
	const appointments = useMemo(
		() =>
			getAppointmentsByDate(currentDate).sort(
				(a, b) =>
					new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
			),
		[currentDate]
	);
	const hours = Array.from({ length: 12 }, (_, i) => i + 8);

	return (
		<div className="rounded-lg border border-border">
			{hours.map((hour) => {
				const hourAppointments = appointments.filter((apt) => {
					const aptHour = new Date(apt.scheduledAt).getHours();
					return aptHour === hour;
				});

				return (
					<div
						className="flex border-border border-b last:border-b-0"
						key={hour}
					>
						<div className="w-20 shrink-0 border-border border-r p-3 text-right text-muted-foreground text-sm">
							{hour}:00
						</div>
						<div className="min-h-[80px] flex-1 space-y-2 p-2">
							{hourAppointments.map((apt) => {
								const isLate =
									apt.status === "OPEN" && isOverdue(apt.scheduledAt);
								return (
									<button
										className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 ${
											isLate ? "border-error-300 bg-error-50" : "border-border"
										}`}
										key={apt.id}
										onClick={() => onSelectAppointment(apt)}
										type="button"
									>
										<div>
											<div className="flex items-center gap-2">
												<span className="font-medium">
													{formatTime(apt.scheduledAt)}
												</span>
												<span>{apt.clientName}</span>
												<StatusBadge status={apt.status} />
												{isLate && (
													<span className="font-medium text-error-600 text-xs">
														ATRASADO
													</span>
												)}
											</div>
											{apt.lastOutcome && (
												<p className="mt-1 text-muted-foreground text-sm">
													{apt.lastOutcome}
												</p>
											)}
										</div>
									</button>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function getMonthDays(date: Date) {
	const year = date.getFullYear();
	const month = date.getMonth();
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const startDay = firstDay.getDay();
	const days: { date: Date }[] = [];

	for (let i = startDay - 1; i >= 0; i--) {
		const d = new Date(year, month, -i);
		days.push({ date: d });
	}

	for (let i = 1; i <= lastDay.getDate(); i++) {
		days.push({ date: new Date(year, month, i) });
	}

	const remaining = 42 - days.length;
	for (let i = 1; i <= remaining; i++) {
		days.push({ date: new Date(year, month + 1, i) });
	}

	return days;
}

function getWeekDays(date: Date) {
	const day = date.getDay();
	const diff = date.getDate() - day;
	const days: Date[] = [];
	for (let i = 0; i < 7; i++) {
		days.push(new Date(date.getFullYear(), date.getMonth(), diff + i));
	}
	return days;
}

function getWeekRange(date: Date) {
	const days = getWeekDays(date);
	const first = days[0];
	const last = days[6];
	if (first.getMonth() === last.getMonth()) {
		return `${first.getDate()} - ${last.getDate()} de ${first.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
	}
	return `${first.getDate()} ${first.toLocaleDateString("pt-BR", { month: "short" })} - ${last.getDate()} ${last.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
}
