import { ref, type Ref } from 'vue'
import type { Paginated } from '@/services/crm.services'

export type CrmListFetcher<T> = (
	params: Record<string, unknown>,
) => Promise<Paginated<T>>

/**
 * Estado compartido de un listado CRM: paginación, carga, error y
 * reaplicación de filtros. Cada vista aporta su función `fetcher` y sus filtros.
 */
export function useCrmList<T>(fetcher: CrmListFetcher<T>, initialLimit = 15) {
	const rows = ref([]) as Ref<T[]>
	const loading = ref(false)
	const error = ref('')
	const page = ref(1)
	const lastPage = ref(1)
	const total = ref(0)
	const limit = ref(initialLimit)
	const params = ref<Record<string, unknown>>({})

	async function load(
		nextParams: Record<string, unknown>,
		targetPage: number,
	): Promise<void> {
		params.value = nextParams
		loading.value = true
		error.value = ''
		try {
			const res = await fetcher({
				page: targetPage,
				limit: limit.value,
				...nextParams,
			})
			rows.value = res.data
			page.value = res.current_page
			lastPage.value = res.last_page
			total.value = res.total
		} catch (err: unknown) {
			error.value =
				(err as { message?: string })?.message ?? 'Error al cargar los datos'
			rows.value = []
			total.value = 0
			lastPage.value = 1
		} finally {
			loading.value = false
		}
	}

	/** Aplica filtros y vuelve a la primera página. */
	function apply(nextParams: Record<string, unknown> = {}): Promise<void> {
		return load(nextParams, 1)
	}

	/** Recarga la página actual con los filtros vigentes. */
	function reload(): Promise<void> {
		return load(params.value, page.value)
	}

	function goToPage(target: number): Promise<void> {
		if (
			target < 1 ||
			target > lastPage.value ||
			target === page.value
		) {
			return Promise.resolve()
		}
		return load(params.value, target)
	}

	function changeLimit(): Promise<void> {
		return load(params.value, 1)
	}

	return {
		rows,
		loading,
		error,
		page,
		lastPage,
		total,
		limit,
		apply,
		reload,
		goToPage,
		changeLimit,
	}
}
