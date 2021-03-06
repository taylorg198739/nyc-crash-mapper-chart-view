// this module contains template strings that form SQL queries that are passed to CARTO's SQL API
import sls from 'single-line-string'; // sls turns a multiline string into a single line

export const sqlNameField = geo => {
  // more hacks around someone hardcoding the geography type as the would-be name field,
  // so we can prefix with borough name and skip any which lack a borough name; issue 103
  let prefix;
  switch (geo) {
    case 'community_board':
      prefix = 'Community Board';
      break;
    case 'city_council':
      prefix = 'City Council';
      break;
    case 'assembly':
      prefix = 'Assembly District';
      break;
    case 'senate':
      prefix = 'Senate District';
      break;
    case 'nypd_precinct':
      prefix = 'NYPD Precinct';
      break;
    default:
      prefix = '';
      break;
  }

  let namefield;
  switch (geo) {
    case 'community_board':
    case 'nypd_precinct':
      namefield = `CASE WHEN borough != '' THEN CONCAT(borough, ', ', '${prefix}', ' ', ${geo}) ELSE CONCAT(' No Borough, ', '${prefix}', ' ', ${geo}) END`;
      break;
    default:
      if (prefix) {
        namefield = `CONCAT('${prefix}', ' ', ${geo})`;
      } else {
        namefield = geo;
      }
      break;
  }

  return namefield;
};

export const sqlExcludeBorough = geo => {
  // more hacks around someone hardcoding the geography type as the would-be name field,
  // so we can prefix with borough name and skip any which lack a borough name; issue 103
  let excludenoborough = '';
  switch (geo) {
    case 'community_board':
    case 'neighborhood':
    case 'nypd_precinct':
      excludenoborough = `AND borough IS NOT NULL AND borough != ''`;
      break;
    default:
      excludenoborough = 'TRUE';
      break;
  }

  return excludenoborough;
};

export const sqlNameByGeoAndIdentifier = (geo, identifier) => {
  // more hacks around someone hardcoding the geography type as the would-be name field,
  // so we can prefix with borough name and skip any which lack a borough name; issue 103
  // and so that per issue 97 we can resolve a geo & identifier onto a "identifier"
  // as it appears in this Chart, e.g. district, 123 => "Borough, District Name 123"
  const namefield = sqlNameField(geo);

  let queryvalue = typeof identifier === 'number' ? identifier.toString() : identifier;
  const escaped = `E'${queryvalue.replace("'", "''")}'`;

  switch (geo) {
    case 'neighborhood':
      queryvalue = escaped;
      break;
    default:
      break;
  }

  const sql = `SELECT ${namefield} AS areaname FROM crashes_all_prod WHERE ${geo}=${queryvalue}`;
  return sql;
};

// SQL clause to filtr by vehicle type flags
const vehicleFilterClause = vehicleFilter => {
  // when changing boundary type, this can go null briefly, and causes an error
  if (!vehicleFilter) return 'TRUE';

  // compose the list of fields to OR together
  const { vehicle } = vehicleFilter;

  const anyofthese = [];
  if (vehicle.car) anyofthese.push('hasvehicle_car');
  if (vehicle.truck) anyofthese.push('hasvehicle_truck');
  if (vehicle.motorcycle) anyofthese.push('hasvehicle_motorcycle');
  if (vehicle.bicycle) anyofthese.push('hasvehicle_bicycle');
  if (vehicle.suv) anyofthese.push('hasvehicle_suv');
  if (vehicle.busvan) anyofthese.push('hasvehicle_busvan');
  if (vehicle.scooter) anyofthese.push('hasvehicle_scooter');

  // other is really other OR unknown/unmatched
  if (vehicle.other) {
    anyofthese.push(sls`
      hasvehicle_other OR (
        NOT hasvehicle_car AND
        NOT hasvehicle_truck AND
        NOT hasvehicle_motorcycle AND
        NOT hasvehicle_bicycle AND
        NOT hasvehicle_suv AND
        NOT hasvehicle_busvan AND
        NOT hasvehicle_scooter AND
        NOT hasvehicle_other
      )
    `);
  }

  const whereClause = anyofthese.length ? `(${anyofthese.join(' OR ')})` : 'TRUE';

  return whereClause;
};

// Query that returns aggregated data for entire city, note this will include data that hasn't been geocoded
export const sqlCitywide = vehicles => {
  const vehicleclause = vehicleFilterClause(vehicles);

  const sql = sls`
  SELECT
      COUNT(c.cartodb_id) as total_crashes,
      SUM(c.number_of_cyclist_injured) as cyclist_injured,
      SUM(c.number_of_cyclist_killed) as cyclist_killed,
      SUM(c.number_of_motorist_injured) as motorist_injured,
      SUM(c.number_of_motorist_killed) as motorist_killed,
      SUM(c.number_of_pedestrian_injured) as pedestrian_injured,
      SUM(c.number_of_pedestrian_killed) as pedestrian_killed,
      SUM(c.number_of_pedestrian_injured + c.number_of_cyclist_injured + c.number_of_motorist_injured) as persons_injured,
      SUM(c.number_of_pedestrian_killed + c.number_of_cyclist_killed + c.number_of_motorist_killed) as persons_killed,
      year || '-' || LPAD(month::text, 2, '0') as year_month
    FROM
      crashes_all_prod c
    WHERE
      ${vehicleclause}
    GROUP BY year, month
    ORDER BY year asc, month asc
  `;
  return sql;
};

