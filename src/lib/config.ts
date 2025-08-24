/** Configuration file **/
export default class Config {
	static get isDevelopment() {
		return String(import.meta.env.DEPLOY_TYPE).toLowerCase() === 'dev' || true
	}

	static get isProduction() {
		return String(import.meta.env.DEPLOY_TYPE).toLowerCase() === 'prod' || false
	}

	static get isStoryDir() {
		return String(import.meta.env.PUBLIC_STORIES) || undefined
	}

	static get isDebug() {
		if (this.isProduction) {
			return false
		} else {
			return String(import.meta.env.IS_DEBUG).toLowerCase() === 'true' || true
		}
	}

	static get hasDebugFilters() {
		if (this.isProduction) {
			return [ "all" ]
		} else {
			return import.meta.env.DEBUG_FILTERS
		}
	}
}
