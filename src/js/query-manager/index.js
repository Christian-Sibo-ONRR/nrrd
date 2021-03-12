import {
  DATA_TYPE,
  PRODUCTION,
  REVENUE,
  DISBURSEMENT,
  PERIOD,
  QK_QUERY_TOOL,
  QK_DISBURSEMENTS_COMMON,
  QK_REVENUE_COMMON,
  QK_PRODUCTION_COMMON,
  FISCAL_YEAR,
  PERIOD_FISCAL_YEAR,
  CALENDAR_YEAR,
  PERIOD_CALENDAR_YEAR,
  PERIOD_MONTHLY,
  MULTI_STR,
  MULTI_INT,
  COMMODITY,
  REVENUE_TYPE,
  US_STATE,
  US_STATE_NAME,
  COUNTY,
  COUNTY_NAME,
  STATE_OFFSHORE_NAME,
  OFFSHORE_REGION,
  LAND_TYPE,
  PRODUCT,
  RECIPIENT,
  SOURCE,
  LOCAL_RECIPIENT,
  COMMODITY_ORDER,
  COMPANY_NAME,
  MONTH_LONG,
  MONTHLY
} from '../../constants'

import {
  getQuery as getQueryQueryTool,
  getVariables as getVariablesQueryTool
} from './query-tool-queries'

import {
  getQuery as getQueryDisbursement,
  getVariables as getVariablesDisbursement
} from './disbursement-queries'

import {
  getQuery as getQueryRevenue,
  getVariables as getVariablesRevenue
} from './revenue-queries'

import {
  getQuery as getQueryProduction,
  getVariables as getVariablesProduction
} from './production-queries'
/**
 * The query manager provides a standard approach for accessing a query and its variables. This allows us to use this
 * query manager in a HOC that can then be added to components. The query manager also provides helper methods to use for creating
 * the syntax needed for executing a query properly. It tries to remove the burden of repetative code and a reusable code base for components.
 * Also by using a query manager it will be easy to find all our queries used in the code and edit as necessary.
 */
const QueryManager = {
  getQuery: (queryKey, state, { ...options }) => {
    const query = QUERIES[queryKey](state, options)
    if (query === undefined) {
      throw new Error(`For query key: '${ queryKey } no query was found.`)
    }
    return query
  },
  getVariables: (queryKey, state, { ...options }) => VARIABLES[queryKey](state, options)
}
export default QueryManager

/**
 * Crosswalk object to map data filter keys to database columns
 */
export const DATA_FILTER_KEY_TO_DB_COLUMNS = {
  [COMMODITY]: 'commodity',
  [COMMODITY_ORDER]: 'commodity_order',
  [US_STATE]: 'state',
  [US_STATE_NAME]: 'state_name',
  [COUNTY]: 'county',
  [COUNTY_NAME]: 'county_name',
  [LAND_TYPE]: 'land_type',
  [OFFSHORE_REGION]: 'offshore_region',
  [REVENUE_TYPE]: 'revenue_type',
  [PERIOD]: 'period',
  [STATE_OFFSHORE_NAME]: 'state_offshore_name',
  [FISCAL_YEAR]: 'fiscal_year',
  [CALENDAR_YEAR]: 'calendar_year',
  [PRODUCT]: 'product',
  [RECIPIENT]: 'recipient',
  [SOURCE]: 'source',
  [LOCAL_RECIPIENT]: 'local_recipient',
  [COMPANY_NAME]: 'corporate_name',
  [MONTH_LONG]: 'month_long',
  [REVENUE]: 'revenue',
  [PRODUCTION]: 'production',
  [DISBURSEMENT]: 'disbursement'
}

/**
 * All the queries that can be accessed via query key
 */
const QUERIES = {
  [QK_QUERY_TOOL]: (state, options) => getQueryQueryTool(state, options),
  [QK_DISBURSEMENTS_COMMON]: (state, options) => getQueryDisbursement(state, options),
  [QK_REVENUE_COMMON]: (state, options) => getQueryRevenue(state, options),
  [QK_PRODUCTION_COMMON]: (state, options) => getQueryProduction(state, options),
}

/**
 * All the variables that can be accessed via query key
 */
const VARIABLES = {
  [QK_QUERY_TOOL]: (state, options) => getVariablesQueryTool(state, options),
  [QK_DISBURSEMENTS_COMMON]: (state, options) => getVariablesDisbursement(state, options),
  [QK_REVENUE_COMMON]: (state, options) => getVariablesRevenue(state, options),
  [QK_PRODUCTION_COMMON]: (state, options) => getVariablesProduction(state, options),
}

/**
 * Helper method to get all the where clause statements for queries
 * @param {array} config
 * @param {array} excludeProps
 */
export const getDataFilterWhereClauses = (config, excludeProps) => {
  let results = ''

  const getClause = (key, type) => {
    switch (type) {
    case MULTI_INT:
    case MULTI_STR:
      return `{_in: $${ key }}`
    }
    return `{_eq: $${ key }}`
  }

  config.forEach(prop => {
    const key = Object.keys(prop)[0]
    if (!excludeProps || !excludeProps.includes(key)) {
      if (DATA_FILTER_KEY_TO_DB_COLUMNS[key]) {
        results =
          results.concat(`${ DATA_FILTER_KEY_TO_DB_COLUMNS[key] }: ${ getClause(key, prop[key]) },`)
      }
    }
  })

  return results
}

/**
 * Helper method to set all the values to the variables for queries that use our data filter inputs
 * @param {object} state
 * @param {array} config
 */
export const getDataFilterVariableValues = (state, config) => {
  const results = {}
  config.forEach(prop => {
    results[Object.keys(prop)[0]] = getDataFilterValue(Object.keys(prop)[0], state)
  })
  return ({ variables: results })
}

/**
 * Helper method to get the values for a specific data filter input/property
 * @param {object} state
 * @param {array} config
 */
export const getDataFilterValue = (key, state) => {
  switch (key) {
  case PERIOD:
    return (!state[key]) ? undefined : state[key]
  case FISCAL_YEAR:
    return (state[PERIOD] === PERIOD_FISCAL_YEAR)
      ? state[key]?.split(',')
      : undefined
  case CALENDAR_YEAR:
    return (state[PERIOD] === PERIOD_CALENDAR_YEAR || state[PERIOD] === PERIOD_MONTHLY) ? state[key]?.split(',') : undefined
  case MONTH_LONG:
    return undefined
  }
  return (!state[key]) ? undefined : state[key].split(',')
}

/**
 * Helper method to create the variable list for the query
 * @param {object} state
 * @param {array} config
 */
export const getDataFilterVariableList = (state, config) => {
  let result = ''
  config.forEach(prop => {
    const key = Object.keys(prop)[0]
    result = result.concat(`$${ key }: ${ prop[key] }`)
  })
  return result
}
