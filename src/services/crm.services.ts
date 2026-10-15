import api from './api'

export interface PartySummary {
	id: number
	displayName: string | null
}

export interface UserSummary {
	id: number
	firstName: string | null
	lastName: string | null
	username: string | null
}

export interface ProductSummary {
	id: number
	name: string | null
	code: string | null
}

export interface Paginated<T> {
	data: T[]
	current_page: number
	last_page: number
	total: number
	[key: string]: unknown
}

export interface CrmOption<T extends string = string> {
	value: T
	label: string
}

export type LeadSource = 'web' | 'referral' | 'campaign' | 'walkin' | 'other'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
export type OpportunityStage =
	| 'qualification'
	| 'proposal'
	| 'negotiation'
	| 'won'
	| 'lost'
export type ActivityEntityType = 'lead' | 'opportunity' | 'customer'
export type ActivityType = 'call' | 'meeting' | 'note' | 'task' | 'email'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export const LEAD_SOURCES: CrmOption<LeadSource>[] = [
	{ value: 'web', label: 'Web' },
	{ value: 'referral', label: 'Referido' },
	{ value: 'campaign', label: 'Campaña' },
	{ value: 'walkin', label: 'Visita' },
	{ value: 'other', label: 'Otro' },
]

export const LEAD_STATUSES: CrmOption<LeadStatus>[] = [
	{ value: 'new', label: 'Nuevo' },
	{ value: 'contacted', label: 'Contactado' },
	{ value: 'qualified', label: 'Calificado' },
	{ value: 'converted', label: 'Convertido' },
	{ value: 'lost', label: 'Perdido' },
]

export const OPPORTUNITY_STAGES: CrmOption<OpportunityStage>[] = [
	{ value: 'qualification', label: 'Calificación' },
	{ value: 'proposal', label: 'Propuesta' },
	{ value: 'negotiation', label: 'Negociación' },
	{ value: 'won', label: 'Ganada' },
	{ value: 'lost', label: 'Perdida' },
]

export const ACTIVITY_ENTITY_TYPES: CrmOption<ActivityEntityType>[] = [
	{ value: 'lead', label: 'Lead' },
	{ value: 'opportunity', label: 'Oportunidad' },
	{ value: 'customer', label: 'Cliente' },
]

export const ACTIVITY_TYPES: CrmOption<ActivityType>[] = [
	{ value: 'call', label: 'Llamada' },
	{ value: 'meeting', label: 'Reunión' },
	{ value: 'note', label: 'Nota' },
	{ value: 'task', label: 'Tarea' },
	{ value: 'email', label: 'Email' },
]

export const QUOTE_STATUSES: CrmOption<QuoteStatus>[] = [
	{ value: 'draft', label: 'Borrador' },
	{ value: 'sent', label: 'Enviada' },
	{ value: 'accepted', label: 'Aceptada' },
	{ value: 'rejected', label: 'Rechazada' },
	{ value: 'expired', label: 'Vencida' },
]

export function optionLabel<T extends string>(
	options: CrmOption<T>[],
	value: T | string | null | undefined,
): string {
	if (!value) {
		return '—'
	}
	return options.find((opt) => opt.value === value)?.label ?? String(value)
}

export interface Lead {
	id: number
	firstName: string
	lastName: string | null
	businessName: string | null
	email: string | null
	phone: string | null
	source: LeadSource
	status: LeadStatus
	notes: string | null
	assignedToId: number | null
	assignedTo: UserSummary | null
	customerId: number | null
	customer: PartySummary | null
	convertedAt: string | null
	createdAt: string
	updatedAt: string
}

export interface Opportunity {
	id: number
	title: string
	leadId: number | null
	customerId: number | null
	customer: PartySummary | null
	amount: number
	stage: OpportunityStage
	probability: number
	expectedCloseDate: string | null
	closedAt: string | null
	assignedToId: number | null
	assignedTo: UserSummary | null
	notes: string | null
	createdAt: string
	updatedAt: string
}

