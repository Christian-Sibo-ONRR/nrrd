'use strict'
import * as d3 from 'd3'
// import { active } from 'd3'
// import { isEnumMember } from 'typescript'

export default class D3StackedBarChart {
  constructor (node, data, options, onHover, formatLegendFunc) {
    try {
      this.node = node
      this.chartDiv = node.getElementsByClassName('chart_div')[0]
      this.legendDiv = node.getElementsByClassName('legend_div')[0]
      if (data && data.length > 0) {
        // console.debug('data:', data)
        this.data = data
      }
      else {
        console.warn('Stacked barchart must have data, erroring out')
        return false
      }

      this.options = options
      this._height = (this.chartDiv.clientHeight > 0) ? this.chartDiv.clientHeight : 400
      this._width = (this.chartDiv.clientWidth <= 0) ? 300 : this.chartDiv.clientWidth
      this.xAxis = options.xAxis || console.error('Error - no xAxis property set')
      this.yAxis = options.yAxis || console.error('Error - no yAxis property set')
      this.marginBottom = options.marginBottom || 40
      this.marginTop = options.marginTop || 25
      this.units = (options.units) ? options.units : ''
      this.horizontal = options.horizontal
      this.showLegendUnits = options.showLegendUnits
      this.primaryColor = options.primaryColor || '#222'
      this.secondaryColor = options.secondaryColor || '#43646F'
      this.handleBarHover = options.handleBarHover

      if (options.chartTooltip) {
        this.chartTooltip = options.chartTooltip
      }

      if (this.horizontal) {
        const h = this._height
        const w = this._width
        this._width = h
        this._height = w

        // reset margins
        this.marginLeft = 0
        this.marginTop = 0
        this.marginRight = 0
        this.marginBottom = 0
      }
      if (options.selectedIndex === undefined) {
        this.selectedIndex = this.xDomain().length - 1
      }
      else {
        this.selectedIndex = options.selectedIndex
      }

      this.currentIndex = this.selectedIndex

      if (this.showLegendUnits) {
        this.showLegendUnits = true
      }
      this.xGroups = (options.xGroups) ? options.xGroups : undefined

      this.legendReverse = (options.legendReverse) ? options.legendReverse : false

      this.xLabels = (typeof options.xLabels === 'function') ? options.xLabels : this.xLabels
      // max extent line props and defaults
      if (options.legendFormat) {
        this.legendFormat = options.legendFormat
      }
      if (options.legendHeaders) {
        this.legendHeaders = options.legendHeaders
      }
      this.extentPercent = options.extentPercent || 0.05
      this.extentMarginOfError = options.extentMarginOfError || 0.10
      this.maxExtentLineY = options.maxExtentLineY || 20

      // overload methods to make chart awesome
      if (options.onSelect) this.onSelect = options.onSelect
      if (options.onClick) this.onClick = options.onClick
      if (options.onHover) this.onHover = options.onHover

      this.yOrder()
      this.xScale = d3.scaleBand()
        .domain(this.xDomain())
        .range([0, this._width])
        .paddingInner(0.3)
        .paddingOuter(0.1)

      this.barScale = (options.barScale) ? options.barScale : 1
      this._height = d3.max([this._height * this.barScale, 1])
      this.yScale = d3.scaleLinear().rangeRound([this.marginTop, this._height - this.marginBottom])
      this.yScale.domain([this.yMax(), 0])
      this.chart = d3.select(this.chartDiv).append('svg')
        .attr('height', this._height)
        .attr('width', this._width)
        .attr('class', 'stacked-bar-chart')

      if (options.colorRange) {
        this.colorRange = options.colorRange
        this.color = d3.scaleOrdinal().domain(this.xDomain).range(this.colorRange)
      }
      else {
        this.colorRange = false
        this.color = d3.scaleLinear().domain(this.yOrderBy.slice(1)).range([this.primaryColor, this.secondaryColor])
      }
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  draw () {
    try {
      this.chart.selectAll('.stacked-bar-chart-background').remove()
      this.addBackgroundRect()
      if (!this.horizontal) {
        this._maxExtend()
      }
      this._chart()
      if (!this.horizontal) {
        this._xLabels()
      }
      this._legend()
      if (!this.horizontal) {
        this.xAxisGroup()
      }
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  maxExtent () {
    try {
      const maxValue = this.yMax()
      const maxValueExtent = Math.ceil(maxValue * (1 + this.extentPercent))
      return this.getMetricLongUnit(d3.format(this.setSigFigs(maxValue, maxValueExtent))(maxValueExtent))
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  xLabels (values) {
    return values
  }

  _xLabels () {
    try {
      this.chart.selectAll('.x-axis').remove()
      const xLabels = this.xLabels(this.xDomain())
      const self = this
      const createXAxis = () => (d3.axisBottom(self.xScale).tickSize(0).tickFormat((d, i) => {
        return xLabels[i]
      }))
      const rotate = this.options.xRotate || 0
      let x = -1
      const y = 8
      if (rotate !== 0) {
        x = -11
      }
      self.chart.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(2,' + (self._height - self.marginBottom) + ')')
        .call(createXAxis())
        .selectAll('text')
        .attr('transform', 'rotate(' + rotate + ')')
        .attr('x', x)
        .attr('y', y)
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  // addGroupLines () {
  xAxisGroup () {
    try {
      // console.log('xAxisGroup this: ', this)
      if (this.xGroups) {
        const self = this

        const groupLines = this.chart.append('g').attr('class', 'x-axis-groups')
        const groupItemWidth = (self._width / self.data.length)
        const padding = (self.xScale.bandwidth() * 0.2)
        let xPos = 0

        Object.keys(self.xGroups).sort().map((name, index) => {
          const groupLineWidth = xPos + (groupItemWidth * self.xGroups[name].length) - padding

          groupLines.append('line')
            .attr('x1', xPos + padding)
            .attr('x2', groupLineWidth)
            .attr('stroke', '#a7bcc7')
            .attr('stroke-width', 1)
	          .attr('transform', 'translate(' + [0, self._height + 4 - self.marginBottom / 2] + ')')

          groupLines.append('text')
            .attr('x', ((xPos + padding) / 2) + (groupLineWidth / 2))
            .attr('y', self._height)
            .attr('text-anchor', 'middle')
            .style('font-size', '1rem')
            .text(name)

	        xPos = groupLineWidth + padding
        })
      }
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  _maxExtend () {
    try {
      const self = this

      this.chart.selectAll('.maxExtent').remove()
      const maxExtentGroup = self.chart.append('g').attr('class', 'maxExtent')

      const maxExtentValue = this.maxExtent()

      maxExtentGroup.append('text')
        .attr('width', self._width)
        .attr('x', self._width)
        .attr('y', (self.maxExtentLineY - 5))
        .attr('text-anchor', 'end')
        .text((self.units === 'dollars' || self.units === '$') ? ['$', maxExtentValue].join('') : [maxExtentValue, self.units].join(' '))

      maxExtentGroup.append('line')
        .attr('x1', 0)
        .attr('x2', self._width)
        .attr('stroke', '#a7bcc7')
        .attr('stroke-dasharray', [5, 5])
        .attr('stroke-width', 1)
        .attr('transform', 'translate(' + [0, self.maxExtentLineY] + ')')
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  _chart () {
    try {
      console.log('_chart loaded yo: ')
      const self = this
      const stack = d3.stack()
	    .keys(this.yGroupings())
        .offset(d3.stackOffsetNone)

      const keys = this.yGroupings()
      const primaryColor = this.primaryColor
      const secondaryColor = this.secondaryColor
      const colorRange = this.colorRange
      const chartTooltip = this.chartTooltip

      // Define the div for the tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.85)')
        .style('border-radius', '4px')
        .style('z-index', '999')
        .style('text-align', 'center')
        .style('color', 'white')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('display', 'none')

      this.chart.append('g')
        .attr('class', 'bars')
        .selectAll('g')
        .data(self.xDomain())
        .enter().append('g')
        .attr('height', (self._height - self.marginTop))
        .attr('width', self.xScale.bandwidth())
        .style('fill', (d, i) => {
          if (this.horizontal && colorRange) {
            return null
          }
          else {
            return primaryColor
          }
        })
        .attr('transform', d => 'translate(' + (self.xScale(d) + ',0)'))
        .attr('class', (d, i) => {
          return i === self.selectedIndex ? 'bar active' : 'bar'
        })
        // .attr('tabindex', (d, i) => i)
        .attr('tabindex', 0)
        .on('mouseenter', (d, i) => {
          self.currentIndex = i
          // if (self.xAxis === 'year') self.handleBarHover({ year: self._xDomain[i] || self.xSelectedValue })
          // if (self.xAxis === 'month_long') self.handleBarHover({ month_long: self._xDomain[i] || self._xDomain[self.xSelectedValue], xGroups: self.xGroups })
        })
        .on('mouseleave', (d, i) => {
          self.currentIndex = self.selectedIndex
          self._legendHeaders()
          // if (self.xAxis === 'year') self.handleBarHover({ year: self.xSelectedValue })
          // if (self.xAxis === 'month_long') self.handleBarHover({ month_long: self.xSelectedValue, xGroups: self.xGroups })
        })
        .selectAll('g')
        .data(d => {
          const yd = self.yGroupData(d)
          const r = stack([yd])
          return r
        })
        .enter().append('g')
        .attr('class', (d, i) => 'stacked-bar-chart-' + i)
        .style('fill', (d, i) => {
          if (this.horizontal && colorRange) {
            return colorRange[i]
          }
          else {
            return null
          }
        })
        .style('fill-opacity', (d, i) => {
          if (this.horizontal && colorRange) {
            return null
          }
          else {
            return (1 - (i / keys.length))
          }
        })
        .append('rect')
        .attr('y', d => {
          const y = self.yScale(d[0][1]) || 0
          return y
        })
        .attr('height', function (d) {
          // console.debug(d)
          return (self.yScale(d[0][0]) - self.yScale(d[0][1])) || 0
        })
        .attr('width', self.maxBarSize())
        .attr('x', self.barOffsetX())
        .on('click', function (d, i) {
          // console.debug(' onclick:', d)
          self._onSelect(this, d)
          self._onClick(this, d)
        })
        .on('mouseover', function (d, i) {
          if (chartTooltip(d)[0] !== undefined && chartTooltip(d)[0] !== '') {
            self._onMouseover(this, d)
            tooltip
              .style('opacity', 1)
              .style('display', 'block')
              .style('padding', '4px')
          }
        })
        .on('mouseenter', function (d, i) {
          self._onHover(this, d, true)
        })
        .on('mouseleave', function (d) {
          self._onHover(this, d, false)
        })
        .on('mousemove', function (d) {
          if (chartTooltip(d)[0] !== undefined) {
            tooltip
              .html(`${ chartTooltip(d)[0] }<br>${ chartTooltip(d)[1] }`)
              .style('left', (d3.event.pageX + 10) + 'px')
              .style('top', (d3.event.pageY + 10) + 'px')
          }
        })
        .on('mouseout', function (d) {
          if (chartTooltip(d)[0] !== undefined) {
            self._onMouseout(this, d)
          }
          tooltip.style('opacity', 0)
        })

      if (self.selectedIndex) {
        const selectedElement = d3.selectAll('.active')
        selectedElement
          .style('fill', secondaryColor)
      }

      // horizontal chart
      if (this.horizontal) {
        this.chart
          .attr('class', 'horizontal-stacked-bar-chart')
          .attr('width', 25)
          .style('top', `${ -this._height }px`)

        const selectedElement = d3.selectAll('.active')
        selectedElement
          .style('fill', secondaryColor)
      }
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  _legend () {
    try {
      let legend

      if (this.legend) {
        legend = this.legend
      }
      else {
        legend = this.createLegend()
      }

      this.legend = legend
      this.updateLegend()
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  select (index) {
    try {
      // console.debug("INdex: ", index, "I: ", this.selectedIndex)
      d3.selectAll('.bar').filter((d, i, nodes) => {
        if (i === index) {
          /*          this.xSelectedValue = d
                      this.ySelectedGroup = this.yGroupData(d)
                      this.selectedData(this.ySelectedGroup)
                      this.selectedIndex = index
          */

          const selectedElement = d3.selectAll('.active') // element.parentNode.querySelector('[selected=true]')
          if (selectedElement) {
            selectedElement.attr('selected', false)
            selectedElement.attr('class', 'bar')
          }
          d3.select(nodes[i]).attr('class', 'bar active')
        }
      })
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  legendHeaders (h) {
    // stub for public function
    // default return headers
    return h
  }

  _legendHeaders (xValue) {
    try {
      let r = []
      this.getSelected()
      const xLabels = this.xLabels(this.xDomain())
      // reduce this.data down to same length as yGroup
      const rData = this.data.filter(item => item.source === this.data[0].source)
      if (this.options.yGroupBy) {
        r = [this.options.yGroupBy, '', xValue || this.xSelectedValue]
      }
      else {
        r = [this.yAxis, xValue || this.xSelectedValue]
      }

      r = this.legendHeaders(r, { ...rData[this.currentIndex], xLabel: xLabels[this.currentIndex] })

      return r
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  createLegend (newData, xValue) {
    try {
      const self = this

      d3.select(this.node).selectAll('.legend-table').remove()
      d3.select(this.node).selectAll('.legend-rect').remove()

      const headers = this._legendHeaders(xValue)
      const table = d3.select(this.legendDiv).append('table')
        .attr('class', 'legend-table')
      const thead = table.append('thead')

      table.append('tbody')

      // append the header row
      thead.append('tr')
        .selectAll('th')
        .data(headers)
        .enter()
        .append('th')
        .style('text-transform', (d, i) => {
          if (self.showLegendUnits) {
            if (i < 1) {
              return 'capitalize'
            }
            else {
              return 'inherit'
            }
          }
          else {
            return 'capitalize'
          }
        })
        .attr('colspan', (d, i) => {
          if (i < 1) {
            return 2
          }
          else {
            return 1
          }
        })
        .text(function (column, i) {
          if (self.showLegendUnits) {
            return i === 2 ? `${ column } (${ self.units })` : column
          }
          else {
            return column
          }
        })
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  updateLegend (newData, xValue) {
    try {
      const self = this

      d3.select(this.node).selectAll('.legend-table tbody tr').remove()
      d3.select(this.node).selectAll('.legend-rect').remove()

      const legendReverse = this.legendReverse
      const data = newData || this.selectedData()
      const labels = this.yGroupings()
      const tbody = d3.select(this.node).selectAll('.legend-table tbody')
      const colorRange = this.colorRange
      const secondaryColor = this.secondaryColor

      // turn object into array
      let dataArr = Object.keys(data).map((key, i) => {
        return [labels[i], undefined, data[labels[i]]]
      }).reverse()

      if (this.legendReverse) {
        dataArr = dataArr.reverse()
      }

      // create a row for each object in the data
      const tr = tbody.selectAll('tr')
        .data(dataArr)
        .enter()
        .append('tr')

      // append color blocks into tr first cell
      tr.append('td')
        .append('svg')
        .attr('width', 20)
        .attr('height', 20)
        .style('fill', (d, i) => {
          if (colorRange) {
            return colorRange[i]
          }
          else {
            return secondaryColor
          }
        })
        .append('rect')
        .attr('class', 'legend-rect')
        .attr('width', 15)
        .attr('height', 15)
        .style('background-color', (d, i) => {
          if (colorRange) {
            return colorRange[i]
          }
          else {
            return secondaryColor
          }
        })
        .style('border', (d, i) => {
          if (colorRange) {
            return `1px solid ${ colorRange[i] }`
          }
          else {
            return `1px solid ${ secondaryColor }`
          }
        })
        .style('opacity', (d, i) => {
          if (this.horizontal && colorRange) {
            return null
          }
          else {
            if (legendReverse) {
              return (i < labels.length ? (1 - ((i) / labels.length)) : 0)
            }
            else {
              return (i < labels.length ? ((i + 1) / labels.length) : 0)
            }
          }
        })

      // create a cell in each row for each column

      tr.append('td')
        .html(function (d, i) {
          return self._legendFormat(d[0])
        })
      tr.append('td')
        .html(function (d, i) {
          return self._legendFormat(d[1])
        })
      tr.append('td')
        .html(function (d, i) {
          return self._legendFormat(d[2])
        })

      const total = Object.keys(data).reduce((sum, key) => sum + data[key], 0)

      const tfooter = tbody.append('tr')

      tfooter.append('td')
        .attr('colspan', 2)
        .style('font-weight', 'bold')
        .html('Total')

      tfooter.append('td')

      tfooter.append('td')
        .style('font-weight', 'bold')
        .html(self._legendFormat(total))
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  legendFormat (d) {
    // default format
    return d
  }

  _legendFormat (d) {
    try {
      if (isNaN(d)) {
        return d
      }
      else {
        return this.legendFormat(d)
      }
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  _onClick (e, d) {
    try {
      // console.debug('_onClick: ', e,d)
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  onClick (d) {
    // console.debug('_onClick: ', d)
    return d
  }

  _onSelect = (element, data) => {
    try {
      const selectedElement = d3.select(this.node).selectAll('.active') // element.parentNode.querySelector('[selected=true]')
      const primaryColor = this.primaryColor
      const secondaryColor = this.secondaryColor
      // console.debug(data)
      if (selectedElement) {
        selectedElement.attr('selected', false)
        selectedElement.attr('class', 'bar')
        selectedElement.attr('style', `fill: ${ primaryColor }`)
      }

      const activeElement = element.parentNode.parentNode
      activeElement.setAttribute('class', 'bar active')
      activeElement.setAttribute('selected', true)
      activeElement.setAttribute('style', `fill: ${ secondaryColor }`)
      activeElement.setAttribute('tabindex', 0)

      this.selectedData(data[0].data)
      this._legend()
      this.getSelected()
      this.onSelect(this)

      if (this.xAxis === 'year') this.handleBarHover({ year: this._xDomain[this.currentIndex] || this.xSelectedValue })
      if (this.xAxis === 'month_long') this.handleBarHover({ month_long: this._xDomain[this.currentIndex] || this._xDomain[this.xSelectedValue], xGroups: this.xGroups })
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  onSelect (d) {
    // console.debug('onSelect: ', d)
  }

  _onMouseover = (element, data) => {
    try {
      const selectedElement = d3.selectAll('.active')

      const tbody = d3.select(this.legendDiv).selectAll('tbody')
      const legendRows = tbody.selectAll('tr')
      const selectedRowIndex = data && data.index
      const selectedLegendRow = legendRows._groups[0][selectedRowIndex]

      if (selectedRowIndex !== null && selectedElement) {
        d3.select(selectedLegendRow)
          .transition()
          .duration(200)
          .style('background', '#e0e0e0')
          .style('font-weight', 'bold')
      }

      if (selectedElement) {
        selectedElement.attr('selected', false)
        selectedElement.attr('class', 'bar')
      }
      const activeElement = element.parentNode.parentNode
      activeElement.setAttribute('tabindex', 0)
      this.selectedData(data[0].data)
      // this._legend()
      this.onMouseover(this)
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  onMouseover (d) {
    return d
  }

  _onMouseout (element, data) {
    try {
      const tbody = d3.select(this.legendDiv).selectAll('tbody')
      const legendRows = tbody.selectAll('tr')
      const selectedRowIndex = data && data.index
      const selectedLegendRow = legendRows._groups[0][selectedRowIndex]

      if (selectedRowIndex !== null) {
        d3.select(selectedLegendRow)
          .transition()
          .duration(200)
          .style('background', 'none')
          .style('font-weight', 'normal')
      }
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  _onHover = (element, data, hover) => {
    try {
      const tabIndex = this.currentIndex
      const activeElement = element.parentNode.parentNode
      const activeHoverElement = d3.select(activeElement).classed('active')
      const primaryColor = this.primaryColor
      const secondaryColor = this.secondaryColor
      const horizontal = this.horizontal

      if (hover === true) {
        const years = this.xDomain()

        if (!horizontal) {
          this.createLegend(data[0].data, years[tabIndex])
          this.updateLegend(data[0].data, years[tabIndex])
        }

        activeElement.setAttribute('style', `fill: ${ secondaryColor }`)

        if (this.xAxis === 'year') this.handleBarHover({ year: this._xDomain[this.currentIndex] || this.xSelectedValue })
        if (this.xAxis === 'month_long') this.handleBarHover({ month_long: this._xDomain[this.currentIndex] || this._xDomain[this.xSelectedValue], xGroups: this.xGroups })
      }
      else {
        if (!activeHoverElement) {
          activeElement.setAttribute('style', `fill: ${ primaryColor }`)
        }
        this.getSelected()
        this.select(this.index)

        this.createLegend()
        this.updateLegend()

        if (this.xAxis === 'year') this.handleBarHover({ year: this.xSelectedValue })
        if (this.xAxis === 'month_long') this.handleBarHover({ month_long: this.xSelectedValue, xGroups: this.xGroups })
      }
      // this.onHover(this)
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  onHover (d) {
    console.debug('D3StackedBarChart onHover: ', d)
    return d
  }

  barOffsetX () {
    try {
      if (this.options.barSize) {
        return (this.xScale.bandwidth() > this.options.barSize) ? (this.xScale.bandwidth() - this.options.barSize) / 2 : 0
      }
      else {
        return 0
      }
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  maxBarSize () {
    try {
      if (this.options.barSize) {
        return d3.min([this.xScale.bandwidth(), this.options.barSize])
      }
      else {
        return this.xScale.bandwidth()
      }
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  xDomain () {
    try {
      const r = this.data.map((row, i) => {
        return row[this.xAxis]
      })
      //      const domain = [...(new Set(r.sort((a, b) => a - b)))]
      const domain = [...(new Set(r))]
      this._xDomain = domain
      return domain
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  yDomain () {
    try {
      const r = d3.nest()
        .key(k => k[this.xAxis])
        .rollup(v => d3.sum(v, i => i[this.yAxis]))
        .entries(this.data)
        .map(y => y.value)
      const domain = [...(new Set(r.sort((a, b) => a - b)))]
      this._yDomain = domain
      return domain
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  yOrder () {
    if (this.options.yOrderBy && this.options.yGroupBy) {
      if (typeof (this.options.yOrderBy) === 'object') {
        this.yOrderBy = this.options.yOrderBy
      }
      else if (typeof (this.options.yOrderBy) === 'string') {
        d3.nest()
          .key(k => k[this.options.yGroupBy])
          .rollup(v => d3.sum(v, d => d[this.yAxis]))
          .entries(this.data)
          .reduce((acc, d, i) => {
            acc[d.key] = d.value
            return acc
          }, {})
      }
      else {
        d3.nest()
          .key(k => k[this.options.yGroupBy])
          .rollup(v => d3.sum(v, d => d[this.yAxis]))
          .entries(this.data)
          .reduce((acc, d, i) => {
            acc[d.key] = d.value
            return acc
          }, {})
        // console.debug("else", r)
      }
    }
  }

  yGroupings (xValue) {
    try {
      if (this.options.yGroupBy) {
        const data = xValue ? this.data.filter(r => r[this.xAxis] === xValue) : this.data
        const r = d3.nest()
          .key(k => k[this.options.yGroupBy])
          .entries(data)
          .map(y => y.key)
        // console.debug(r)
        return r.reverse()
      }
      else {
        const data = xValue ? this.data.filter(r => r[this.xAxis] === xValue) : this.data
        const r = d3.nest()
          .key(k => k[this.yAxis])
          .entries(data)
          .map(y => y.key)
        return r.reverse()
      }
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  groupData () {
    try {
      const r = d3.nest()
        .key(k => k[this.xAxis])
        .entries(this.data)

      // console.debug("RRRR: ", r)
      return r
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  yGroupData (xValue) {
    try {
      if (this.options.yGroupBy) {
        const data = xValue ? this.data.filter(r => r[this.xAxis] === xValue) : this.data
        // console.debug(data)
        const r = d3.nest()
        //            .key(k => k[this.xAxis])
          .key(k => k[this.options.yGroupBy])
          .rollup(v => d3.sum(v, d => d[this.yAxis]))
          .entries(data)
          .reduce((acc, d, i) => {
            acc[d.key] = d.value
            return acc
          }, {})

        // console.debug("yGroupData: ",r)
        return r
      }
      else {
        return this.yAxis
      }
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  xMin () {
    try {
      return this.xDomain().shift()
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  xMax () {
    try {
      return this.xDomain().pop()
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  yMin () {
    try {
      return this.yDomain().shift()
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  yMax () {
    try {
      return this.yDomain().pop()
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }

  xaxis () {
    return this._columns[0]
  }

  xdomain () {
    try {
      const r = this.data.map((d, i) => d[this.xaxis()])
      // console.debug(r);
      return r
    }
    catch (err) {
      console.warn('error in xdomain:', err)
    }
  }

  ydomain (row) {
    try {
      const allowed = this.yaxis()
      const filtered = Object.keys(row)
        .filter(key => allowed.includes(key))
        .reduce((obj, key) => {
          obj[key] = row[key]
          return obj
        }, {})

      return filtered
    }
    catch (err) {
      console.warn('error in ydomain:', err)
    }
  }

  yaxis () {
    return this._columns.slice(1)
  }

  columns (value) {
    if (value) {
      this._columns = value
    }
    return this._columns
  }

  yLabels (value) {
    if (value) {
      this._yLabels = value
    }
    return this._yLabels
  }

  colors (value) {
    if (value) {
      this._colors = value
    }
    return this._colors
  }

  selectedData (value) {
    if (value) {
      this._selectedData = value
    }
    return this._selectedData
  }

  height (value) {
    if (value) {
      this._height = value
      this.chart.attr('height', value)
    }
    return this._height
  }

  width (value) {
    if (value) {
      this._width = value
      this.chart.attr('width', value)
    }
    return this._width
  }

  max () {
    const values = this.data.map((row, i) => {
      const t = this.yaxis().reduce((total, col, i) => {
        return total + row[col]
      }, 0)
      return t
    })
    return d3.max(values)
  }

  min () {
    const values = this.data.map((row, i) => {
      const t = this.yaxis().reduce((total, col, i) => {
        return total + row[col]
      }, 0)
      return t
    })
    return d3.min(values)
  }

  formatLegend (options) {
    try {
      if (options) {
        this._formatLegend = options
      }
      return this._formatLegend
    }

    catch (err) {
      console.warn('error in formatOptions:', err)
    }
  }

  getOrderedKeys (data) {
    return Object.keys((data[0][Object.keys(data[0])[0]])[0])
  }

  getSelected () {
    d3.select(this.node).selectAll('.bar').filter((d, i, nodes) => {
      if (nodes[i].className.baseVal.match(/active/)) {
        // console.debug("getSelected: ", i)
        this.xSelectedValue = d
        this.ySelectedGroup = this.yGroupData(d)
        this.selectedData(this.ySelectedGroup)
        // console.debug("Selecting index: ",i)
        this.selectedIndex = i
      }
    })
  }

  getCurrentIndex (value) {
    if (value) {
      this.currentIndex = value
    }
    return this.currentIndex
  }

  toggleSelectedBar = (element, data, callBack) => {
    const selectedElement = d3.selectAll('.active') // element.parentNode.querySelector('[selected=true]')

    if (selectedElement) {
      selectedElement.attr('selected', false)
      selectedElement.attr('class', 'bar')
    }
    const activeElement = element.parentNode.parentNode
    activeElement.setAttribute('class', 'bar active')
    activeElement.setAttribute('selected', true)
    activeElement.setAttribute('tabindex', 0)
    this.selectedData(data[0].data)
    this.addLegend()
    this.getSelected()
    if (callBack) {
      callBack(data)
    }
  }

  // eslint-disable-next-line camelcase
  dep_addChart (data) {
    if (data) {
      this.data = data
    }
    const self = this
    const stack = d3.stack()
	  .keys(this.yaxis())
	  .offset(d3.stackOffsetNone)

    // console.debug(xwidth);
    const keys = this.yaxis()
    this.chart.append('g')
      .attr('class', 'bars')
      .selectAll('g')
      .data(self.data)
      .enter().append('g')
      .attr('height', (self._height - self.marginTop))
      .attr('width', self.xScale.bandwidth())
      .attr('transform', d => 'translate(' + (self.xScale(d[self.xaxis()]) + ',0)'))
      .attr('class', (d, i) => i === self.selectedIndex ? 'bar active' : 'bar')
      .attr('data-key', d => Object.keys(d)[0])
      .attr('tabindex', 0)
      .selectAll('g')
      .data(d => {
        // console.debug("ROW", d)
        const yd = self.ydomain(d)

        // console.debug("YD", yd)
        const r = stack([yd])
        // console.debug("STACK", r);
        return r
      })
      .enter().append('g')
    //    .attr('class', d => self.styleMap && self.styleMap[d.key])
      .attr('class', (d, i) => 'stacked-bar-chart-' + i)
      .attr('fill-opacity', (d, i) => (1 - (i / keys.length)))
      .append('rect')
      .attr('y', d => {
        return self.yScale(d[0][1]) || 0
      })
      .attr('height', function (d) {
        return (self.yScale(d[0][0]) - self.yScale(d[0][1])) || 0
      })
      .attr('width', self.maxBarSize)
      .attr('x', self.barOffsetX)
      .on('click', function (d) {
        // console.debug(' onclick:', d)
        self.toggleSelectedBar(this, d, self.onSelect(d))
        self.onClick(self)
      })
      .on('mouseover', function (d) {
        self.toggleSelectedBar(this, d, self.onSelect(d))
        self.onClick(self)
      })
  }

  drawDep () {
    if (this.data === undefined) {
      return
    }

    this.chart.selectAll('#backgroundRec').remove()
    this.addBackgroundRect()

    this.chart.selectAll('.maxExtent').remove()
    this.addMaxExtent()

    this.chart.selectAll('.bars').remove()
    this.addChart(this.data)

    this.chart.selectAll('.x-axis').remove()

    this.addXAxis(this.xLabels())

    // Add Grouping Lines
    this.chart.selectAll('.groups').remove()
    this.addGroupLines()

    this.addLegend()
  }

  addMaxExtent (units) {
    try {
      const self = this
      // Add Max Extent Number text
      const maxExtentGroup = self.chart.append('g').attr('class', 'maxExtent')
      const maxExtentValue = this.calculateExtentValue(this.maxValue)
      if (!units) {
        units = ''
      }
      maxExtentGroup.append('text')
        .attr('width', self._width)
        .attr('x', self._width)
        .attr('y', (self.maxExtentLineY - 5))
        .attr('text-anchor', 'end')
        .text((units === 'dollars' || units === '$') ? ['$', maxExtentValue].join('') : [maxExtentValue, units].join(''))

      maxExtentGroup.append('line')
        .attr('x1', 0)
        .attr('x2', self._width)
        .attr('stroke', '#a7bcc7')
        .attr('stroke-dasharray', [5, 5])
        .attr('stroke-width', 1)
        .attr('transform', 'translate(' + [0, self.maxExtentLineY] + ')')
    }
    catch (e) {
      console.warn('Error in addMaxExtent', e)
    }
  }

  addXAxis (xLabels) {
    const self = this
    /*    const createXAxis = () => (d3.axisBottom(self.xScale).tickSize(0).tickFormat((d, i) => {
          console.debug('---------------tickFormat: ', d, i, xLabels)
          return (xLabels) ? xLabels[i] : d
          }))
    */
    const createXAxis = () => (d3.axisBottom(self.xScale).tickSize(0).tickFormat((d, i) => {
      return xLabels[i]
    }))
    const rotate = this.options.xRotate || 0
    let x = -1
    const y = 8
    if (rotate !== 0) {
      x = -11
    }
    self.chart.append('g')
      .attr('class', 'x-axis')
      .attr('transform', 'translate(0,' + (self._height - self.marginBottom) + ')')
      .call(createXAxis())
      .selectAll('text')
      .attr('transform', 'rotate(' + rotate + ')')
      .attr('x', x)
      .attr('y', y)
  }

  addGroupLines () {
    if (this.groups) {
      const self = this

      const groupLines = this.chart.append('g').attr('class', 'groups')
      const groupItemWidth = (self._width / self.te.length)
      const padding = (self.xScale.bandwidth() * 0.2)
      let xPos = 0

      Object.keys(self.groups).map((name, index) => {
        const groupLineWidth = xPos + (groupItemWidth * self.groups[name].length) - padding

        groupLines.append('line')
	  .attr('x1', xPos + padding)
	  .attr('x2', groupLineWidth)
	  .attr('stroke', '#a7bcc7')
	  .attr('stroke-width', 1)
	  .attr('transform', 'translate(' + [0, self._height - 4 - self.marginBottom / 2] + ')')

        groupLines.append('text')
	  .attr('x', ((xPos + padding) / 2) + (groupLineWidth / 2))
	  .attr('y', self._height - 16)
	  .attr('text-anchor', 'middle')
	  .text(name)

        xPos = groupLineWidth + padding
      }
				  )
    }
  }

  createTable () {
    d3.selectAll('.legend-table').remove()
    this.getSelected()

    const columns = this.options.columnNames
    columns.splice(this.options.columnNames.length - 1, 1, this.selectedFiscalYear)
    const table = d3.select(this.legendDiv).append('table')
      .attr('class', 'legend-table')
    const thead = table.append('thead')

    table.append('tbody')

    // append the header row
    thead.append('tr')
      .selectAll('th')
      .data(columns)
      .enter()
      .append('th')
      .text(function (column) {
        return column
      })
  }

  updateTable () {
    d3.selectAll('.legend-table tbody tr').remove()
    this.getSelected()

    const data = this.selectedData()
    const columns = this.options.columnNames
    columns.splice(this.options.columnNames.length - 1, 1, this.selectedFiscalYear)

    const labels = this.yLabels()
    const formatLegend = this.formatLegend()
    // const table = d3.selectAll('.legend-table')
    const tbody = d3.selectAll('.legend-table tbody')

    // turn object into array to play nice with d3
    const dataArr = Object.keys(data).map((key, i) => {
      return ['', labels[i], data[key]]
    }).reverse()

    // create a row for each object in the data
    const tr = tbody.selectAll('tr')
      .data(dataArr)
      .enter()
      .append('tr')

    // append color blocks into tr first cell
    tr.append('td')
      .append('rect')
      .attr('class', 'legend-rect')
      .attr('width', 15)
      .attr('height', 15)
      .style('opacity', (d, i) => ((i + 1) / labels.length))

    // create a cell in each row for each column
    tr.selectAll('td')
      .data(function (row, i) {
        return columns.map(function (column, i) {
          return { column: column, value: row[i] }
        })
      })
      .enter()
      .append('td')
      .html(function (d) {
        if (Number.isInteger(d.value)) {
          return formatLegend(d.value, 0)
        }
        else {
          return d.value
        }
      })
  }

  addLegend () {
    let legend = this.createTable()

    if (this.legend) {
      this.legend.selectAll('.legend-table').remove()
      this.legend.selectAll('.legend-rect').remove()
      legend = this.legend
    }
    else {
      this.updateTable()
    }

    this.legend = legend
  }

  getMetricLongUnit (str) {
    try {
      const suffix = { k: 'k', M: ' million', G: ' billion' }
      return str.replace(/(\.0+)?([kMG])$/, function (_, zeroes, s) {
        return suffix[s] || s
      })
    }
    catch (err) {
      console.warn('error in formatOptions:', err)
    }
  }

  calculateExtentValue (maxValue) {
    const maxValueExtent = Math.ceil(maxValue * (1 + this.extentPercent))
    return this.getMetricLongUnit(d3.format(this.setSigFigs(maxValue, maxValueExtent))(maxValueExtent))
  }

  crawlCeil (ymax, ceilMax, i) {
    try {
      // When ymax is a value less than 10, the ratio of ceilMax and ymax will never
      // be less than (1 + extentMarginOfError + extentPercent), and the function will continue
      // be called in its parent function's while loop.

      const sigFig = '.' + i + 's'

      /* var sigFigCeil = +eiti.format.transform(
         sigFig,
         eiti.format.siValue
         )(ceilMax); */

      const sigFigCeil = siValue(d3.format(sigFig)(ceilMax))

      const ceilIsLargerThanValue = sigFigCeil > +ymax
      let ceilIsntTooBig = (sigFigCeil / +ymax) <= (1 + this.extentMarginOfError + this.extentPercent)
      if (!ceilIsntTooBig) {
        ceilIsntTooBig = ((sigFigCeil - ymax) < 10) // Accomodate for small numbers if the difference is smal then this should be acceptable
      }
      const justRight = ceilIsLargerThanValue && ceilIsntTooBig
      return justRight ? sigFig : ''
    }
    catch (err) {
      console.warn('error: ', err)
    }
  }

  setSigFigs (ymax, ceilMax) {
    try {
      let sigFigs = ''
      let SF = 0
      while (sigFigs.length < 3) {
        SF++
        sigFigs = this.crawlCeil(ymax, ceilMax, SF)
      }
      return sigFigs
    }
    catch (err) {
      console.warn('error: ', err)
    }
  }

  addBackgroundRect () {
    this.chart.append('rect')
      .attr('class', 'stacked-bar-chart-background')
      // .attr('id', 'backgroundRect') // need unique ids for accessibility score
      .style('opacity', 0.0)
      .attr('y', 0)
      .attr('height', this._height)
      .attr('width', this._width)
      .attr('x', 0)
  }

  // Circle tooltips
  chartTooltip (data, xAxis, yAxis) {
    const r = ['', '']
    return r
  }

  _chartTooltip (data) {
    try {
      const r = this.chartTooltip(data)
      return r
    }
    catch (err) {
      console.warn('Error: ', err)
    }
  }
}

/**
 * This is a format transform that turns a value
 * into its si equivalent
 *
 * @param {String} str the formatted string
 * @return {String} the string with a specified number of significant figures
 */
const siValue = (function () {
  const suffix = { k: 1000, M: 1000000, G: 1000000000 }
  return function (str) {
    try {
      let number
      str = str.replace(/(\.0+)?([kMG])$/, function (_, zeroes, s) {
        number = str.replace(s, '').toString() || str
        return (+number * suffix[s])
      }).replace(/\.0+$/, '')
      if (number) {
        return str.slice(number.length, str.length)
      }
      else {
        return str
      }
    }
    catch (err) {
      console.warn('error: ', err)
    }
  }
})()
