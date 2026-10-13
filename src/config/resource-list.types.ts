export type ResourceColumnType = 'text' | 'number' | 'boolean' | 'date' | 'currency'

export interface ResourceListViewColumn {
	/** Clave de la propiedad o `key` de referencia para el col.get(). */
	key: string
	label: string
	/** Tipo de renderizado del valor. Por defecto `text`. */
	type?: ResourceColumnType
	/** Si el backend permite ordenar por este campo. */
	sortable?: boolean
	align?: 'left' | 'right' | 'center'
	/** Resolución custom del valor; permite componer columnas (p. ej. `firstName + lastName`). */
	get?: (row: Record<string, unknown>) => unknown
}

export interface ResourceListFilterOption {
	value: string | number | boolean
	label: string
}

export interface ResourceListFilters {
	/** Campo permitido por la whitelist `filterable` del recurso. */
	key: string
	label: string
	/** `select` (dropdown) o `boolean` (checkbox). */
	type: 'select' | 'boolean'
	/** Opciones estáticas. Si se usa `optionsResource`, se ignoran. */
	options?: ResourceListFilterOption[]
	/** Recurso del que cargar opciones dinámicas (`/list/:resource`). */
	optionsResource?: string
	/** Campo usado como label de cada opción cargada. Por defecto `name`. */
	optionLabel?: string
}

export type ResourceFormFieldType =
	| 'text'
	| 'textarea'
	| 'number'
	| 'boolean'
	| 'select'
	| 'date'

export interface ResourceFormField {
	/** Propiedad enviada al backend. Coincide con la columna/entidad. */
	key: string
	label: string
	type: ResourceFormFieldType
	required?: boolean
	placeholder?: string
	/** Valor inicial en el formulario de creación. */
	defaultValue?: string | number | boolean
	min?: number
	max?: number
	step?: number
	maxLength?: number
	/** Opciones estáticas para `select`. */
	options?: ResourceListFilterOption[]
	/** Recurso para cargar opciones dinámicas en `select`. */
	optionsResource?: string
	/** Campo usado como label de cada opción cargada. Por defecto `name`. */
	optionLabel?: string
	/** Ocupa todo el ancho del formulario (p. ej. textarea). */
	fullWidth?: boolean
}