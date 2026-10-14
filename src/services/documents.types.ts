export type DocumentStatus = 'draft' | 'confirmed' | 'cancelled'

/**
 * Contraparte (proveedor/cliente) de un documento.
 * El endpoint dedicado (`GET /purchases|/sales`) devuelve `displayName`, mientras
 * que el listado genérico (`POST /list/purchases|/sales`) devuelve la entidad
 * Customer cruda; por eso el nombre puede venir en varias formas.
 */
export interface DocumentParty {
	id: number
	displayName?: string | null
	businessName?: string | null
	firstName?: string | null
	lastName?: string | null
}

/** Resumen liviano de un producto dentro de los items de un documento. */
export interface DocumentProduct {
	id: number
	name: string | null
	code: string | null
}

/** Línea de un documento (compra/venta) tal como la maneja el formulario. */
export interface DocumentLineInput {
	productId: number
	quantity: number
	/** Costo (compras) o precio (ventas) unitario. */
	unit: number
	discount: number
}

/** Payload emitido por el formulario de documentos al guardar. */
export interface DocumentFormPayload {
	partyId: number
	date: string
	notes: string
	items: DocumentLineInput[]
}

/** Estado inicial del formulario de documentos (alta o edición). */
export interface DocumentFormInitial {
	partyId: number | ''
	date: string
	notes: string
	items: DocumentLineInput[]
}

export interface DocumentFormPartyOption {
	value: number
	label: string
}
