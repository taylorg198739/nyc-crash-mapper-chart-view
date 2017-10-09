import {
  ENTITY_DATA_REQUEST,
  ENTITY_DATA_SUCCESS,
  ENTITY_DATA_ERROR,
  RANK_DATA_REQUEST,
  RANK_DATA_SUCCESS,
  RANK_DATA_ERROR,
} from '../common/actionTypes';

const defaultState = {
  errorCharts: null, // any error from the charts data request
  errorRanked: null, // any error from the ranked list data request
  isFetchingCharts: false, // is the app waiting on a chart data request?
  isFetchingRanked: false, // is the app waiting on ranked list data request?
  borough: {}, // hash to store borough data
  city_council: {}, // ... city council district data
  citywide: {}, // ... citywide data
  community_board: {}, // ... community board data
  nta: {}, // ... neighborhood (tabulation area) data
  nypd: {}, // ... nypd precinct data
};

export default function(state = defaultState, action) {
  switch (action.type) {
    case ENTITY_DATA_REQUEST:
      return {
        ...state,
        isFetchingCharts: true,
      };

    case ENTITY_DATA_SUCCESS:
      return {
        ...state,
        isFetchingCharts: false,
        [action.geo]: {
          ...state[action.geo],
          response: action.response, // data unformatted from the API call
        },
      };

    case ENTITY_DATA_ERROR:
      return {
        ...state,
        isFetchingCharts: false,
        errorCharts: action.error,
      };

    case RANK_DATA_REQUEST:
      return {
        ...state,
        isFetchingRanked: true,
      };

    case RANK_DATA_SUCCESS:
      return {
        ...state,
        isFetchingRanked: false,
        [action.geo]: {
          ...state[action.geo],
          ranked: action.ranked,
        },
      };

    case RANK_DATA_ERROR:
      return {
        ...state,
        isFetchingRanked: false,
        errorRanked: action.error,
      };

    default:
      return state;
  }
}
