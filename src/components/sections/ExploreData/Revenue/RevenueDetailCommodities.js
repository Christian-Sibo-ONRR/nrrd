import React, { useContext } from 'react'
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'

import utils from '../../../../js/utils'

import { DataFilterContext } from '../../../../stores/data-filter-store'
import { DATA_FILTER_CONSTANTS as DFC } from '../../../../constants'

import CircleChart from '../../../data-viz/CircleChart/CircleChart'
import QueryLink from '../../../../components/QueryLink'
import { useInView } from 'react-intersection-observer';
import CircularProgress from '@material-ui/core/CircularProgress'

import { makeStyles, useTheme } from '@material-ui/core/styles'
import {
    Box
} from '@material-ui/core'

const useStyles = makeStyles(theme => ({
    root: {
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'flex-start',
	'& .chart-container': {
	    display: 'flex',
	    flexDirection: 'column',
	},
    }
}))

const APOLLO_QUERY = gql`
    query RevenueCommodityQuery($year: Int!, $state: String!, $period: String!, $commodities: [String!]) {
	# Revenue commodity summary
	revenue_summary(
	    where: { year: { _eq: $year }, location: { _eq: $state }, period: { _eq: $period}, commodity: {_in: $commodities} },
	    order_by: { year: asc, total: desc }
	) {
	    year
	    commodity
	    location
	    total
	}
    }
`

const RevenueDetailCommodities = props => {
    // console.log('RevenueDetailCommodities props: ', props)
    const classes = useStyles()
    const theme = useTheme()
    const { state: filterState } = useContext(DataFilterContext)
    const year = filterState[DFC.YEAR]
    const state = props.fipsCode
    const period = (filterState[DFC.PERIOD]) ? filterState[DFC.PERIOD] : DFC.FISCAL_YEAR_LABEL
    const commodities = (filterState[DFC.COMMODITY]) ? filterState[DFC.COMMODITY].split(',') : undefined

    const dataSet = (period === DFC.FISCAL_YEAR_LABEL) ? `FY ${ year }` : `CY ${ year }`
    const dataKey = `${ dataSet }-${ state }`

    const isCounty = state && state.length === 5
    const { ref, inView, entry } = useInView({
	/* Optional options */
	threshold: 0,
    });


    const { loading, error, data } = useQuery(APOLLO_QUERY, {
	variables: { year: year, state: state, period: period, commodities },
	skip: inView === false
    })

    let chartData

    if (loading) return (
	<div className={classes.progressContainer}>
          <CircularProgress classes={{ root: classes.circularProgressRoot }} />
	</div>
    )
    if (error) return `Error! ${ error.message }`

    if (data) {
	chartData = data


	return (
	    <div ref={ref} >
	      { (chartData.revenue_summary.length > 0)
		? (
		    <Box className={classes.root}>
		      <Box component="h4" fontWeight="bold">Commodities</Box>
		      <Box>
			<CircleChart key={'RDC' + dataKey} data={chartData.revenue_summary}
				     xAxis='commodity' yAxis='total'
				     format={ d => {
					 return utils.formatToDollarInt(d)
				     }
				     }
				     circleTooltip={
				     d => {
					 const r = []
					 r[0] = d.commodity
					 r[1] = utils.formatToDollarInt(d.total)
					 return r
				     }
				     }
				     yLabel={dataSet}
				     maxCircles={6}
				     colorRange={[
					 theme.palette.explore[600],
					 theme.palette.explore[500],
					 theme.palette.explore[400],
					 theme.palette.explore[300],
					 theme.palette.explore[200],
					 theme.palette.explore[100]
				     ]} />
			<QueryLink
			    groupBy={isCounty ? DFC.COUNTY : DFC.COMMODITY}
			    landType="Federal - not tied to a lease,Federal Offshore,Federal Onshore"
			    linkType="FilterTable"
			    breakoutBy={DFC.COMMODITY}
			    {...props}>
			  Query revenue by commodity
			</QueryLink>
		      </Box>
		    </Box>
		)
		: (
		    <Box className={classes.boxSection}>
		    </Box>
		)
	      }
	    </div>
	)
    }
    else {
	return (<div className={classes.progressContainer} ref={ref}>
	  <CircularProgress classes={{ root: classes.circularProgressRoot }} />
	</div>)
    }
}

export default RevenueDetailCommodities
