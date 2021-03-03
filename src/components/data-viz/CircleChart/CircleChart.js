/* eslint-disable quotes */
import React, { useEffect, useRef } from 'react'
// import ReactDOM from 'react-dom'

// import utils from '../../../js/utils'

import { makeStyles } from '@material-ui/core/styles'
// import clsx from 'clsx'

// import ChartTitle from '../ChartTitle'

// import stackedBarChart from '../../../js/bar-charts/stacked-bar-chart'
import D3CircleChart from './D3CircleChart.js'
// import { interpolateRgbBasis } from 'd3'

const useStyles = makeStyles((theme, props) => ({
  container: {
    display: 'block',
    top: 0,
    left: 0,
    width: '100%',
    height: 'auto',
  },
  chart: {
    display: 'block',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    fill: theme.palette.chart.primary,
    '& .bars > .bar:hover': {
      fill: theme.palette.chart.secondary,
      cursor: 'pointer',
    },
    '& .bars > .active': {
      fill: theme.palette.chart.secondary,
    },
    '& .maxExtent': {
      fontSize: theme.typography.h5.fontSize,
    },
    '& .x-axis > .tick': {
      fontSize: theme.typography.h5.fontSize,
    },
    '& .tooltip': {
      pointerEvents: 'none',
    },
    '& > svg': {
      maxWidth: '100%',
    }
  },
  legend: {
    display: 'block',
    top: 0,
    left: 0,
    maxWidth: '100%',
    fontSize: theme.typography.h5.fontSize,
    '& tr > td:first-child': {
      width: 10,
    },
    '& td .legend-rect': {
      display: 'block',
      height: 20,
      width: 20,
    },
    '& .legend-table': {
      width: '100%',
      borderSpacing: 0,
      borderCollapse: 0,
      boxShadow: 'none',
      fontSize: '1rem',
    },
    '& .legend-table > thead th:last-child, & .legend-table > tbody td:last-child': {
      textAlign: 'right',
    },
    '& .legend-table > thead th': {
      fontWeight: 'bold',
      textAlign: 'left',
      borderBottom: `1px solid ${ theme.palette.grey[300] }`,
    },
    '& .legend-table > thead th:first-letter': {
      textTransform: 'capitalize',
    },
    '& .legend-table > tbody tr td': {
      borderBottom: `1px solid ${ theme.palette.grey[300] }`,
      verticalAlign: 'top',
    },
    '& .legend-table > tbody tr:last-child td': {
      border: 'none',
    },
    '& .legend-table th, & .legend-table td': {
      padding: theme.spacing(0.5),
    },
    '& .legend-rect': {
      marginTop: theme.spacing(0.5),
    },
  }
}))
/**
 * Circle charts provide  a way to visualize hierarchically structured data.
 *
 * An example exists in the [“Compare revenue”] section in Explore data:
 * (https://revenuedata.doi.gov/explore?dataType=Revenue&location=NF&mapLevel=State&offshoreRegions=false&period=Calendar%20Year&year=2019#top-nationwide-locations')'.
 */
const CircleChart = props => {
  // const mapJson=props.mapJson || "https://cdn.jsdelivr.net/npm/us-atlas@2/us/10m.json";
  // use ONRR topojson file for land

  const classes = useStyles()

  const { data, ...options } = props
  const elemRef = useRef(null)

  useEffect(() => {
    elemRef.current.children[0].innerHTML = ''
    elemRef.current.children[1].innerHTML = ''
    // eslint-disable-next-line no-unused-vars
    const chart = new D3CircleChart(elemRef.current, data, options)
  }, [elemRef])

  return (
    <>
      <div className={`${ classes.container } chart-container`} ref={elemRef}>
        <div className={`${ classes.chart } chart`}></div>
        <div className={`${ classes.legend } legend`}></div>
      </div>
    </>
  )
}

export default CircleChart

const chartData = [
  { location_name: "Gulf of Mexico", total: 5163524881.620001 },
  { location_name: "New Mexico", total: 2447493889.24 },
  { location_name: "Wyoming", total: 1246326179.16 },
  { location_name: "Native American", total: 1155674819.2200003 },
  { location_name: "North Dakota", total: 289595600.7900001 }
]

CircleChart.Preview = {
  group: 'Data Visualizations',
  demos: [
    {
      title: 'Example',
      code: '<CircleChart data={' + JSON.stringify(chartData) + '} xAxis={"location_name"} yAxis={"total"} />',
    }
  ]
}
