export type AppointmentStatus = "OPEN" | "DONE" | "CANCELLED";

export type FieldType = "TEXT" | "NUMBER" | "DATE" | "SELECT" | "CHECKBOX";

export interface User {
	id: string;
	name: string;
	email: string;
	isActive: boolean;
	clientCount: number;
	pendingAppointments: number;
	createdAt: Date;
}

export interface Tag {
	id: string;
	name: string;
	color: string;
	clientCount: number;
	createdBy: string;
	createdAt: Date;
}

export interface ClientField {
	id: string;
	name: string;
	type: FieldType;
	required: boolean;
	isActive: boolean;
	order: number;
	options?: string[];
}

export interface ClientFieldValue {
	fieldId: string;
	fieldName: string;
	fieldType: FieldType;
	value: string | number | boolean | null;
}

export interface Client {
	id: string;
	whatsapp: string;
	notes: string | null;
	assignedUserId: string;
	assignedUserName: string;
	tags: Tag[];
	fieldValues: ClientFieldValue[];
	nextAppointmentDate: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface Appointment {
	id: string;
	clientId: string;
	clientName: string;
	clientWhatsapp: string;
	clientTags: Tag[];
	scheduledAt: Date;
	status: AppointmentStatus;
	lastOutcome: string | null;
	createdAt: Date;
}

export interface Interaction {
	id: string;
	appointmentId: string;
	clientId: string;
	userId: string;
	userName: string;
	summary: string;
	outcome: string;
	duration: number | null;
	clientSnapshot: {
		whatsapp: string;
		notes: string | null;
		tags: Tag[];
		fieldValues: ClientFieldValue[];
	};
	createdAt: Date;
}
