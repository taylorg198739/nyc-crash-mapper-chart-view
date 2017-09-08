import {
  SET_ENTITY_TYPE,
  SELECT_PRIMARY_ENTITY,
  DESELECT_PRIMARY_ENTITY,
  SELECT_SECONDARY_ENTITY,
  DESELECT_SECONDARY_ENTITY,
} from '../common/actionTypes';

const defaultState = {
  primary: {
    color: '#393B79',
    key: '',
    values: [],
  },
  secondary: {
    color: '#843C39',
    key: '',
    values: [],
  },
  entityType: '',
};

export default function(state = defaultState, action) {
  switch (action.type) {
    case SET_ENTITY_TYPE:
      return {
        ...state,
        entityType: action.entityType,
      };

    case SELECT_PRIMARY_ENTITY:
      return {
        ...state,
        primary: {
          color: state.primary.color,
          ...action.entity,
        },
      };

    case DESELECT_PRIMARY_ENTITY:
      return {
        ...state,
        primary: {
          color: state.primary.color,
          key: '',
          values: [],
        },
      };

    case SELECT_SECONDARY_ENTITY:
      return {
        ...state,
        secondary: {
          color: state.secondary.color,
          ...action.entity,
        },
      };

    case DESELECT_SECONDARY_ENTITY:
      return {
        ...state,
        secondary: {
          color: state.secondary.color,
          key: action.key,
          values: [],
        },
      };

    default:
      return state;
  }
}