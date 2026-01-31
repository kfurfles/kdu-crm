import { createFileRoute } from "@tanstack/react-router";
import { AppointmentList } from "@/features/appointments/components/appointment-list";

export const Route = createFileRoute("/appointments/today")({
	component: TodayAppointmentsPage,
});

function TodayAppointmentsPage() {
	return <AppointmentList />;
}
