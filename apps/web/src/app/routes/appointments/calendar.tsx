import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "@/features/appointments/components/calendar-view";

export const Route = createFileRoute("/appointments/calendar")({
	component: CalendarPage,
});

function CalendarPage() {
	return <CalendarView />;
}
