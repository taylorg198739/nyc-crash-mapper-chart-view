import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import mapFilterTypesToProps, { filterValuesByDateRange } from '../common/utils';
import { allEntityData, filterEntitiesValues } from '../reducers';
import LineChart from '../components/LineChart';

/**
 * Connected Component that houses the D3 Line Charts
 */
class LineChartsContainer extends Component {
  static propTypes = {
    appHeight: PropTypes.number.isRequired,
    appWidth: PropTypes.number.isRequired,
    primary: PropTypes.shape({
      key: PropTypes.string,
      values: PropTypes.array,
    }).isRequired,
    secondary: PropTypes.shape({
      key: PropTypes.string,
      values: PropTypes.array,
    }).isRequired,
    nested: PropTypes.arrayOf(PropTypes.object),
    citywidePeriod1: PropTypes.arrayOf(PropTypes.object),
    citywidePeriod2: PropTypes.arrayOf(PropTypes.object),
    dateRangeTwo: PropTypes.shape({
      endDate: PropTypes.instanceOf(Date),
      startDate: PropTypes.instanceOf(Date),
    }),
    dateRangeOne: PropTypes.shape({
      endDate: PropTypes.instanceOf(Date),
      startDate: PropTypes.instanceOf(Date),
    }),
    valuesDateRange1: PropTypes.shape({
      primary: PropTypes.shape({
        key: PropTypes.string,
        values: PropTypes.array,
      }),
      secondary: PropTypes.shape({
        key: PropTypes.string,
        values: PropTypes.array,
      }),
    }).isRequired,
    valuesDateRange2: PropTypes.shape({
      primary: PropTypes.shape({
        key: PropTypes.string,
        values: PropTypes.array,
      }),
      secondary: PropTypes.shape({
        key: PropTypes.string,
        values: PropTypes.array,
      }),
    }).isRequired,
  };

  static defaultProps = {
    nested: [],
    citywidePeriod1: [],
    citywidePeriod2: [],
    dateRangeOne: {},
    dateRangeTwo: {},
  };

  render() {
    const {
      appHeight,
      appWidth,
      nested,
      primary,
      secondary,
      dateRangeOne,
      dateRangeTwo,
      valuesDateRange1,
      valuesDateRange2,
    } = this.props;

    const style = {
      height: '100%',
      width: '100%',
    };

    return (
      <div className="LineChartsContainer" style={style}>
        <LineChart
          appHeight={appHeight}
          appWidth={appWidth}
          nested={nested}
          keyPrimary={primary.key}
          keySecondary={secondary.key}
          {...dateRangeTwo}
          valuesByDateRange={valuesDateRange2}
        />
        <LineChart
          appHeight={appHeight}
          appWidth={appWidth}
          nested={nested}
          keyPrimary={primary.key}
          keySecondary={secondary.key}
          {...dateRangeOne}
          valuesByDateRange={valuesDateRange1}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { browser, data, entities, filterType, dateRanges } = state;
  // NOTE: the values stored in primary and secondary entities ARE NOT FILTERED,
  // they need to be filtered prior to being passed to the line charts
  const { height, width } = browser;
  const { citywide } = data;
  const { primary, secondary } = entities;
  const { group1, group2 } = dateRanges;

  // filter primary and secondary entity data by date ranges
  const { valuesDateRange1, valuesDateRange2 } = filterEntitiesValues(state);

  // data for the current geography / entity
  const entityData = allEntityData(state);

  // citywide data which always(?) shows up on the line chart
  const citywideValues = citywide.response || [];
  const citywidePeriod1 = mapFilterTypesToProps(
    filterType,
    filterValuesByDateRange(citywideValues, group1.startDate, group1.endDate)
  );
  const citywidePeriod2 = mapFilterTypesToProps(
    filterType,
    filterValuesByDateRange(citywideValues, group2.startDate, group2.endDate)
  );

  return {
    appHeight: height,
    appWidth: width,
    citywidePeriod1,
    citywidePeriod2,
    nested: entityData.nested,
    primary,
    secondary,
    dateRangeOne: group1,
    dateRangeTwo: group2,
    valuesDateRange1,
    valuesDateRange2,
  };
};

export default connect(mapStateToProps, null)(LineChartsContainer);