export interface Activity {
	id: number
	entityType: ActivityEntityType
	entityId: number
	type: ActivityType
	subject: string
	notes: string | null
	dueAt: string | null
	completedAt: string | null
	assignedToId: number | null
	assignedTo: UserSummary | null
	createdAt: string
	updatedAt: string
}

export interface QuoteItem {
	id: number
	productId: number | null
	product: ProductSummary | null
	description: string | null
	quantity: number
	unitPrice: number
	discount: number
	lineTotal: number
}

export interface Quote {
	id: number
	number: string | null
	opportunityId: number | null
	customerId: number | null
	customer: PartySummary | null
	status: QuoteStatus
	date: string
	validUntil: string | null
	subtotal: number
	discountTotal: number
	total: number
	notes: string | null
	items: QuoteItem[]
	createdAt: string
	updatedAt: string
}

export interface LeadListParams {
	search?: string
	page?: number
	limit?: number
	status?: string
	source?: string
	assignedToId?: number
}

export interface OpportunityListParams {
	search?: string
	page?: number
	limit?: number
	stage?: string
	customerId?: number
	leadId?: number
	assignedToId?: number
}

export interface ActivityListParams {
	search?: string
	page?: number
	limit?: number
	entityType?: string
	entityId?: number
	type?: string
	completed?: boolean
	assignedToId?: number
}

export interface QuoteListParams {
	search?: string
	page?: number
	limit?: number
	status?: string
	customerId?: number
	opportunityId?: number
}

export interface LeadInput {
	firstName: string
	lastName?: string
	businessName?: string
	email?: string
	phone?: string
	source?: LeadSource
	status?: LeadStatus
	notes?: string
	assignedToId?: number
}

export interface LeadConvertInput {
	createCustomer?: boolean
	createOpportunity?: boolean
	opportunityTitle?: string
	opportunityAmount?: number
}

export interface ConvertLeadResult {
	lead: Lead
	customer: PartySummary | null
	opportunity: Opportunity | null
}

export interface OpportunityInput {
	title: string
	leadId?: number
	customerId?: number
	amount?: number
	stage?: OpportunityStage
	probability?: number
	expectedCloseDate?: string
	assignedToId?: number
	notes?: string
}

export interface ActivityInput {
	entityType: ActivityEntityType
	entityId: number
	type: ActivityType
	subject: string
	notes?: string
	dueAt?: string
	assignedToId?: number
}

export interface QuoteItemInput {
	productId: number
	description?: string
	quantity: number
	unitPrice: number
	discount?: number
}

export interface QuoteInput {
	customerId: number
	opportunityId?: number
	date: string
	validUntil?: string
	notes?: string
	items: QuoteItemInput[]
}

export interface ConvertQuoteResult {
	quote: Quote
	sale: { id: number; number: string | null } & Record<string, unknown>
}

export interface QuoteFormInitial {
	customerId: number | null
	opportunityId?: number | null
	date: string
	validUntil?: string | null
	notes?: string | null
	items: QuoteItemInput[]
}

function cleanParams(
	params: Record<string, unknown>,
): Record<string, string | number> {
	const result: Record<string, string | number> = {}
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') {
			continue
		}
		result[key] = value as string | number
	}
	return result
}

