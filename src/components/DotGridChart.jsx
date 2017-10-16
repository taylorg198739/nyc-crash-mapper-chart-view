import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

import * as pt from '../common/reactPropTypeDefs';

class DotGridChart extends Component {
  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.object),
    subheadHeights: PropTypes.shape({
      cyclist: PropTypes.number,
      motorist: PropTypes.number,
      pedestrian: PropTypes.number,
    }),
    startDate: pt.date.isRequired,
    endDate: pt.date.isRequired,
    radius: PropTypes.number,
    title: PropTypes.string,
  };

  static defaultProps = {
    data: [],
    subheadHeights: {},
    radius: 3,
    title: '',
  };

  constructor(props) {
    super(props);
    this.container = null; // ref to chart container
    this.svg = null; // ref to svg

    // chart margins
    this.margin = { top: 10, bottom: 25, left: 0, right: 0 };
    // color scale
    this.colorScale = d3
      .scaleOrdinal(['#FFDB65', '#FF972A', '#FE7B8C'])
      .domain(['pedestrian', 'cyclist', 'motorist']);

    // radius of circles
    // TO DO: make it a prop
    this.radius = props.radius;
    this.formatTime = d3.timeFormat('%b %Y');
  }

  getContainerSize() {
    // returns the width and height for the svg element based on the parent div's width height, which is set via CSS
    const bcr = this.container.getBoundingClientRect();
    const cWidth = Math.floor(bcr.width) - this.margin.right - this.margin.left;
    const cHeight = Math.floor(bcr.height) - this.margin.top - this.margin.bottom;

    return {
      height: cHeight,
      width: cWidth,
    };
  }

  renderGrids() {
    const { data, subheadHeights } = this.props;
    if (!data.length) return null;
    const colorScale = this.colorScale;
    const radius = this.radius;
    const { width } = this.getContainerSize();

    return data.map(datum => {
      const { grid, key, killed, injured, killedTotal, injuredTotal } = datum;
      const personType = key;

      // TO DO: replace SVG with Canvas? Boroughs take a while to render...
      return (
        <div className="person-type-grids" key={personType}>
          {killed.length ? <h6>{`${personType} killed: ${killedTotal}`}</h6> : null}
          {injured.length ? <h6>{`${personType} injured: ${injuredTotal}`}</h6> : null}
          <svg width={width} height={subheadHeights[personType]}>
            <g transform={`translate(5,5)`}>
              {grid.map((d, i) => (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={radius}
                  stroke={colorScale(personType)}
                  fill={i + 1 <= killedTotal ? colorScale(personType) : 'none'}
                />
              ))}
            </g>
          </svg>
        </div>
      );
    });
  }

  render() {
    const { data } = this.props;
    const { startDate, endDate, title } = this.props;

    return (
      <div
        className="DotGridChart"
        ref={_ => {
          this.container = _;
        }}
      >
        {data.length > 0 && (
          <div className="dot-grid-title">
            <h6>{title}</h6>
            <h6>{`${this.formatTime(startDate)} – ${this.formatTime(endDate)}`}</h6>
          </div>
        )}
        {this.renderGrids()}
      </div>
    );
  }
}

export default DotGridChart;
