export function formatDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

export function formatDateTime(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatTime(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatWhatsApp(phone: string): string {
	const cleaned = phone.replace(/\D/g, "");
	if (cleaned.length === 13) {
		return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
	}
	if (cleaned.length === 11) {
		return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
	}
	return phone;
}

export function getWhatsAppLink(phone: string): string {
	const cleaned = phone.replace(/\D/g, "");
	return `https://wa.me/${cleaned}`;
}

export function formatCurrency(value: number): string {
	return value.toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
	});
}

export function formatDuration(minutes: number): string {
	if (minutes < 60) {
		return `${minutes} min`;
	}
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (mins === 0) {
		return `${hours}h`;
	}
	return `${hours}h ${mins}min`;
}

export function getRelativeTime(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) {
		return "Hoje";
	}
	if (diffDays === 1) {
		return "Ontem";
	}
	if (diffDays < 7) {
		return `${diffDays} dias atrás`;
	}
	if (diffDays < 30) {
		const weeks = Math.floor(diffDays / 7);
		return `${weeks} semana${weeks > 1 ? "s" : ""} atrás`;
	}
	if (diffDays < 365) {
		const months = Math.floor(diffDays / 30);
		return `${months} ${months > 1 ? "meses" : "mês"} atrás`;
	}
	const years = Math.floor(diffDays / 365);
	return `${years} ano${years > 1 ? "s" : ""} atrás`;
}

export function isOverdue(date: Date | string): boolean {
	const d = typeof date === "string" ? new Date(date) : date;
	return d < new Date();
}

export function isToday(date: Date | string): boolean {
	const d = typeof date === "string" ? new Date(date) : date;
	const today = new Date();
	return (
		d.getFullYear() === today.getFullYear() &&
		d.getMonth() === today.getMonth() &&
		d.getDate() === today.getDate()
	);
}
