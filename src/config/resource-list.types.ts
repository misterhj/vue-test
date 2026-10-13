export type ResourceColumnType = 'text' | 'number' | 'boolean' | 'date' | 'currency'

/** Tipo del control de búsqueda por columna. */
export type ResourceColumnFilterType = 'text' | 'number' | 'date' | 'select'

/** Valor de un filtro de columna (escalar o múltiple). */
export type ResourceColumnFilterValue =
	| string
	| number
	| boolean
	| Array<string | number | boolean>

/** Definición resuelta de un filtro de columna para renderizar su control. */
export interface ResourceColumnFilterDef {
	/** Campo enviado al backend en `filters`. */
	key: string
	/** `key` de la columna a la que pertenece. */
	columnKey: string
	type: ResourceColumnFilterType
	/** `true` para selección múltiple (combobox); `false` para `select` simple. */
	multiple: boolean
	placeholder: string
	/** `true` cuando el filtro proviene de una columna booleana (Sí/No). */
	boolean?: boolean
	options?: ResourceListFilterOption[]
	/** Recurso del que cargar opciones dinámicas (solo para `select`). */
	optionsResource?: string
	/** Campo usado como label de cada opción cargada. Por defecto `name`. */
	optionLabel?: string
}

export interface ResourceListViewColumn {
	/** Clave de la propiedad o `key` de referencia para el col.get(). */
	key: string
	label: string
	/** Tipo de renderizado del valor. Por defecto `text`. */
	type?: ResourceColumnType
	/** Si el backend permite ordenar por este campo. */
	sortable?: boolean
	align?: 'left' | 'right' | 'center'
	/** Ancho mínimo de la columna en la tabla (p. ej. `'240px'`). */
	minWidth?: string
	/** Resolución custom del valor; permite componer columnas (p. ej. `firstName + lastName`). */
	get?: (row: Record<string, unknown>) => unknown
	/** Habilita la búsqueda por esta columna (envía el valor en `filters`). */
	filterable?: boolean
	/** Control del filtro. Por defecto se deduce del `type`. */
	filterType?: ResourceColumnFilterType
	/** Campo enviado al backend. Por defecto `key` (útil en relaciones: `category` → `categoryId`). */
	filterKey?: string
	/** Fuerza selección múltiple en un `select`. Por defecto `true` salvo booleanos. */
	filterMultiple?: boolean
	/** Texto de ayuda del control de búsqueda. */
	filterPlaceholder?: string
	/** Opciones estáticas para `filterType: 'select'`. */
	filterOptions?: ResourceListFilterOption[]
	/** Recurso para cargar opciones dinámicas en `filterType: 'select'`. */
	filterOptionsResource?: string
	/** Campo usado como label de cada opción cargada. Por defecto `name`. */
	filterOptionLabel?: string
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