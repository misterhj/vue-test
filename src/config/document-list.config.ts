import type { DocumentStatus } from '@/services/documents.types'

export type DocumentKind = 'purchases' | 'sales'

export interface DocumentListConfig {
	kind: DocumentKind
	title: string
	/** Prefijo del permiso de la entidad (`purchases` / `sales`). */
	permissionPrefix: string
	/** Campo del payload que referencia a la contraparte. */
	partyKey: 'supplierId' | 'customerId'
	partyLabel: string
	/** Filtro para obtener las opciones de contraparte desde `/list/customers`. */
	partyFilter: Record<string, unknown>
	unitLabel: string
	searchPlaceholder: string
	statusLabels: Record<DocumentStatus, string>
}

export const DOCUMENT_LIST_CONFIGS: Record<DocumentKind, DocumentListConfig> = {
	purchases: {
		kind: 'purchases',
		title: 'Compras',
		permissionPrefix: 'purchases',
		partyKey: 'supplierId',
		partyLabel: 'Proveedor',
		partyFilter: { isSupplier: true },
		unitLabel: 'Costo unitario',
		searchPlaceholder: 'Buscar por número o proveedor...',
		statusLabels: {
			draft: 'Borrador',
			confirmed: 'Confirmada',
			cancelled: 'Cancelada',
		},
	},
	sales: {
		kind: 'sales',
		title: 'Ventas',
		permissionPrefix: 'sales',
		partyKey: 'customerId',
		partyLabel: 'Cliente',
		partyFilter: { isCustomer: true },
		unitLabel: 'Precio unitario',
		searchPlaceholder: 'Buscar por número o cliente...',
		statusLabels: {
			draft: 'Borrador',
			confirmed: 'Confirmada',
			cancelled: 'Cancelada',
		},
	},
}
