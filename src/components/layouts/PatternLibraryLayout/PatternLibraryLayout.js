import React from 'react'
import Helmet from 'react-helmet'
import PropTypes from 'prop-types'
import { StaticQuery, graphql } from 'gatsby'

import Drawer from './ResponsiveDrawer'
import './PatternLibraryLayout.css'

const PatternLibraryLayout = ({ children }) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery2 {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={data => (
      <>
        <Helmet htmlAttributes={{ lang: 'en' }}>
          <title>{data.site.siteMetadata.title}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        </Helmet>
        <Drawer title={data.site.siteMetadata.title + ' Pattern Library'}>
          {children}
        </Drawer>
      </>
    )}
  />
)

PatternLibraryLayout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default PatternLibraryLayout
