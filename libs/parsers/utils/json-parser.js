import { JSONPathJS } from 'jsonpath-js';

const getJsonPath = (path, json) => {
  const query = new JSONPathJS(path);
  const results = query.find(json);

  return results;
};

const getFirstJsonPath = (path, json) => {
  const results = getJsonPath(path, json);

  return results && results.length > 0 ? results[0] : null;
};

export { getJsonPath, getFirstJsonPath };