export const crmService = {
	// ---- Leads -------------------------------------------------------------
	async listLeads(params: LeadListParams = {}): Promise<Paginated<Lead>> {
		const { data } = await api.get<Paginated<Lead>>('/crm/leads', {
			params: cleanParams(params as Record<string, unknown>),
		})
		return data
	},
	async createLead(payload: LeadInput): Promise<Lead> {
		const { data } = await api.post<Lead>('/crm/leads', payload)
		return data
	},
	async updateLead(id: number, payload: Partial<LeadInput>): Promise<Lead> {
		const { data } = await api.patch<Lead>(`/crm/leads/${id}`, payload)
		return data
	},
	async removeLead(id: number): Promise<void> {
		await api.delete(`/crm/leads/${id}`)
	},
	async convertLead(
		id: number,
		payload: LeadConvertInput = {},
	): Promise<ConvertLeadResult> {
		const { data } = await api.post<ConvertLeadResult>(
			`/crm/leads/${id}/convert`,
			payload,
		)
		return data
	},

	// ---- Opportunities -----------------------------------------------------
	async listOpportunities(
		params: OpportunityListParams = {},
	): Promise<Paginated<Opportunity>> {
		const { data } = await api.get<Paginated<Opportunity>>(
			'/crm/opportunities',
			{ params: cleanParams(params as Record<string, unknown>) },
		)
		return data
	},
	async createOpportunity(payload: OpportunityInput): Promise<Opportunity> {
		const { data } = await api.post<Opportunity>(
			'/crm/opportunities',
			payload,
		)
		return data
	},
	async updateOpportunity(
		id: number,
		payload: Partial<OpportunityInput>,
	): Promise<Opportunity> {
		const { data } = await api.patch<Opportunity>(
			`/crm/opportunities/${id}`,
			payload,
		)
		return data
	},
	async removeOpportunity(id: number): Promise<void> {
		await api.delete(`/crm/opportunities/${id}`)
	},

	// ---- Activities --------------------------------------------------------
	async listActivities(params: ActivityListParams = {}): Promise<
		Paginated<Activity>
	> {
		const query = cleanParams(params as Record<string, unknown>)
		if (params.completed !== undefined) {
			query.completed = params.completed ? 'true' : 'false'
		}
		const { data } = await api.get<Paginated<Activity>>('/crm/activities', {
			params: query,
		})
		return data
	},
	async createActivity(payload: ActivityInput): Promise<Activity> {
		const { data } = await api.post<Activity>('/crm/activities', payload)
		return data
	},
	async updateActivity(
		id: number,
		payload: Partial<ActivityInput>,
	): Promise<Activity> {
		const { data } = await api.patch<Activity>(
			`/crm/activities/${id}`,
			payload,
		)
		return data
	},
	async removeActivity(id: number): Promise<void> {
		await api.delete(`/crm/activities/${id}`)
	},
	async completeActivity(id: number): Promise<Activity> {
		const { data } = await api.post<Activity>(`/crm/activities/${id}/complete`)
		return data
	},

	// ---- Quotes ------------------------------------------------------------
	async listQuotes(params: QuoteListParams = {}): Promise<Paginated<Quote>> {
		const { data } = await api.get<Paginated<Quote>>('/crm/quotes', {
			params: cleanParams(params as Record<string, unknown>),
		})
		return data
	},
	async createQuote(payload: QuoteInput): Promise<Quote> {
		const { data } = await api.post<Quote>('/crm/quotes', payload)
		return data
	},
	async updateQuote(id: number, payload: Partial<QuoteInput>): Promise<Quote> {
		const { data } = await api.patch<Quote>(`/crm/quotes/${id}`, payload)
		return data
	},
	async removeQuote(id: number): Promise<void> {
		await api.delete(`/crm/quotes/${id}`)
	},
	async sendQuote(id: number): Promise<Quote> {
		const { data } = await api.post<Quote>(`/crm/quotes/${id}/send`)
		return data
	},
	async acceptQuote(id: number): Promise<Quote> {
		const { data } = await api.post<Quote>(`/crm/quotes/${id}/accept`)
		return data
	},
	async rejectQuote(id: number): Promise<Quote> {
		const { data } = await api.post<Quote>(`/crm/quotes/${id}/reject`)
		return data
	},
	async convertQuote(id: number): Promise<ConvertQuoteResult> {
		const { data } = await api.post<ConvertQuoteResult>(
			`/crm/quotes/${id}/convert`,
		)
		return data
	},
}
