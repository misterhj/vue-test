import type {
	ResourceFormField,
	ResourceListViewColumn,
	ResourceListFilters,
} from './resource-list.types'

export interface ResourceListConfig {
	/** Clave del recurso en el API genérico `/list/:resource`. */
	resource: string
	/** Título mostrado en la cabecera. */
	title: string
	/** Permiso de lectura exigido por la ruta/menú. */
	permission: string
	searchPlaceholder?: string
	defaultLimit?: number
	defaultSort?: { field: string; order: 'ASC' | 'DESC' }
	columns: ResourceListViewColumn[]
	filters?: ResourceListFilters[]
	/** Filtro aplicado en el cliente (p. ej. subcategorías). Requiere juntar todas las páginas. */
	clientFilter?: (row: Record<string, unknown>) => boolean
	/** Endpoint REST para CRUD (por defecto `resource`; subcategorías usa `categories`). */
	endpoint?: string
	/** Campos del formulario genérico de crear/editar. Si no se define, la tabla es solo lectura. */
	form?: ResourceFormField[]
}

export const RESOURCE_LIST_CONFIGS: Record<string, ResourceListConfig> = {
	products: {
		resource: 'products',
		title: 'Productos',
		permission: 'products:read',
		searchPlaceholder: 'Buscar por nombre, código o código de barras...',
		defaultSort: { field: 'id', order: 'DESC' },
		columns: [
			{ key: 'id', label: 'ID', type: 'number', sortable: true },
			{ key: 'name', label: 'Nombre', sortable: true },
			{ key: 'code', label: 'Código' },
			{ key: 'price', label: 'Precio', type: 'currency', sortable: true, align: 'right' },
			{ key: 'stock', label: 'Stock', type: 'number', sortable: true, align: 'right' },
			{
				key: 'category',
				label: 'Categoría',
				get: (row: Record<string, unknown>) =>
					(row.category as Record<string, unknown> | null)?.name,
			},
			{
				key: 'brand',
				label: 'Marca',
				get: (row: Record<string, unknown>) =>
					(row.brand as Record<string, unknown> | null)?.name,
			},
			{ key: 'isActive', label: 'Activo', type: 'boolean' },
		],
		filters: [
			{ key: 'isActive', label: 'Activo', type: 'boolean' },
			{ key: 'brandId', label: 'Marca', type: 'select', optionsResource: 'brands' },
			{ key: 'categoryId', label: 'Categoría', type: 'select', optionsResource: 'categories' },
			{ key: 'sectionId', label: 'Sección', type: 'select', optionsResource: 'sections' },
			{ key: 'modelId', label: 'Modelo', type: 'select', optionsResource: 'models' },
		],
		form: [
			{ key: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 150 },
			{ key: 'description', label: 'Descripción', type: 'textarea', fullWidth: true },
			{ key: 'price', label: 'Precio', type: 'number', min: 0, step: 0.01 },
			{ key: 'stock', label: 'Stock', type: 'number', min: 0 },
			{ key: 'barcode', label: 'Código de barras', type: 'text', maxLength: 100 },
			{ key: 'code', label: 'Código interno', type: 'text', maxLength: 100 },
			{ key: 'isActive', label: 'Activo', type: 'boolean', defaultValue: true },
			{ key: 'categoryId', label: 'Categoría', type: 'select', optionsResource: 'categories' },
			{ key: 'subcategoryId', label: 'Subcategoría', type: 'select', optionsResource: 'categories' },
			{ key: 'brandId', label: 'Marca', type: 'select', optionsResource: 'brands' },
			{ key: 'modelId', label: 'Modelo', type: 'select', optionsResource: 'models' },
			{ key: 'sectionId', label: 'Sección', type: 'select', optionsResource: 'sections' },
		],
	},
	brands: {
		resource: 'brands',
		title: 'Marcas',
		permission: 'brands:read',
		searchPlaceholder: 'Buscar marcas...',
		defaultSort: { field: 'name', order: 'ASC' },
		columns: [
			{ key: 'id', label: 'ID', type: 'number' },
			{ key: 'name', label: 'Marca', sortable: true },
			{ key: 'createdAt', label: 'Creado', type: 'date', sortable: true },
		],
		form: [
			{ key: 'name', label: 'Marca', type: 'text', required: true, maxLength: 150 },
		],
	},
	sections: {
		resource: 'sections',
		title: 'Secciones',
		permission: 'sections:read',
		searchPlaceholder: 'Buscar secciones...',
		defaultSort: { field: 'name', order: 'ASC' },
		columns: [
			{ key: 'id', label: 'ID', type: 'number' },
			{ key: 'name', label: 'Sección', sortable: true },
			{ key: 'createdAt', label: 'Creado', type: 'date', sortable: true },
		],
		form: [
			{ key: 'name', label: 'Sección', type: 'text', required: true, maxLength: 150 },
		],
	},
	categories: {
		resource: 'categories',
		title: 'Categorías',
		permission: 'categories:read',
		searchPlaceholder: 'Buscar categorías...',
		defaultSort: { field: 'name', order: 'ASC' },
		columns: [
			{ key: 'id', label: 'ID', type: 'number' },
			{ key: 'name', label: 'Categoría', sortable: true },
			{ key: 'slug', label: 'Slug' },
			{
				key: 'parentCategory',
				label: 'Categoría padre',
				get: (row: Record<string, unknown>) =>
					(row.parentCategory as Record<string, unknown> | null)?.name,
			},
			{ key: 'createdAt', label: 'Creado', type: 'date', sortable: true },
		],
		form: [
			{ key: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 150 },
			{
				key: 'parentCategoryId',
				label: 'Categoría padre',
				type: 'select',
				optionsResource: 'categories',
			},
		],
	},
	subcategories: {
		resource: 'categories',
		title: 'Subcategorías',
		permission: 'categories:read',
		searchPlaceholder: 'Buscar subcategorías...',
		defaultSort: { field: 'name', order: 'ASC' },
		columns: [
			{ key: 'id', label: 'ID', type: 'number' },
			{ key: 'name', label: 'Subcategoría', sortable: true },
			{ key: 'slug', label: 'Slug' },
			{
				key: 'parentCategory',
				label: 'Categoría padre',
				get: (row: Record<string, unknown>) =>
					(row.parentCategory as Record<string, unknown> | null)?.name,
			},
			{ key: 'createdAt', label: 'Creado', type: 'date', sortable: true },
		],
		endpoint: 'categories',
		form: [
			{ key: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 150 },
			{
				key: 'parentCategoryId',
				label: 'Categoría padre',
				type: 'select',
				optionsResource: 'categories',
				required: true,
			},
		],
		clientFilter: (row: Record<string, unknown>) => row.parentCategoryId != null,
	},
	models: {
		resource: 'models',
		title: 'Modelos',
		permission: 'models:read',
		searchPlaceholder: 'Buscar modelos...',
		defaultSort: { field: 'name', order: 'ASC' },
		columns: [
			{ key: 'id', label: 'ID', type: 'number' },
			{ key: 'name', label: 'Modelo', sortable: true },
			{
				key: 'brand',
				label: 'Marca',
				get: (row: Record<string, unknown>) =>
					(row.brand as Record<string, unknown> | null)?.name,
			},
			{ key: 'createdAt', label: 'Creado', type: 'date', sortable: true },
		],
		filters: [{ key: 'brandId', label: 'Marca', type: 'select', optionsResource: 'brands' }],
		form: [
			{ key: 'name', label: 'Modelo', type: 'text', required: true, maxLength: 150 },
			{
				key: 'brandId',
				label: 'Marca',
				type: 'select',
				optionsResource: 'brands',
				required: true,
			},
		],
	},
	customers: {
		resource: 'customers',
		title: 'Clientes',
		permission: 'customers:read',
		searchPlaceholder: 'Buscar por nombre, documento, email o teléfono...',
		defaultSort: { field: 'id', order: 'DESC' },
		columns: [
			{ key: 'id', label: 'ID', type: 'number' },
			{
				key: 'name',
				label: 'Nombre / Razón social',
				get: (row: Record<string, unknown>) =>
					row.businessName || `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
			},
			{
				key: 'document',
				label: 'Documento',
				get: (row: Record<string, unknown>) =>
					row.documentNumber
						? `${[row.documentType, row.documentNumber].filter(Boolean).join(' ')}`
						: null,
			},
			{ key: 'email', label: 'Email', sortable: true },
			{ key: 'phone', label: 'Teléfono' },
			{
				key: 'kind',
				label: 'Tipo',
				get: (row: Record<string, unknown>) =>
					row.kind === 'company' ? 'Empresa' : 'Persona',
			},
			{ key: 'isActive', label: 'Activo', type: 'boolean' },
			{ key: 'createdAt', label: 'Creado', type: 'date', sortable: true },
		],
		filters: [
			{
				key: 'kind',
				label: 'Tipo',
				type: 'select',
				options: [
					{ value: 'individual', label: 'Persona' },
					{ value: 'company', label: 'Empresa' },
				],
			},
			{ key: 'isCustomer', label: 'Es cliente', type: 'boolean' },
			{ key: 'isSupplier', label: 'Es proveedor', type: 'boolean' },
			{ key: 'canLogin', label: 'Puede loguearse', type: 'boolean' },
			{ key: 'isActive', label: 'Activo', type: 'boolean' },
		],
		form: [
			{
				key: 'kind',
				label: 'Tipo',
				type: 'select',
				defaultValue: 'individual',
				options: [
					{ value: 'individual', label: 'Persona física' },
					{ value: 'company', label: 'Empresa' },
				],
			},
			{ key: 'firstName', label: 'Nombre', type: 'text', maxLength: 150 },
			{ key: 'lastName', label: 'Apellido', type: 'text', maxLength: 150 },
			{ key: 'businessName', label: 'Razón social', type: 'text', maxLength: 200 },
			{ key: 'documentType', label: 'Tipo de documento', type: 'text', maxLength: 20 },
			{ key: 'documentNumber', label: 'Número de documento', type: 'text', maxLength: 50 },
			{ key: 'email', label: 'Email', type: 'text', maxLength: 180 },
			{ key: 'phone', label: 'Teléfono', type: 'text', maxLength: 40 },
			{ key: 'phoneAlt', label: 'Teléfono alternativo', type: 'text', maxLength: 40 },
			{ key: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
			{ key: 'taxCategory', label: 'Condición fiscal', type: 'text', maxLength: 50 },
			{ key: 'creditLimit', label: 'Límite de crédito', type: 'number', min: 0, step: 0.01 },
			{ key: 'marketingSource', label: 'Origen', type: 'text', maxLength: 100 },
			{ key: 'notes', label: 'Notas', type: 'textarea', fullWidth: true },
			{ key: 'acceptsMarketing', label: 'Acepta marketing', type: 'boolean', defaultValue: false },
			{ key: 'isCustomer', label: 'Es cliente', type: 'boolean', defaultValue: true },
			{ key: 'isSupplier', label: 'Es proveedor', type: 'boolean', defaultValue: false },
			{ key: 'canLogin', label: 'Puede loguearse', type: 'boolean', defaultValue: false },
			{ key: 'isActive', label: 'Activo', type: 'boolean', defaultValue: true },
		],
	},
}