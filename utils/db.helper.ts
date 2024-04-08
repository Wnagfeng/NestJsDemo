/*eslint-disable*/
import { SelectQueryBuilder } from 'typeorm';
export const conditionUtils = <T>(
  queryobj: Record<string, unknown>,
  QueryBuilder: SelectQueryBuilder<T>,
) => {
  Object.keys(queryobj).forEach((key) => {
    if (queryobj[key]) {
      QueryBuilder.andWhere(`${key}=:${key}`, { [key]: queryobj[key] });
    }
  });
  return QueryBuilder;
};
// 打印语句
//   console.log(
//     'QueryBuilder.andWhere(' +
//       `${key}=:${key}` +
//       ',' +
//       '{' +
//       [key] +
//       ':' +
//       queryobj[key] +
//       '}' +
//       ')',
//   );
