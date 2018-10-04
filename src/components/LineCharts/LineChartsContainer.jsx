import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { max } from 'd3';
import { connect } from 'react-redux';

import { setTrendAggregation } from '../../actions';

import LineChartWrapper from '../../containers/LineChartWrapper';
import ReferenceEntitySelect from '../../containers/ReferenceEntitySelect';

const mapStateToProps = ({ aggmonths }) => ({
  aggmonths,
});

/**
 * Class that houses the the Line Charts
 * Uses internal state to track entity values & compute max y values for primary & secondary entities
   and reference entity, so that both charts share the same y domains
 */
class LineChartsContainer extends Component {
  static propTypes = {
    aggmonths: PropTypes.number.isRequired,
    setTrendAggregation: PropTypes.func.isRequired,
  };

  static defaultProps = {
    aggmonths: 1,
  };

  constructor() {
    super();
    this.state = {
      period1Y: [],
      period2Y: [],
      period1Y2: [],
      period2Y2: [],
    };
    this.setPeriodYValue = this.setPeriodYValue.bind(this);
    this.handleChangeAggMonths = this.handleChangeAggMonths.bind(this);
  }

  setPeriodYValue(type, values) {
    if (values && values.length) {
      this.setState({
        [type]: values,
      });
    }
  }

  handleChangeAggMonths(event) {
    const months = parseInt(event.target.value, 10);
    this.props.setTrendAggregation(months);
  }

  render() {
    const { period1Y, period2Y, period1Y2, period2Y2 } = this.state;
    const { aggmonths } = this.props;

    const style = {
      height: '100%',
      width: '100%',
    };

    // both line charts should share the same y domain for primary secondary & reference,
    // so compute the max value of each here then pass it down to the charts
    const y = [...period1Y, ...period2Y];
    const y2 = [...period1Y2, ...period2Y2];

    const entitiesMax = max(y, d => d.count);
    const citywideMax = max(y2, d => d.count);

    const xaxisselector = (
      <span className="TrendMonthsAggSelector">
        <label htmlFor="trend-months-agg-selector">Aggregate Every</label>
        <select
          id="trend-months-agg-selector"
          value={aggmonths}
          onChange={this.handleChangeAggMonths}
        >
          <option value="1">Month</option>
          <option value="3">3 Months</option>
          <option value="6">6 Months</option>
          <option value="12">12 Months</option>
        </select>
      </span>
    );

    return (
      <div className="LineChartsContainer scroll" style={style}>
        <LineChartWrapper
          period="period1"
          yMax={entitiesMax}
          y2Max={citywideMax}
          setMaxY={this.setPeriodYValue}
          aggmonths={parseInt(aggmonths, 10)}
        >
          {xaxisselector}
          <ReferenceEntitySelect />
        </LineChartWrapper>
        <LineChartWrapper
          period="period2"
          yMax={entitiesMax}
          y2Max={citywideMax}
          setMaxY={this.setPeriodYValue}
          aggmonths={parseInt(aggmonths, 10)}
        />
      </div>
    );
  }
}

export default connect(mapStateToProps, {
  setTrendAggregation,
})(LineChartsContainer);