// Query that returns aggregated data by geography, such as Borough or City Council Districts
// @param {string} geo Name of column for a given geography for use in the SQL group by clause
export const sqlByGeo = (geo, vehicles) => {
  const namefield = sqlNameField(geo);
  const excludenoborough = sqlExcludeBorough(geo);
  const vehicleclause = vehicleFilterClause(vehicles);

  const sql = sls`
    SELECT
      COUNT(c.cartodb_id) as total_crashes,
      ${namefield} AS ${geo},
      SUM(c.number_of_cyclist_injured) as cyclist_injured,
      SUM(c.number_of_cyclist_killed) as cyclist_killed,
      SUM(c.number_of_motorist_injured) as motorist_injured,
      SUM(c.number_of_motorist_killed) as motorist_killed,
      SUM(c.number_of_pedestrian_injured) as pedestrian_injured,
      SUM(c.number_of_pedestrian_killed) as pedestrian_killed,
      SUM(c.number_of_pedestrian_injured + c.number_of_cyclist_injured + c.number_of_motorist_injured) as persons_injured,
      SUM(c.number_of_pedestrian_killed + c.number_of_cyclist_killed + c.number_of_motorist_killed) as persons_killed,
      year || '-' || LPAD(month::text, 2, '0') as year_month
    FROM crashes_all_prod c
    WHERE
      the_geom IS NOT NULL
      AND ${geo} IS NOT NULL AND ${geo}::text != ''
      AND ${excludenoborough}
      AND ${vehicleclause}
    GROUP BY year_month, ${namefield}
    ORDER BY year_month asc, ${namefield} asc
  `;
  return sql;
};

export const sqlIntersection = vehicles => {
  // tip for writing more "what places exist?" queries in the future
  // - the "geo" given to trigger this query, is presumed to be the name of a field,
  // e.g. "intersection" query should have a "intersection" field, being a unique ID ("key")

  // specific to Intersections though:
  // they do not have unique names, e.g. SMITH ST & OAK AVE could intersect multiple times
  // so our unique ID is concat'd name|id
  // labelFormatters.js entityIdDisplay() and entityLabelDisplay() tease these apart for label purposes vs ID purposes
  const vehicleclause = vehicleFilterClause(vehicles);

  const maxintersections = 500;
  const sql = sls`
    SELECT
      CONCAT(UPPER(intersections.borough), ', ', intersections.name, '|', intersections.cartodb_id) AS intersection,
      COUNT(c.cartodb_id) as total_crashes,
      SUM(c.number_of_cyclist_injured) as cyclist_injured,
      SUM(c.number_of_cyclist_killed) as cyclist_killed,
      SUM(c.number_of_motorist_injured) as motorist_injured,
      SUM(c.number_of_motorist_killed) as motorist_killed,
      SUM(c.number_of_pedestrian_injured) as pedestrian_injured,
      SUM(c.number_of_pedestrian_killed) as pedestrian_killed,
      SUM(c.number_of_pedestrian_injured + c.number_of_cyclist_injured + c.number_of_motorist_injured) as persons_injured,
      SUM(c.number_of_pedestrian_killed + c.number_of_cyclist_killed + c.number_of_motorist_killed) as persons_killed,
      c.year || '-' || LPAD(c.month::text, 2, '0') as year_month
    FROM
      crashes_all_prod c,
      (SELECT * FROM nyc_intersections WHERE crashcount IS NOT NULL AND borough != '' ORDER BY crashcount DESC LIMIT ${maxintersections}) intersections
    WHERE
      c.the_geom IS NOT NULL AND ST_CONTAINS(intersections.the_geom, c.the_geom)
      AND ${vehicleclause}
    GROUP BY year_month, intersection
    ORDER BY year_month asc, intersection asc
  `;
  return sql;
};

export const sqlCustomGeography = (latlngs, vehicles) => {
  // latlngs param is a "coordinatelist" e.g. from customGeography
  // compose WKT to find crashes contained within this polygonal area
  const wkt = sls`
    ST_GEOMFROMTEXT(
      'POLYGON((${latlngs.map(coord => [coord[0], coord[1]].join(' ')).join(', ')}))'
      , 4326
    )
  `;

  const vehicleclause = vehicleFilterClause(vehicles);

  const sql = sls`
    SELECT
      COUNT(c.cartodb_id) as total_crashes,
      SUM(c.number_of_cyclist_injured) as cyclist_injured,
      SUM(c.number_of_cyclist_killed) as cyclist_killed,
      SUM(c.number_of_motorist_injured) as motorist_injured,
      SUM(c.number_of_motorist_killed) as motorist_killed,
      SUM(c.number_of_pedestrian_injured) as pedestrian_injured,
      SUM(c.number_of_pedestrian_killed) as pedestrian_killed,
      SUM(c.number_of_pedestrian_injured + c.number_of_cyclist_injured + c.number_of_motorist_injured) as persons_injured,
      SUM(c.number_of_pedestrian_killed + c.number_of_cyclist_killed + c.number_of_motorist_killed) as persons_killed,
      year || '-' || LPAD(month::text, 2, '0') as year_month
    FROM
      crashes_all_prod c
    WHERE
      ST_CONTAINS(${wkt}, the_geom)
      AND ${vehicleclause}
    GROUP BY year, month
    ORDER BY year asc, month asc
  `;
  return sql;
};
